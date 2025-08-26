import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './EventPage.css'; // We'll create this CSS file

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
        paidTo: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    
    // Settlement states
    const [showSettlement, setShowSettlement] = useState(false);
    const [settlements, setSettlements] = useState([]);
    const [processingSettlement, setProcessingSettlement] = useState(false);

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
            console.log(eventData);
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
        setSelectedParticipant(participant);
        setExpenseForm({
            ...expenseForm,
            paidTo: participant._id
        });
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.amount || !expenseForm.paidTo) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const currentUserId = JSON.parse(localStorage.getItem('userId') || '{}');
            
            const response = await fetch('https://milbantkar-1.onrender.com/api/expense/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paidBy: currentUserId,
                    paidTo: expenseForm.paidTo,
                    amount: parseFloat(expenseForm.amount),
                    description: expenseForm.description || 'No description',
                    date: new Date()
                })
            });

            if (!response.ok) throw new Error('Failed to add expense');

            // Reset form and refresh event details
            setExpenseForm({ amount: '', description: '', paidTo: '' });
            setSelectedParticipant(null);
            setShowAddExpense(false);
            await fetchEventDetails();
            
            // Success animation
            const successAlert = document.createElement('div');
            successAlert.className = 'success-toast';
            successAlert.innerHTML = '<i class="fas fa-check-circle"></i> Expense added successfully!';
            document.body.appendChild(successAlert);
            setTimeout(() => {
                successAlert.remove();
            }, 3000);
            
        } catch (err) {
            alert('Failed to add expense');
            console.error('Error adding expense:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Debt Settlement Algorithm
    const calculateMinimumTransactions = () => {
        if (!event || !event.expenses || event.expenses.length === 0) {
            return [];
        }

        setProcessingSettlement(true);

        // Calculate net balance for each participant
        const balances = {};
        
        // Initialize balances for all participants
        event.participants.forEach(participant => {
            balances[participant._id] = {
                name: participant.username,
                balance: 0
            };
        });

        // Calculate net balances from expenses
        event.expenses.forEach(expense => {
            const paidById = expense.paidBy._id;
            const paidToId = expense.paidTo._id;
            const amount = expense.amount;

            if (balances[paidById] && balances[paidToId]) {
                balances[paidById].balance += amount;
                balances[paidToId].balance -= amount;
            }
        });

        // Separate creditors and debtors
        const creditors = [];
        const debtors = [];

        Object.entries(balances).forEach(([userId, data]) => {
            if (data.balance > 0.01) {
                creditors.push({ id: userId, name: data.name, amount: data.balance });
            } else if (data.balance < -0.01) {
                debtors.push({ id: userId, name: data.name, amount: Math.abs(data.balance) });
            }
        });

        // Calculate minimum transactions using greedy algorithm
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
        return transactions;
    };

    const getTotalExpenses = () => {
        if (!event || !event.expenses) return 0;
        return event.expenses.reduce((total, expense) => total + expense.amount, 0);
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

    return (
        <div className="event-page">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="bg-circle circle-1"></div>
                <div className="bg-circle circle-2"></div>
                <div className="bg-circle circle-3"></div>
            </div>

            <div className="container-fluid">
                {/* Event Header */}
                <div className="event-header">
                    <div className="event-header-content">
                        <div className="event-info">
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
                            <h1 className="event-title">{event.name}</h1>
                            <p className="event-description">{event.description}</p>
                            <div className="event-stats">
                                <div className="stat-item">
                                    <i className="fas fa-users"></i>
                                    <span>{event.participants?.length || 0} Participants</span>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-receipt"></i>
                                    <span>{event.expenses?.length || 0} Expenses</span>
                                </div>
                                <div className="stat-item">
                                    <i className="fas fa-rupee-sign"></i>
                                    <span>₹{getTotalExpenses().toFixed(2)} Total</span>
                                </div>
                            </div>
                        </div>
                        <div className="event-code-card">
                            <div className="code-label">Event Code</div>
                            <div className="event-code">{event.code}</div>
                            <div className="code-hint">Share this code to invite others</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="row main-content">
                    {/* Sidebar */}
                    <div className="col-lg-4 col-md-12">
                        {/* Participants Card */}
                        <div className="card-modern participants-card">
                            <div className="card-header-modern">
                                <h5><i className="fas fa-users"></i> Participants</h5>
                            </div>
                            <div className="participants-list">
                                {event.participants?.map((participant, index) => (
                                    <div key={participant._id} className={`participant-item ${index === 0 ? 'admin' : ''}`}>
                                        <div className="participant-avatar">
                                            {/* {console.log(participant)} */}
                                            <img
                                                src={participant.profilePic || `https://ui-avatars.com/api/?name=${participant.username}&background=random&color=fff&size=50`}
                                                alt={participant.username}
                                            />
                                            {index === 0 && <div className="admin-badge"><i className="fas fa-crown"></i></div>}
                                        </div>
                                        <div className="participant-info">
                                            <div className="participant-name">{participant.username}</div>
                                            <div className="participant-email">{participant.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
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
                                        setShowSettlement(true);
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
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-lg-8 col-md-12">
                        {/* Add Expense Form */}
                        {showAddExpense && (
                            <div className="card-modern expense-form-card">
                                <div className="card-header-modern green">
                                    <h5><i className="fas fa-plus-circle"></i> Add New Expense</h5>
                                    <button 
                                        className="btn-close-modern"
                                        onClick={() => setShowAddExpense(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <form onSubmit={handleAddExpense} className="expense-form">
                                    {/* Amount Input */}
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Amount</label>
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

                                    {/* Participant Selection */}
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Paid To</label>
                                        <div className="participant-selector">
                                            {event.participants?.map((participant) => (
                                                <div
                                                    key={participant._id}
                                                    className={`participant-option ${selectedParticipant?._id === participant._id ? 'selected' : ''}`}
                                                    onClick={() => handleParticipantSelect(participant)}
                                                >
                                                    <div className="option-avatar">
                                                        <img
                                                            src={participant.profilePic || `https://ui-avatars.com/api/?name=${participant.username}&background=random&color=fff&size=60`}
                                                            alt={participant.username}
                                                        />
                                                        {selectedParticipant?._id === participant._id && (
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

                                    {/* Description */}
                                    <div className="form-group-modern">
                                        <label className="form-label-modern">Description</label>
                                        <textarea
                                            className="description-input"
                                            placeholder="What was this expense for?"
                                            rows="3"
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({
                                                ...expenseForm,
                                                description: e.target.value
                                            })}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-submit"
                                            disabled={submitting || !selectedParticipant}
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="submit-spinner"></div>
                                                    <span>Adding Expense...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save"></i>
                                                    <span>Add Expense</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Settlement Results */}
                        {showSettlement && settlements.length > 0 && (
                            <div className="card-modern settlement-card">
                                <div className="card-header-modern blue">
                                    <h5><i className="fas fa-balance-scale"></i> Settlement Plan</h5>
                                    <button 
                                        className="btn-close-modern"
                                        onClick={() => setShowSettlement(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                
                                <div className="settlement-content">
                                    <div className="settlement-info">
                                        <div className="info-badge">
                                            <i className="fas fa-magic"></i>
                                            Optimized to <strong>{settlements.length} transactions</strong>
                                        </div>
                                    </div>
                                    
                                    <div className="settlements-list">
                                        {settlements.map((settlement, index) => (
                                            <div key={index} className="settlement-item">
                                                <div className="settlement-flow">
                                                    <div className="from-user">
                                                        <div className="user-avatar">
                                                            <img
                                                                src={`https://ui-avatars.com/api/?name=${settlement.from}&background=ff6b6b&color=fff&size=40`}
                                                                alt={settlement.from}
                                                            />
                                                        </div>
                                                        <span>{settlement.from}</span>
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
                                                        <span>{settlement.to}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expenses List */}
                        <div className="card-modern expenses-card">
                            <div className="card-header-modern">
                                <h5><i className="fas fa-history"></i> Recent Expenses</h5>
                                <div className="header-actions">
                                    <span className="total-amount">Total: ₹{getTotalExpenses().toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {event.expenses && event.expenses.length > 0 ? (
                                <div className="expenses-list">
                                    {event.expenses
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map((expense, index) => (
                                        <div key={expense._id} className={`expense-item ${index === 0 ? 'latest' : ''}`}>
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
                                    <h4>No expenses yet</h4>
                                    <p>Start by adding your first expense to track shared costs</p>
                                    <button
                                        className="btn-empty-action"
                                        onClick={() => setShowAddExpense(true)}
                                    >
                                        <i className="fas fa-plus"></i>
                                        Add First Expense
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FontAwesome */}
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            />
        </div>
    );
}

export default EventPage;