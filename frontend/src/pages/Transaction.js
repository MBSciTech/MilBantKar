import React, { useState, useEffect } from 'react';

function Transaction() {
  const [formData, setFormData] = useState({
    paidBy: '',
    paidTo: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const LOCAL_STORAGE_KEY = 'recentTransactions';
  const EXPIRY_HOURS = 24; // expiry time in hours

  // Save transactions with expiry
  const saveTransactionsWithExpiry = (transactions) => {
    const expiryTime = Date.now() + EXPIRY_HOURS * 60 * 60 * 1000;
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ data: transactions, expiry: expiryTime })
    );
  };

  // Load transactions if not expired
  const loadTransactionsWithExpiry = () => {
    const itemStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!itemStr) return [];

    try {
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return [];
      }
      return item.data || [];
    } catch {
      return [];
    }
  };

  // Fetch users and load stored transactions
useEffect(() => {
    fetch('https://milbantkar-1.onrender.com/api/users')
    .then((res) => res.json())
    .then((data) => setUsers(data))
    .catch((e)=>{
        alert(`Error : ${e}`)
    })

}, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickAmount = (amount) => {
    setFormData((prev) => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.paidBy || !formData.paidTo || !formData.amount) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.paidBy === formData.paidTo) {
        alert('Paid by and Paid to cannot be the same person');
        return;
      }

      if (parseFloat(formData.amount) <= 0) {
        alert('Amount must be greater than 0');
        return;
      }

      const response = await fetch('https://milbantkar-1.onrender.com/api/expense/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Transaction added successfully!');
        const newTransaction = {
          _id: Date.now().toString(),
          paidBy: users.find((u) => u._id === formData.paidBy),
          paidTo: users.find((u) => u._id === formData.paidTo),
          amount: formData.amount,
          description: formData.description,
          date: new Date(formData.date).toISOString()
        };

        const updatedTransactions = [newTransaction, ...recentTransactions.slice(0, 4)];
        setRecentTransactions(updatedTransactions);
        saveTransactionsWithExpiry(updatedTransactions);

        // Reset form but keep paidBy
        const currentPaidBy = formData.paidBy;
        setFormData({
          paidBy: currentPaidBy,
          paidTo: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        alert(result.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const commonAmounts = [5, 10, 20, 25, 50, 100];

  return (
    <>
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="mb-1">⚡ Quick Transaction</h2>
              <p className="text-muted">Add expense transactions fast and easy</p>
            </div>

            {/* Quick Add Form */}
            <div className="card shadow-lg border-0">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Amount */}
                  <div className="mb-4">
                    <label htmlFor="amount" className="form-label h5 text-primary">
                      💰 Amount <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-primary text-white fs-4">₹</span>
                      <input
                        type="number"
                        className="form-control form-control-lg text-center fs-3"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                        step="0"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="mt-3">
                      <small className="text-muted d-block mb-2">Quick amounts:</small>
                      <div className="d-flex flex-wrap gap-2">
                        {commonAmounts.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleQuickAmount(amount)}
                          >
                            ₹{amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    {/* Paid By */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="paidBy" className="form-label fw-medium">
                        👤 Paid By <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-lg"
                        id="paidBy"
                        name="paidBy"
                        value={formData.paidBy}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select who paid</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Paid To */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="paidTo" className="form-label fw-medium">
                        🎯 Paid To <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-lg"
                        id="paidTo"
                        name="paidTo"
                        value={formData.paidTo}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select who received</option>
                        {users
                          .filter((user) => user._id !== formData.paidBy)
                          .map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.username}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label fw-medium">
                      📝 Description
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="What was this for? (optional)"
                    />
                  </div>

                  {/* Date */}
                  <div className="mb-4">
                    <label htmlFor="date" className="form-label fw-medium">
                      📅 Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding Transaction...
                        </>
                      ) : (
                        <>
                          <span className="me-2">✅</span>
                          Add Transaction
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-3">📊 Recent Transactions</h5>
                <div className="card">
                  <div className="list-group list-group-flush">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction._id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <div
                                className="bg-success rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                              >
                                <span className="text-white">💰</span>
                              </div>
                            </div>
                            <div>
                              <div className="fw-medium">
                                {transaction.paidBy.username} → {transaction.paidTo.username}
                              </div>
                              <small className="text-muted">
                                {transaction.description || 'No description'} •{' '}
                                {formatDate(transaction.date)}
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-success fs-5">
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="mt-4">
              <div className="card bg-light border-0">
                <div className="card-body">
                  <h6 className="card-title">💡 Quick Tips</h6>
                  <ul className="mb-0 small text-muted">
                    <li>Use quick amount buttons for common expenses</li>
                    <li>The form remembers who paid last time</li>
                    <li>Description is optional but helpful for tracking</li>
                    <li>Press Tab to quickly move between fields</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Transaction;
