import { useEffect, useState } from "react";

function History() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [user, setUser] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const username = localStorage.getItem("username");
    setUser(username);

    if (username) {
      fetch("https://milbantkar-1.onrender.com/api/expense")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (exp) =>
              exp.paidBy.username === username ||
              exp.paidTo.username === username
          );
          setExpenses(filtered);
          setFilteredExpenses(filtered);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("❌ Error fetching expenses:", err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Filter and sort expenses
  useEffect(() => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.paidBy.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.paidTo.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.amount.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (exp) => exp.status === (statusFilter === "settled")
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        case "paidBy":
          comparison = a.paidBy.username.localeCompare(b.paidBy.username);
          break;
        case "paidTo":
          comparison = a.paidTo.username.localeCompare(b.paidTo.username);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, sortBy, sortOrder, statusFilter]);

  // Toggle status with API call
  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`https://milbantkar-1.onrender.com/api/expense/status/${id}`, {
        method: "PUT",
      });

      if (res.ok) {
        setExpenses((prev) =>
          prev.map((exp) =>
            exp._id === id ? { ...exp, status: !exp.status } : exp
          )
        );
      } else {
        const data = await res.json();
        console.error("❌ Failed to update status:", data.message);
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      alert("Error updating status. Please check your connection.");
    }
  };

  const sendReminder = (exp) => {
    alert(`⏰ Reminder sent to ${exp.paidTo.username}`);
    // optionally call backend for notification/email
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionType = (exp) => {
    return exp.paidBy.username === user ? 'paid' : 'received';
  };

  // Calculate summary stats
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const settledAmount = filteredExpenses
    .filter(exp => exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingAmount = filteredExpenses
    .filter(exp => !exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-3">Loading transactions...</h5>
        </div>
      </div>
    );
  }

  return (
    <>
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">📝 Transaction History</h2>
            <p className="text-muted mb-0">Track all your expense transactions</p>
          </div>
          <div className="text-end d-none d-md-block">
            <small className="text-muted">Welcome back, <strong>{user}</strong></small>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3 col-6 mb-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body text-center">
                <div className="fs-4 mb-1">📊</div>
                <h6 className="card-title">Total Transactions</h6>
                <h4>{filteredExpenses.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-3">
            <div className="card bg-info text-white h-100">
              <div className="card-body text-center">
                <div className="fs-4 mb-1">💰</div>
                <h6 className="card-title">Total Amount</h6>
                <h4>{formatCurrency(totalAmount)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-3">
            <div className="card bg-success text-white h-100">
              <div className="card-body text-center">
                <div className="fs-4 mb-1">✅</div>
                <h6 className="card-title">Settled</h6>
                <h4>{formatCurrency(settledAmount)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-3">
            <div className="card bg-warning text-dark h-100">
              <div className="card-body text-center">
                <div className="fs-4 mb-1">⏳</div>
                <h6 className="card-title">Pending</h6>
                <h4>{formatCurrency(pendingAmount)}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="search" className="form-label">🔍 Search Transactions</label>
                <input
                  type="text"
                  className="form-control"
                  id="search"
                  placeholder="Search by description, person, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="statusFilter" className="form-label">Status</label>
                <select
                  className="form-select"
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="settled">Settled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="sortBy" className="form-label">Sort By</label>
                <select
                  className="form-select"
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="description">Description</option>
                  <option value="paidBy">Paid By</option>
                  <option value="paidTo">Paid To</option>
                </select>
              </div>
              <div className="col-md-2">
                <label htmlFor="sortOrder" className="form-label">Order</label>
                <select
                  className="form-select"
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("date");
                    setSortOrder("desc");
                    setStatusFilter("all");
                  }}
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="card shadow d-none d-lg-block">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Paid By</th>
                    <th>Paid To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id} className={getTransactionType(exp) === 'paid' ? 'table-danger' : 'table-success'}>
                        <td>
                          <small className="text-muted">{formatDate(exp.date)}</small>
                        </td>
                        <td>
                          <div className="fw-medium">{exp.description}</div>
                          <small className="text-muted">
                            {getTransactionType(exp) === 'paid' ? 'You paid' : 'You received'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                              <small className="text-white fw-bold">
                                {exp.paidBy.username.charAt(0).toUpperCase()}
                              </small>
                            </div>
                            <span className={exp.paidBy.username === user ? 'fw-bold' : ''}>{exp.paidBy.username}</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-success rounded-circle me-2 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                              <small className="text-white fw-bold">
                                {exp.paidTo.username.charAt(0).toUpperCase()}
                              </small>
                            </div>
                            <span className={exp.paidTo.username === user ? 'fw-bold' : ''}>{exp.paidTo.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`fw-bold ${getTransactionType(exp) === 'paid' ? 'text-danger' : 'text-success'}`}>
                            {getTransactionType(exp) === 'paid' ? '-' : '+'}{formatCurrency(exp.amount)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              exp.status ? "bg-success" : "bg-warning text-dark"
                            }`}
                          >
                            {exp.status ? "✅ Settled" : "⏳ Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className={`btn ${exp.status ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => toggleStatus(exp._id)}
                              title={exp.status ? 'Mark as Pending' : 'Mark as Settled'}
                            >
                              {exp.status ? 'Mark Pending' : '✅ settled'}
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => sendReminder(exp)}
                              title="Send Reminder"
                            >
                              🔔 Reminder
                            </button>
                            
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="fs-1">📄</div>
                        <h5 className="mt-2">No transactions found</h5>
                        <p className="text-muted">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="d-lg-none">
          {filteredExpenses.length > 0 ? (
            <div className="row">
              {filteredExpenses.map((exp) => (
                <div key={exp._id} className="col-12 mb-3">
                  <div className={`card h-100 border-start border-4 ${
                    getTransactionType(exp) === 'paid' 
                      ? 'border-danger' 
                      : 'border-success'
                  } ${!exp.status ? 'border-warning border-start' : ''}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="card-title mb-1 fw-bold">{exp.description}</h6>
                          <small className="text-muted">
                            {formatDate(exp.date)} • 
                            <span className={`ms-1 ${
                              getTransactionType(exp) === 'paid' ? 'text-danger' : 'text-success'
                            }`}>
                              {getTransactionType(exp) === 'paid' ? 'You paid' : 'You received'}
                            </span>
                          </small>
                        </div>
                        <span className={`fs-5 fw-bold ${
                          getTransactionType(exp) === 'paid' ? 'text-danger' : 'text-success'
                        }`}>
                          {getTransactionType(exp) === 'paid' ? '-' : '+'}{formatCurrency(exp.amount)}
                        </span>
                      </div>

                      <div className="row align-items-center mb-3">
                        <div className="col-6">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{width: '28px', height: '28px'}}>
                              <small className="text-white fw-bold">
                                {exp.paidBy.username.charAt(0).toUpperCase()}
                              </small>
                            </div>
                            <div>
                              <small className="text-muted d-block">From</small>
                              <small className={`fw-medium ${exp.paidBy.username === user ? 'text-primary' : ''}`}>
                                {exp.paidBy.username}
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex align-items-center">
                            <div className="bg-success rounded-circle me-2 d-flex align-items-center justify-content-center" style={{width: '28px', height: '28px'}}>
                              <small className="text-white fw-bold">
                                {exp.paidTo.username.charAt(0).toUpperCase()}
                              </small>
                            </div>
                            <div>
                              <small className="text-muted d-block">To</small>
                              <small className={`fw-medium ${exp.paidTo.username === user ? 'text-primary' : ''}`}>
                                {exp.paidTo.username}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span
                          className={`badge ${
                            exp.status ? "bg-success" : "bg-warning text-dark"
                          }`}
                        >
                          {exp.status ? "✅ Settled" : "⏳ Pending"}
                        </span>
                        <div className="btn-group btn-group-sm">
                          <button
                            className={`btn ${exp.status ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleStatus(exp._id)}
                          >
                            {exp.status ? '↩️' : '✅'}
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => sendReminder(exp)}
                          >
                            🔔
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="fs-1">📄</div>
                <h5 className="mt-2">No transactions found</h5>
                <p className="text-muted">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        {filteredExpenses.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              Showing {filteredExpenses.length} of {expenses.length} transactions
            </small>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default History;