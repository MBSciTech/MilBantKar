import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://milbantkar-1.onrender.com';

function AdminPanel() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswords, setShowPasswords] = useState({});

    // Form states
    const [showUserForm, setShowUserForm] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showPollForm, setShowPollForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        isAdmin: false,
        profilePic: ''
    });
    const [eventForm, setEventForm] = useState({
        name: '',
        description: '',
        createdBy: '',
        isClosed: false
    });
    const [pollForm, setPollForm] = useState({
        message: '',
        receiver: '',
        options: ['', '']
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Get admin username from localStorage
            const adminUsername = localStorage.getItem('username');
            if (!adminUsername) {
                setError('Admin access required. Please log in.');
                return;
            }

            const headers = {
                // Use lower-case header key to match Node's lower-cased req.headers
                'adminusername': adminUsername
            };

            const [usersRes, eventsRes, expensesRes, alertsRes, pollsRes] = await Promise.all([
                fetch(`${API_BASE}/api/users`),
                fetch(`${API_BASE}/api/admin/events`, { headers }),
                fetch(`${API_BASE}/api/admin/expenses`, { headers }),
                fetch(`${API_BASE}/api/alerts`),
                fetch(`${API_BASE}/api/admin/polls`, { headers })
            ]);

            // Check if responses are ok
            if (!usersRes.ok) throw new Error('Failed to fetch users');
            if (!eventsRes.ok) throw new Error('Failed to fetch events');
            if (!expensesRes.ok) throw new Error('Failed to fetch expenses');
            if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
            if (!pollsRes.ok) throw new Error('Failed to fetch polls');

            const [usersData, eventsData, expensesData, alertsData, pollsData] = await Promise.all([
                usersRes.json(),
                eventsRes.json(),
                expensesRes.json(),
                alertsRes.json(),
                pollsRes.json()
            ]);

            setUsers(usersData);
            setEvents(eventsData);
            setExpenses(expensesData);
            setAlerts(alertsData);
            setPolls(pollsData);
        } catch (err) {
            setError('Failed to fetch data: ' + err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const adminUsername = localStorage.getItem('username');
            const headers = {
                'Content-Type': 'application/json',
                'adminUsername': adminUsername
            };

            const url = editingItem 
                ? `${API_BASE}/api/admin/users/${editingItem._id}`
                : `${API_BASE}/api/admin/users`;
            
            const method = editingItem ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(userForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save user');
            }
            
            setSuccess(editingItem ? 'User updated successfully' : 'User created successfully');
            setShowUserForm(false);
            setEditingItem(null);
            setUserForm({ username: '', email: '', phone: '', password: '', isAdmin: false, profilePic: '' });
            fetchAllData();
        } catch (err) {
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const adminUsername = localStorage.getItem('username');
            const headers = {
                'Content-Type': 'application/json',
                'adminUsername': adminUsername
            };

            // Validate createdBy field - should be a valid user ID
            if (!eventForm.createdBy) {
                throw new Error('Created By field is required');
            }

            // Check if createdBy is a valid user ID
            const userExists = users.find(user => user._id === eventForm.createdBy);
            if (!userExists) {
                throw new Error('Invalid user ID for Created By field');
            }

            const url = editingItem 
                ? `${API_BASE}/api/admin/events/${editingItem._id}`
                : `${API_BASE}/api/admin/events`;
            
            const method = editingItem ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(eventForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save event');
            }
            
            setSuccess(editingItem ? 'Event updated successfully' : 'Event created successfully');
            setShowEventForm(false);
            setEditingItem(null);
            setEventForm({ name: '', description: '', createdBy: '', isClosed: false });
            fetchAllData();
        } catch (err) {
            setError(err.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    const handlePollOptionChange = (index, value) => {
        setPollForm(prev => ({
            ...prev,
            options: prev.options.map((option, idx) => (idx === index ? value : option))
        }));
    };

    const addPollOption = () => {
        setPollForm(prev => {
            if (prev.options.length >= 6) return prev;
            return { ...prev, options: [...prev.options, ''] };
        });
    };

    const removePollOption = (index) => {
        setPollForm(prev => {
            if (prev.options.length <= 2) return prev;
            return {
                ...prev,
                options: prev.options.filter((_, idx) => idx !== index)
            };
        });
    };

    const handlePollSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const adminUsername = localStorage.getItem('username');
            const cleanedOptions = pollForm.options
                .map(option => option.trim())
                .filter(Boolean);

            if (cleanedOptions.length < 2) {
                throw new Error('Please provide at least 2 poll options');
            }

            const response = await fetch(`${API_BASE}/api/admin/polls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    adminUsername
                },
                body: JSON.stringify({
                    message: pollForm.message.trim(),
                    receiver: pollForm.receiver || undefined,
                    pollOptions: cleanedOptions
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create poll');
            }

            setSuccess('Poll created successfully');
            setShowPollForm(false);
            setPollForm({ message: '', receiver: '', options: ['', ''] });
            fetchAllData();
        } catch (err) {
            setError(err.message || 'Failed to create poll');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        
        setLoading(true);
        try {
            const adminUsername = localStorage.getItem('username');
            const headers = {
                'adminUsername': adminUsername
            };

            const response = await fetch(`${API_BASE}/api/admin/${type}/${id}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete ${type}`);
            }
            
            setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
            fetchAllData();
        } catch (err) {
            setError(err.message || `Failed to delete ${type}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type, item) => {
        setEditingItem(item);
        if (type === 'user') {
            setUserForm({
                username: item.username || '',
                email: item.email || '',
                phone: item.phone || '',
                password: '',
                isAdmin: item.isAdmin || false,
                profilePic: item.profilePic || ''
            });
            setShowUserForm(true);
        } else if (type === 'event') {
            setEventForm({
                name: item.name || '',
                description: item.description || '',
                createdBy: item.createdBy?._id || item.createdBy || '',
                isClosed: item.isClosed || false
            });
            setShowEventForm(true);
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(clearMessages, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    if (loading && users.length === 0) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading admin panel...</p>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1><i className="fas fa-shield-alt"></i> Admin Panel</h1>
                <p>Manage users, events, expenses, alerts, and polls</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i>
                    {success}
                </div>
            )}

            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <i className="fas fa-users"></i> Users ({users.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    <i className="fas fa-calendar-alt"></i> Events ({events.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expenses')}
                >
                    <i className="fas fa-receipt"></i> Expenses ({expenses.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    <i className="fas fa-bell"></i> Alerts ({alerts.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`}
                    onClick={() => setActiveTab('polls')}
                >
                    <i className="fas fa-chart-pie"></i> Polls ({polls.length})
                </button>
            </div>

            <div className="admin-content">
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2>User Management</h2>
                            <button 
                                className="btn-primary"
                                onClick={() => {
                                    setEditingItem(null);
                                    setUserForm({ username: '', email: '', phone: '', password: '', isAdmin: false, profilePic: '' });
                                    setShowUserForm(true);
                                }}
                            >
                                <i className="fas fa-plus"></i> Add User
                            </button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Avatar</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Password</th>
                                        <th>Admin</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <img 
                                                    src={user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=40`}
                                                    alt={user.username}
                                                    className="user-avatar"
                                                />
                                            </td>
                                            <td>{user.username || 'N/A'}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || 'N/A'}</td>
                                            <td>
                                                <span style={{ fontFamily: 'monospace' }}>
                                                    {showPasswords[user._id] ? (user.passwordHash || 'N/A') : '********'}
                                                </span>
                                                <button 
                                                    className="btn-icon"
                                                    style={{ marginLeft: '8px' }}
                                                    title={showPasswords[user._id] ? 'Hide password' : 'Show password'}
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, [user._id]: !prev[user._id] }))}
                                                >
                                                    <i className={`fas ${showPasswords[user._id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.isAdmin ? 'admin' : 'user'}`}>
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleEdit('user', user)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDelete('users', user._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2>Event Management</h2>
                            <button 
                                className="btn-primary"
                                onClick={() => {
                                    setEditingItem(null);
                                    setEventForm({ name: '', description: '', createdBy: '', isClosed: false });
                                    setShowEventForm(true);
                                }}
                            >
                                <i className="fas fa-plus"></i> Add Event
                            </button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Code</th>
                                        <th>Created By</th>
                                        <th>Participants</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event._id}>
                                            <td>{event.name}</td>
                                            <td>{event.description || 'N/A'}</td>
                                            <td><code>{event.code}</code></td>
                                            <td>{event.createdBy?.username || 'N/A'}</td>
                                            <td>{event.participants?.length || 0}</td>
                                            <td>
                                                <span className={`badge ${event.isClosed ? 'closed' : 'active'}`}>
                                                    {event.isClosed ? 'Closed' : 'Active'}
                                                </span>
                                            </td>
                                            <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleEdit('event', event)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDelete('events', event._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2>Expense Management</h2>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Paid By</th>
                                        <th>Paid To</th>
                                        <th>Amount</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(expense => (
                                        <tr key={expense._id}>
                                            <td>{expense.paidBy?.username || 'N/A'}</td>
                                            <td>{expense.paidTo?.username || 'N/A'}</td>
                                            <td>₹{expense.amount?.toFixed(2)}</td>
                                            <td>{expense.description || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${expense.status ? 'settled' : 'pending'}`}>
                                                    {expense.status ? 'Settled' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDelete('expenses', expense._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2>Alert Management</h2>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sender</th>
                                        <th>Receiver</th>
                                        <th>Message</th>
                                        <th>Type</th>
                                        <th>Seen</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map(alert => (
                                        <tr key={alert._id}>
                                            <td>{alert.sender?.username || 'N/A'}</td>
                                            <td>{alert.receiver?.username || 'All'}</td>
                                            <td>{alert.message}</td>
                                            <td>
                                                <span className={`badge ${alert.type}`}>
                                                    {alert.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${alert.seen ? 'seen' : 'unseen'}`}>
                                                    {alert.seen ? 'Seen' : 'Unseen'}
                                                </span>
                                            </td>
                                            <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDelete('alerts', alert._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Polls Tab */}
                {activeTab === 'polls' && (
                    <div className="tab-content">
                        <div className="content-header">
                            <h2>Poll Management</h2>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setShowPollForm(true);
                                    setPollForm({ message: '', receiver: '', options: ['', ''] });
                                }}
                            >
                                <i className="fas fa-plus"></i> Create Poll
                            </button>
                        </div>

                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Question</th>
                                        <th>Audience</th>
                                        <th>Options</th>
                                        <th>Total Votes</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {polls.map(poll => {
                                        const totalVotes = (poll.pollOptions || []).reduce((sum, option) => sum + (option.votes?.length || 0), 0);
                                        return (
                                            <tr key={poll._id}>
                                                <td>{poll.message}</td>
                                                <td>{poll.receiver?.username || 'All Users'}</td>
                                                <td>
                                                    <div style={{ display: 'grid', gap: '4px' }}>
                                                        {(poll.pollOptions || []).map((option, index) => (
                                                            <span key={`${poll._id}-${index}`}>
                                                                {option.option} ({option.votes?.length || 0})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>{totalVotes}</td>
                                                <td>{new Date(poll.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete('polls', poll._id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* User Form Modal */}
            {showUserForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit User' : 'Add New User'}</h3>
                            <button 
                                className="btn-close"
                                onClick={() => setShowUserForm(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={userForm.phone}
                                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                                    required={!editingItem}
                                    placeholder={editingItem ? "Leave blank to keep current password" : ""}
                                />
                            </div>
                            <div className="form-group">
                                <label>Profile Picture URL</label>
                                <input
                                    type="url"
                                    value={userForm.profilePic}
                                    onChange={(e) => setUserForm({...userForm, profilePic: e.target.value})}
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={userForm.isAdmin}
                                        onChange={(e) => setUserForm({...userForm, isAdmin: e.target.checked})}
                                    />
                                    Admin User
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowUserForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Form Modal */}
            {showEventForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Event' : 'Add New Event'}</h3>
                            <button 
                                className="btn-close"
                                onClick={() => setShowEventForm(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleEventSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Event Name</label>
                                <input
                                    type="text"
                                    value={eventForm.name}
                                    onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Created By (User ID)</label>
                                <select
                                    value={eventForm.createdBy}
                                    onChange={(e) => setEventForm({...eventForm, createdBy: e.target.value})}
                                    required
                                >
                                    <option value="">Select a user</option>
                                    {users.map(user => (
                                        <option key={user._id} value={user._id}>
                                            {user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={eventForm.isClosed}
                                        onChange={(e) => setEventForm({...eventForm, isClosed: e.target.checked})}
                                    />
                                    Event Closed
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEventForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Poll Form Modal */}
            {showPollForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create Poll</h3>
                            <button
                                className="btn-close"
                                onClick={() => setShowPollForm(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handlePollSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Poll Question</label>
                                <input
                                    type="text"
                                    value={pollForm.message}
                                    onChange={(e) => setPollForm({ ...pollForm, message: e.target.value })}
                                    placeholder="What should we do next weekend?"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Audience</label>
                                <select
                                    value={pollForm.receiver}
                                    onChange={(e) => setPollForm({ ...pollForm, receiver: e.target.value })}
                                >
                                    <option value="">All users</option>
                                    {users.map(user => (
                                        <option key={user._id} value={user._id}>
                                            {user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {pollForm.options.map((option, index) => (
                                <div className="form-group" key={`poll-option-${index}`}>
                                    <label>Option {index + 1}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() => removePollOption(index)}
                                            disabled={pollForm.options.length <= 2}
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                                <button type="button" className="btn-secondary" onClick={addPollOption} disabled={pollForm.options.length >= 6}>
                                    Add Option
                                </button>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowPollForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Publishing...' : 'Publish Poll'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FontAwesome */}
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            />
        </div>
    );
}

export default AdminPanel;