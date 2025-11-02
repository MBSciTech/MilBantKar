import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './EventPage.css';

// Import QRCode component
import QRCode from 'react-qr-code';

function EventPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    
    // Form states for adding expense
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        description: '',
        paidTo: [],
        splitType: 'equal'
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    
    // Settlement states
    const [showSettlement, setShowSettlement] = useState(false);
    const [settlements, setSettlements] = useState([]);
    const [processingSettlement, setProcessingSettlement] = useState(false);

    // Mobile navigation
    const [activeTab, setActiveTab] = useState('expenses');
    const [showFloatingMenu, setShowFloatingMenu] = useState(false);

    // New features states
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showExpenseDetails, setShowExpenseDetails] = useState(null);
    const [showQuickActions, setShowQuickActions] = useState(false);

    // QR Code state
    const [showQRCode, setShowQRCode] = useState(false);

    // Expense categories
    const categories = [
        { id: 'all', name: 'All', icon: '📦', color: '#667eea' },
        { id: 'food', name: 'Food', icon: '🍕', color: '#f59e0b' },
        { id: 'travel', name: 'Travel', icon: '🚗', color: '#3b82f6' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
        { id: 'utilities', name: 'Utilities', icon: '💡', color: '#10b981' },
        { id: 'other', name: 'Other', icon: '📝', color: '#64748b' }
    ];

    // Quick action amounts
    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    const getCurrentUserId = () => {
        try {
            const raw = localStorage.getItem('userId');
            if (!raw) return null;
            const t = raw.trim();
            if (t.startsWith('"') || t.startsWith('{') || t.startsWith('[')) {
                try { return JSON.parse(t); } catch { return raw; }
            }
            return raw;
        } catch {
            return null;
        }
    };

    // Enhanced notification system
    const showNotification = (message, type) => {
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
                </div>
                <div class="notification-text">
                    <span class="notification-title">${type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Error'}</span>
                    <span class="notification-message">${message}</span>
                </div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Close button functionality
        notification.querySelector('.notification-close').onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        };
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    };

    // Copy event code to clipboard
    const copyEventCode = () => {
        navigator.clipboard.writeText(event.code).then(() => {
            showNotification('Event code copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy event code', 'error');
        });
    };

    // Share event functionality
    const shareEvent = () => {
        const shareData = {
            title: `Join ${event.name} on Milbantkar`,
            text: `Join me in tracking expenses for "${event.name}" on Milbantkar! Use event code: ${event.code}`,
            url: window.location.href,
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(() => {
                copyEventCode();
            });
        } else {
            copyEventCode();
        }
    };

    // Quick amount selection
    const handleQuickAmount = (amount) => {
        setExpenseForm(prev => ({
            ...prev,
            amount: amount.toString()
        }));
        setShowQuickActions(false);
    };

    // Filter expenses based on search and category
    useEffect(() => {
        if (event?.expenses) {
            let filtered = event.expenses;
            
            if (searchTerm) {
                filtered = filtered.filter(expense => 
                    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    expense.paidBy?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    expense.paidTo?.username?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            if (selectedCategory !== 'all') {
                // This would require adding category field to expenses in your backend
                // For now, we'll filter by description keywords
                const categoryKeywords = {
                    food: ['food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'meal', 'cafe'],
                    travel: ['travel', 'taxi', 'uber', 'fuel', 'transport', 'flight', 'train'],
                    shopping: ['shopping', 'store', 'market', 'mall', 'purchase'],
                    entertainment: ['movie', 'concert', 'game', 'entertainment', 'party'],
                    utilities: ['electricity', 'water', 'internet', 'rent', 'bill']
                };
                
                if (categoryKeywords[selectedCategory]) {
                    filtered = filtered.filter(expense => 
                        categoryKeywords[selectedCategory].some(keyword => 
                            expense.description?.toLowerCase().includes(keyword)
                        )
                    );
                }
            }
            
            setFilteredExpenses(filtered);
        }
    }, [event, searchTerm, selectedCategory]);

    useEffect(() => {
        fetchEventDetails();
        fetchUsers();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://milbantkar-1.onrender.com/api/events/${eventId}`);
            if (!response.ok) throw new Error('Failed to fetch event details');
            
            const eventData = await response.json();
            setEvent(eventData);
        } catch (err) {
            setError('Failed to load event details');
            console.error('Error fetching event:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('https://milbantkar-1.onrender.com/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const usersData = await response.json();
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleParticipantSelect = (participant) => {
        if (selectedParticipants.some(p => p._id === participant._id)) {
            setSelectedParticipants(selectedParticipants.filter(p => p._id !== participant._id));
        } else {
            setSelectedParticipants([...selectedParticipants, participant]);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.amount || selectedParticipants.length === 0) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
    
        setSubmitting(true);
        try {
            let currentUserId;
            const userIdFromStorage = localStorage.getItem('userId');
            if (!userIdFromStorage) {
                showNotification('User session error. Please log in again.', 'error');
                return;
            }
            
            const trimmedUserId = userIdFromStorage.trim();
            if (trimmedUserId.startsWith('"') || trimmedUserId.startsWith('{') || trimmedUserId.startsWith('[')) {
                try {
                    currentUserId = JSON.parse(trimmedUserId);
                } catch {
                    currentUserId = userIdFromStorage;
                }
            } else {
                currentUserId = userIdFromStorage;
            }
            
            const amountPerPerson = parseFloat(expenseForm.amount) / selectedParticipants.length;
            
            const expensePromises = selectedParticipants.map(participant => 
                fetch('https://milbantkar-1.onrender.com/api/expense/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paidBy: currentUserId,
                        paidTo: participant._id,
                        amount: amountPerPerson,
                        description: expenseForm.description || 'No description',
                        date: new Date(),
                        eventId
                    })
                }).then(async response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                            return await response.json();
                        }
                        return { success: true, status: response.status };
                    } catch {
                        return { success: true, status: response.status };
                    }
                })
            );
    
            const responses = await Promise.all(expensePromises);
            const failed = responses.some(response => response instanceof Error);
            if (failed) throw new Error('Failed to add some expenses');
    
            setExpenseForm({ amount: '', description: '', paidTo: [], splitType: 'equal' });
            setSelectedParticipants([]);
            setShowAddExpense(false);
            await fetchEventDetails();
            
            showNotification('Expenses added successfully!', 'success');
            
        } catch (err) {
            console.error('Error adding expenses:', err);
            showNotification('Failed to add expenses. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateMinimumTransactions = () => {
        if (!event || !event.expenses || event.expenses.length === 0) {
            showNotification('No expenses to settle', 'warning');
            return [];
        }

        setProcessingSettlement(true);

        const balances = {};
        
        event.participants.forEach(participant => {
            balances[participant._id] = {
                name: participant.username,
                balance: 0
            };
        });

        event.expenses.forEach(expense => {
            const paidById = expense.paidBy._id;
            const paidToId = expense.paidTo._id;
            const amount = expense.amount;

            if (balances[paidById] && balances[paidToId]) {
                balances[paidById].balance += amount;
                balances[paidToId].balance -= amount;
            }
        });

        const creditors = [];
        const debtors = [];

        Object.entries(balances).forEach(([userId, data]) => {
            if (data.balance > 0.01) {
                creditors.push({ id: userId, name: data.name, amount: data.balance });
            } else if (data.balance < -0.01) {
                debtors.push({ id: userId, name: data.name, amount: Math.abs(data.balance) });
            }
        });

        const transactions = [];
        let i = 0, j = 0;

        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor = debtors[j];

            const minAmount = Math.min(creditor.amount, debtor.amount);
            
            transactions.push({
                from: debtor.name,
                to: creditor.name,
                amount: Math.round(minAmount * 100) / 100
            });

            creditor.amount -= minAmount;
            debtor.amount -= minAmount;

            if (creditor.amount < 0.01) i++;
            if (debtor.amount < 0.01) j++;
        }

        setSettlements(transactions);
        setProcessingSettlement(false);
        setShowSettlement(true);
        setActiveTab('settlements');
        
        if (transactions.length === 0) {
            showNotification('All expenses are already settled! 🎉', 'success');
        } else {
            showNotification(`Settlement plan calculated with ${transactions.length} transactions`, 'success');
        }
        
        return transactions;
    };

    const getTotalExpenses = () => {
        if (!event || !event.expenses) return 0;
        return event.expenses.reduce((total, expense) => total + expense.amount, 0);
    };

    const getParticipantBalance = (participantId) => {
        if (!event || !event.expenses) return 0;
        
        let balance = 0;
        event.expenses.forEach(expense => {
            if (expense.paidBy._id === participantId) {
                balance += expense.amount;
            }
            if (expense.paidTo._id === participantId) {
                balance -= expense.amount;
            }
        });
        
        return balance;
    };

    // Get current user's role in the event
    const getUserRole = () => {
        const userId = getCurrentUserId();
        if (!userId || !event) return 'participant';
        
        const isCreator = String(event.createdBy?._id || event.createdBy) === String(userId);
        return isCreator ? 'creator' : 'participant';
    };

    // Conclude Event function (creator only)
    const handleConcludeEvent = async () => {
        if (!eventId) return;
        try {
            let userId = localStorage.getItem('userId');
            if (userId && (userId.startsWith('"') || userId.startsWith('{') || userId.startsWith('['))) {
                try {
                    userId = JSON.parse(userId);
                } catch {
                    // use as fallback
                }
            }
            const response = await fetch(
                `https://milbantkar-1.onrender.com/api/events/${eventId}/conclude`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }) // Send userId in body as required
                }
            );
            const data = await response.json();
            if (response.ok) {
                showNotification("Event concluded successfully!", "success");
                fetchEventDetails();
            } else {
                showNotification(data.message || "Failed to conclude event.", "error");
            }
        } catch (err) {
            showNotification("Network error. Please try again.", "error");
        }
    };

    // Download QR Code as PNG
    const downloadQRCode = () => {
        const svg = document.getElementById('event-qr-code');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `event-${event.code}-qrcode.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            showNotification('QR Code downloaded successfully!', 'success');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">Loading your event...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-card">
                    <i className="fas fa-exclamation-triangle error-icon"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="error-container">
                <div className="error-card">
                    <i className="fas fa-search error-icon"></i>
                    <h3>Event Not Found</h3>
                    <p>The event you're looking for doesn't exist</p>
                </div>
            </div>
        );
    }

    const displayExpenses = searchTerm || selectedCategory !== 'all' ? filteredExpenses : (event.expenses || []);
    const userRole = getUserRole();

    return (
        <div className="event-page">
            {/* Enhanced Animated Background */}
            <div className="animated-bg">
                <div className="bg-circle circle-1"></div>
                <div className="bg-circle circle-2"></div>
                <div className="bg-circle circle-3"></div>
                <div className="bg-particle particle-1"></div>
                <div className="bg-particle particle-2"></div>
                <div className="bg-particle particle-3"></div>
            </div>

            {/* Enhanced Mobile Header */}
            <div className="mobile-header">
                <div className="mobile-header-content">
                    <div className="mobile-header-main">
                        <div className="event-avatar">
                            <div className="avatar-icon">
                                {event.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="mobile-event-info">
                            <h1 className="mobile-event-title">{event.name}</h1>
                            <div className="mobile-event-meta">
                                <span className={`mobile-event-badge ${event.isClosed ? 'concluded' : 'active'}`}>
                                    <i className={`fas ${event.isClosed ? 'fa-check-circle' : 'fa-clock'}`}></i>
                                    {event.isClosed ? 'Concluded' : 'Active'}
                                </span>
                                <span className="mobile-event-code">#{event.code}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mobile-header-actions">
                        <button 
                            className="mobile-action-btn qr-btn"
                            onClick={() => setShowQRCode(true)}
                            title="Show QR Code"
                        >
                            <i className="fas fa-qrcode"></i>
                        </button>
                        <button 
                            className="mobile-action-btn share-btn"
                            onClick={shareEvent}
                            title="Share Event"
                        >
                            <i className="fas fa-share-alt"></i>
                        </button>
                        <button 
                            className="mobile-action-btn menu-btn"
                            onClick={() => setShowFloatingMenu(!showFloatingMenu)}
                        >
                            <i className={`fas ${showFloatingMenu ? 'fa-times' : 'fa-ellipsis-v'}`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQRCode && (
                <div className="modal-overlay qr-modal-overlay" onClick={() => setShowQRCode(false)}>
                    <div className="modal-content qr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header qr-modal-header">
                            <h3>
                                <i className="fas fa-qrcode"></i>
                                Event QR Code
                            </h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowQRCode(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body qr-modal-body">
                            <div className="qr-code-container">
                                <div className="qr-code-card">
                                    {/* Using react-qr-code */}
                                    <QRCode
                                        id="event-qr-code"
                                        value={event.code}
                                        size={300}
                                        bgColor="#ffffff"
                                        fgColor="#667eea"
                                        level="H"
                                        style={{ 
                                            padding: '8px', 
                                            backgroundColor: '#ffffff',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <div className="qr-code-info">
                                        <h4 className="event-name">{event.name}</h4>
                                        <p className="event-code-text">Code: <strong>{event.code}</strong></p>
                                        <p className="qr-instruction">Scan this QR code to join the event</p>
                                    </div>
                                </div>
                            </div>
                            <div className="qr-actions">
                                <button 
                                    className="btn-download-qr"
                                    onClick={downloadQRCode}
                                >
                                    <i className="fas fa-download"></i>
                                    Download QR Code
                                </button>
                                <button 
                                    className="btn-copy-code"
                                    onClick={copyEventCode}
                                >
                                    <i className="fas fa-copy"></i>
                                    Copy Event Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Floating Action Menu */}
            {showFloatingMenu && (
                <div className="floating-action-menu">
                    <div className="floating-menu-content">
                        <button
                            className="floating-menu-item primary"
                            onClick={() => {
                                setShowAddExpense(true);
                                setShowFloatingMenu(false);
                                setActiveTab('expenses');
                            }}
                            disabled={event.isClosed}
                        >
                            <div className="menu-item-icon">
                                <i className="fas fa-plus"></i>
                            </div>
                            <span>Add Expense</span>
                        </button>
                        
                        <button
                            className="floating-menu-item success"
                            onClick={() => {
                                calculateMinimumTransactions();
                                setShowFloatingMenu(false);
                                setActiveTab('settlements');
                            }}
                            disabled={processingSettlement || !event.expenses?.length}
                        >
                            <div className="menu-item-icon">
                                <i className="fas fa-calculator"></i>
                            </div>
                            <span>Settle Up</span>
                        </button>

                        <button
                            className="floating-menu-item info"
                            onClick={() => {
                                setShowQRCode(true);
                                setShowFloatingMenu(false);
                            }}
                        >
                            <div className="menu-item-icon">
                                <i className="fas fa-qrcode"></i>
                            </div>
                            <span>Show QR Code</span>
                        </button>

                        {!event.isClosed && userRole === 'creator' && (
                            <button
                                className="floating-menu-item warning"
                                onClick={() => {
                                    handleConcludeEvent();
                                    setShowFloatingMenu(false);
                                }}
                            >
                                <div className="menu-item-icon">
                                    <i className="fas fa-flag-checkered"></i>
                                </div>
                                <span>Conclude</span>
                            </button>
                        )}

                        <button
                            className="floating-menu-item secondary"
                            onClick={() => {
                                shareEvent();
                                setShowFloatingMenu(false);
                            }}
                        >
                            <div className="menu-item-icon">
                                <i className="fas fa-share-alt"></i>
                            </div>
                            <span>Share Event</span>
                        </button>
                    </div>
                    <div className="floating-menu-overlay" onClick={() => setShowFloatingMenu(false)}></div>
                </div>
            )}

            <div className="container-fluid">
                {/* Enhanced Event Header */}
                <div className="event-header">
                    <div className="event-header-content">
                        <div className="event-info">
                            <div className="event-meta">
                            <div className="event-badge">
                                {event.isClosed ? (
                                    <span className="badge-concluded">
                                        <i className="fas fa-check-circle"></i> Concluded
                                    </span>
                                ) : (
                                    <span className="badge-active">
                                        <i className="fas fa-clock"></i> Active
                                    </span>
                                )}
                                </div>
                                <div className="event-role-badge">
                                    <i className={`fas ${userRole === 'creator' ? 'fa-crown' : 'fa-user'}`}></i>
                                    {userRole === 'creator' ? 'Event Creator' : 'Participant'}
                                </div>
                            </div>
                            <h1 className="event-title">{event.name}</h1>
                            <p className="event-description">{event.description}</p>
                            <div className="event-stats">
                                <div className="stat-item">
                                    <div className="stat-icon">
                                    <i className="fas fa-users"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value">{event.participants?.length || 0}</div>
                                        <div className="stat-label">Participants</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">
                                    <i className="fas fa-receipt"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value">{event.expenses?.length || 0}</div>
                                        <div className="stat-label">Expenses</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">
                                    <i className="fas fa-rupee-sign"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value">₹{getTotalExpenses().toFixed(2)}</div>
                                        <div className="stat-label">Total Spent</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="event-code-card">
                            <div className="code-header">
                                <i className="fas fa-qrcode"></i>
                                <span className="code-label">Event Code</span>
                            </div>
                            <div className="event-code">{event.code}</div>
                            <div className="code-hint">Share this code to invite others</div>
                            <div className="code-actions">
                                <button 
                                    className="btn-qr-code"
                                    onClick={() => setShowQRCode(true)}
                                >
                                    <i className="fas fa-qrcode"></i>
                                    Show QR
                                </button>
                                <button className="btn-copy-code" onClick={copyEventCode}>
                                    <i className="fas fa-copy"></i>
                                    Copy Code
                                </button>
                                <button className="btn-share-event" onClick={shareEvent}>
                                    <i className="fas fa-share-alt"></i>
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="row main-content">
                    {/* Enhanced Sidebar */}
                    <div className="col-lg-4 col-md-12 sidebar">
                        {/* Enhanced Participants Card */}
                        <div className="card-modern participants-card">
                            <div className="card-header-modern">
                                <h5>
                                    <i className="fas fa-users"></i>
                                    Participants
                                    <span className="participant-count">{event.participants?.length || 0}</span>
                                </h5>
                                <button className="btn-invite" onClick={shareEvent}>
                                    <i className="fas fa-user-plus"></i>
                                    Invite
                                </button>
                            </div>
                            <div className="participants-list">
                                {event.participants?.map((participant, index) => {
                                    const balance = getParticipantBalance(participant._id);
                                    const isCurrentUser = String(participant._id) === String(getCurrentUserId());
                                    return (
                                        <div key={participant._id} className={`participant-item ${index === 0 ? 'admin' : ''} ${isCurrentUser ? 'current-user' : ''}`}>
                                        <div className="participant-avatar">
                                            <img
                                                    src={participant.profilePic || `https://ui-avatars.com/api/?name=${participant.username}&background=667eea&color=fff&size=50`}
                                                alt={participant.username}
                                            />
                                            {index === 0 && <div className="admin-badge"><i className="fas fa-crown"></i></div>}
                                                {isCurrentUser && <div className="current-user-badge"><i className="fas fa-user"></i></div>}
                                        </div>
                                        <div className="participant-info">
                                                <div className="participant-name">
                                                    {participant.username}
                                                    {isCurrentUser && <span className="you-badge">You</span>}
                                                </div>
                                            <div className="participant-email">{participant.email}</div>
                                                <div className={`participant-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                                                    <span className="balance-label">{balance >= 0 ? 'Owes you' : 'You owe'}</span>
                                                    <span className="balance-amount">₹{Math.abs(balance).toFixed(2)}</span>
                                        </div>
                                    </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="card-modern action-card">
                            <div className="action-buttons">
                                <button
                                    className={`btn-action btn-primary ${showAddExpense ? 'active' : ''}`}
                                    onClick={() => setShowAddExpense(!showAddExpense)}
                                    disabled={event.isClosed}
                                >
                                    <div className="btn-icon">
                                        <i className="fas fa-plus"></i>
                                    </div>
                                    <div className="btn-text">
                                        <span>Add Expense</span>
                                        <small>Split the bill</small>
                                    </div>
                                </button>
                                
                                <button
                                    className="btn-action btn-success"
                                    onClick={() => {
                                        calculateMinimumTransactions();
                                        setActiveTab('settlements');
                                    }}
                                    disabled={processingSettlement || !event.expenses?.length}
                                >
                                    <div className="btn-icon">
                                        {processingSettlement ? (
                                            <div className="mini-spinner"></div>
                                        ) : (
                                            <i className="fas fa-calculator"></i>
                                        )}
                                    </div>
                                    <div className="btn-text">
                                        <span>Settle Up</span>
                                        <small>Calculate debts</small>
                                    </div>
                                </button>

                                <button
                                    className="btn-action btn-info"
                                    onClick={() => setShowQRCode(true)}
                                >
                                    <div className="btn-icon">
                                        <i className="fas fa-qrcode"></i>
                                    </div>
                                    <div className="btn-text">
                                        <span>QR Code</span>
                                        <small>Share event</small>
                                    </div>
                                </button>

                                {!event.isClosed && userRole === 'creator' && (
                                    <button
                                        className="btn-action btn-warning"
                                        onClick={handleConcludeEvent}
                                    >
                                        <div className="btn-icon">
                                            <i className="fas fa-flag-checkered"></i>
                            </div>
                                        <div className="btn-text">
                                            <span>Conclude Event</span>
                                            <small>Mark as closed</small>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Main Content Area */}
                    <div className="col-lg-8 col-md-12 main-content-area">
                        {/* Enhanced Mobile Tab Navigation */}
                        <div className="mobile-tab-nav">
                            <button 
                                className={`mobile-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                                onClick={() => setActiveTab('expenses')}
                            >
                                <div className="tab-icon">
                                    <i className="fas fa-receipt"></i>
                                </div>
                                <span className="tab-label">Expenses</span>
                            </button>
                            <button 
                                className={`mobile-tab ${activeTab === 'participants' ? 'active' : ''}`}
                                onClick={() => setActiveTab('participants')}
                            >
                                <div className="tab-icon">
                                    <i className="fas fa-users"></i>
                                </div>
                                <span className="tab-label">People</span>
                            </button>
                            <button 
                                className={`mobile-tab ${activeTab === 'settlements' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('settlements');
                                    if (!showSettlement) {
                                        calculateMinimumTransactions();
                                    }
                                }}
                            >
                                <div className="tab-icon">
                                    <i className="fas fa-calculator"></i>
                                </div>
                                <span className="tab-label">Settle</span>
                            </button>
                            <button 
                                className="mobile-tab action-tab"
                                onClick={() => setShowFloatingMenu(true)}
                            >
                                <div className="tab-icon">
                                    <i className="fas fa-plus"></i>
                                </div>
                                <span className="tab-label">Add</span>
                            </button>
                        </div>

                        {/* Enhanced Add Expense Form */}
                        {showAddExpense && (
                            <div className="card-modern expense-form-card">
                                <div className="card-header-modern green">
                                    <h5>
                                        <i className="fas fa-plus-circle"></i>
                                        Add New Expense
                                    </h5>
                                    <button 
                                        className="btn-close-modern"
                                        onClick={() => setShowAddExpense(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <form onSubmit={handleAddExpense} className="expense-form">
                                    {/* Quick Amount Selection */}
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">
                                            Total Amount
                                            <button 
                                                type="button"
                                                className="btn-quick-amounts"
                                                onClick={() => setShowQuickActions(!showQuickActions)}
                                            >
                                                <i className="fas fa-bolt"></i>
                                                Quick Amounts
                                            </button>
                                        </label>
                                        {showQuickActions && (
                                            <div className="quick-amounts-grid">
                                                {quickAmounts.map(amount => (
                                                    <button
                                                        key={amount}
                                                        type="button"
                                                        className="quick-amount-btn"
                                                        onClick={() => handleQuickAmount(amount)}
                                                    >
                                                        ₹{amount}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="amount-input-container">
                                            <div className="currency-symbol">₹</div>
                                            <input
                                                type="number"
                                                className="amount-input"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                value={expenseForm.amount}
                                                onChange={(e) => setExpenseForm({
                                                    ...expenseForm,
                                                    amount: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="form-label-modern">
                                            Split Between ({selectedParticipants.length} selected)
                                            {expenseForm.amount && selectedParticipants.length > 0 && (
                                                <span className="amount-per-person">
                                                    ₹{(expenseForm.amount / selectedParticipants.length).toFixed(2)} per person
                                                </span>
                                            )}
                                        </label>
                                        <div className="participant-selector">
                                            {event.participants?.map((participant) => (
                                                <div
                                                    key={participant._id}
                                                    className={`participant-option ${selectedParticipants.some(p => p._id === participant._id) ? 'selected' : ''}`}
                                                    onClick={() => handleParticipantSelect(participant)}
                                                >
                                                    <div className="option-avatar">
                                                        <img
                                                            src={participant.profilePic || `https://ui-avatars.com/api/?name=${participant.username}&background=667eea&color=fff&size=60`}
                                                            alt={participant.username}
                                                        />
                                                        {selectedParticipants.some(p => p._id === participant._id) && (
                                                            <div className="selected-indicator">
                                                                <i className="fas fa-check"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="option-name">{participant.username}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Description</label>
                                        <textarea
                                            className="description-input"
                                            placeholder="What was this expense for? (e.g., Dinner at restaurant, Movie tickets, etc.)"
                                            rows="3"
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({
                                                ...expenseForm,
                                                description: e.target.value
                                            })}
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-submit"
                                            disabled={submitting || selectedParticipants.length === 0}
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="submit-spinner"></div>
                                                    <span>Adding Expenses...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save"></i>
                                                    <span>Add Expenses</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Enhanced Tab Content */}
                        <div className="tab-content">
                            {/* Enhanced Expenses Tab */}
                            {(activeTab === 'expenses' || window.innerWidth >= 768) && (
                                <div className="card-modern expenses-card">
                                    <div className="card-header-modern">
                                        <h5>
                                            <i className="fas fa-history"></i>
                                            Recent Expenses
                                        </h5>
                                        <div className="header-actions">
                                            <div className="search-box">
                                                <i className="fas fa-search"></i>
                                                <input
                                                    type="text"
                                                    placeholder="Search expenses..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="search-input"
                                                />
                                                {searchTerm && (
                                    <button 
                                                        className="clear-search"
                                                        onClick={() => setSearchTerm('')}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                                )}
                                </div>
                                            <div className="category-filter">
                                                <select 
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className="category-select"
                                                >
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.icon} {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                    </div>
                                    <span className="total-amount">Total: ₹{getTotalExpenses().toFixed(2)}</span>
                                </div>
                            </div>
                            
                                    {displayExpenses.length > 0 ? (
                                <div className="expenses-list">
                                            {displayExpenses
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((expense, index) => (
                                                <div 
                                                    key={expense._id} 
                                                    className={`expense-item ${index === 0 ? 'latest' : ''}`}
                                                    onClick={() => setShowExpenseDetails(expense)}
                                                >
                                            <div className="expense-users">
                                                <div className="expense-from">
                                                    <img
                                                        src={expense.paidBy?.profilePic || `https://ui-avatars.com/api/?name=${expense.paidBy?.username}&background=28a745&color=fff&size=45`}
                                                        alt={expense.paidBy?.username}
                                                    />
                                                    <div className="user-details">
                                                        <div className="user-name">{expense.paidBy?.username}</div>
                                                        <div className="user-role">paid</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="expense-arrow">
                                                    <i className="fas fa-arrow-right"></i>
                                                </div>
                                                
                                                <div className="expense-to">
                                                    <img
                                                        src={expense.paidTo?.profilePic || `https://ui-avatars.com/api/?name=${expense.paidTo?.username}&background=dc3545&color=fff&size=45`}
                                                        alt={expense.paidTo?.username}
                                                    />
                                                    <div className="user-details">
                                                        <div className="user-name">{expense.paidTo?.username}</div>
                                                        <div className="user-role">received</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="expense-details">
                                                <div className="expense-amount">₹{expense.amount?.toFixed(2)}</div>
                                                <div className="expense-description">{expense.description || 'No description'}</div>
                                                <div className="expense-meta">
                                                    <span className="expense-date">
                                                        <i className="fas fa-calendar"></i>
                                                        {new Date(expense.date).toLocaleDateString()}
                                                    </span>
                                                    <span className={`expense-status ${expense.status ? 'settled' : 'pending'}`}>
                                                        <i className={`fas ${expense.status ? 'fa-check-circle' : 'fa-clock'}`}></i>
                                                        {expense.status ? 'Settled' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {index === 0 && <div className="latest-indicator">Latest</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-expenses">
                                    <div className="empty-icon">
                                        <i className="fas fa-receipt"></i>
                                    </div>
                                            <h4>No expenses found</h4>
                                            <p>
                                                {searchTerm || selectedCategory !== 'all' 
                                                    ? 'Try adjusting your search or filter criteria'
                                                    : 'Start by adding your first expense to track shared costs'
                                                }
                                            </p>
                                    <button
                                        className="btn-empty-action"
                                                onClick={() => {
                                                    setShowAddExpense(true);
                                                    setSearchTerm('');
                                                    setSelectedCategory('all');
                                                }}
                                    >
                                        <i className="fas fa-plus"></i>
                                        Add First Expense
                                    </button>
                                </div>
                            )}
                        </div>
                            )}

                            {/* Enhanced Settlements Tab */}
                            {(activeTab === 'settlements' || (showSettlement && window.innerWidth >= 768)) && settlements.length > 0 && (
                                <div className="card-modern settlement-card">
                                    <div className="card-header-modern blue">
                                        <h5>
                                            <i className="fas fa-balance-scale"></i>
                                            Settlement Plan
                                        </h5>
                                        <div className="header-actions">
                                            <span className="transactions-count">{settlements.length} transactions</span>
                                            <button 
                                                className="btn-close-modern"
                                                onClick={() => {
                                                    setShowSettlement(false);
                                                    setActiveTab('expenses');
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                    </div>
                </div>
                                    
                                    <div className="settlement-content">
                                        <div className="settlement-info">
                                            <div className="info-badge">
                                                <i className="fas fa-magic"></i>
                                                Optimized settlement plan
                                            </div>
                                            <p className="settlement-description">
                                                Follow this plan to settle all debts with minimum transactions
                                            </p>
            </div>
                                        
                                        <div className="settlements-list">
                                            {settlements.map((settlement, index) => (
                                                <div key={index} className="settlement-item">
                                                    <div className="settlement-number">{index + 1}</div>
                                                    <div className="settlement-flow">
                                                        <div className="from-user">
                                                            <div className="user-avatar">
                                                                <img
                                                                    src={`https://ui-avatars.com/api/?name=${settlement.from}&background=ff6b6b&color=fff&size=40`}
                                                                    alt={settlement.from}
                                                                />
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">{settlement.from}</span>
                                                                <span className="user-role">pays</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flow-arrow">
                                                            <i className="fas fa-arrow-right"></i>
                                                            <div className="amount-badge">₹{settlement.amount.toFixed(2)}</div>
                                                        </div>
                                                        
                                                        <div className="to-user">
                                                            <div className="user-avatar">
                                                                <img
                                                                    src={`https://ui-avatars.com/api/?name=${settlement.to}&background=51cf66&color=fff&size=40`}
                                                                    alt={settlement.to}
                                                                />
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">{settlement.to}</span>
                                                                <span className="user-role">receives</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="settlement-actions">
                                            <button className="btn-settlement-done">
                                                <i className="fas fa-check"></i>
                                                Mark as Settled
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Expense Details Modal */}
            {showExpenseDetails && (
                <div className="modal-overlay" onClick={() => setShowExpenseDetails(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Expense Details</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowExpenseDetails(null)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="expense-detail-item">
                                <label>Amount</label>
                                <span className="detail-value">₹{showExpenseDetails.amount?.toFixed(2)}</span>
                            </div>
                            <div className="expense-detail-item">
                                <label>Description</label>
                                <span className="detail-value">{showExpenseDetails.description || 'No description'}</span>
                            </div>
                            <div className="expense-detail-item">
                                <label>Paid By</label>
                                <span className="detail-value">{showExpenseDetails.paidBy?.username}</span>
                            </div>
                            <div className="expense-detail-item">
                                <label>Paid To</label>
                                <span className="detail-value">{showExpenseDetails.paidTo?.username}</span>
                            </div>
                            <div className="expense-detail-item">
                                <label>Date</label>
                                <span className="detail-value">
                                    {new Date(showExpenseDetails.date).toLocaleDateString()} at {' '}
                                    {new Date(showExpenseDetails.date).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="expense-detail-item">
                                <label>Status</label>
                                <span className={`detail-value status ${showExpenseDetails.status ? 'settled' : 'pending'}`}>
                                    <i className={`fas ${showExpenseDetails.status ? 'fa-check-circle' : 'fa-clock'}`}></i>
                                    {showExpenseDetails.status ? 'Settled' : 'Pending'}
                                </span>
                            </div>
                        </div>
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

export default EventPage;