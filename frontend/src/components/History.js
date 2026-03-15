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
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [userId, setUserId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const getUserRefId = (userRef) => {
    if (!userRef) return "";
    if (typeof userRef === "string") return userRef;
    return userRef._id || "";
  };

  const getUserRefName = (userRef, fallback = "Unknown") => {
    if (!userRef) return fallback;
    if (typeof userRef === "string") return fallback;
    return userRef.username || fallback;
  };

  const getUserInitial = (userRef) => {
    const name = getUserRefName(userRef, "U");
    return name.charAt(0).toUpperCase();
  };

  const mergeExpenseUsers = (previousExpense, nextExpense) => ({
    ...previousExpense,
    ...nextExpense,
    paidBy: typeof nextExpense?.paidBy === 'object' && nextExpense?.paidBy?.username
      ? nextExpense.paidBy
      : previousExpense.paidBy,
    paidTo: typeof nextExpense?.paidTo === 'object' && nextExpense?.paidTo?.username
      ? nextExpense.paidTo
      : previousExpense.paidTo,
  });

  useEffect(() => {
    const username = localStorage.getItem("username");
    setUser(username);

    if (username) {
      // Fetch userId for sender
      fetch(`https://milbantkar-1.onrender.com/api/user/${username}`)
        .then((res) => res.json())
        .then((data) => {
          const userData = Array.isArray(data) ? data[0] : data;
          if (userData && userData._id) setUserId(userData._id);
        });

      fetch("https://milbantkar-1.onrender.com/api/expense")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (exp) =>
              getUserRefName(exp.paidBy) === username ||
              getUserRefName(exp.paidTo) === username
          );
          setExpenses(filtered);
          setFilteredExpenses(filtered);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching expenses:", err);
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
          getUserRefName(exp.paidBy).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getUserRefName(exp.paidTo).toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          comparison = getUserRefName(a.paidBy).localeCompare(getUserRefName(b.paidBy));
          break;
        case "paidTo":
          comparison = getUserRefName(a.paidTo).localeCompare(getUserRefName(b.paidTo));
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, sortBy, sortOrder, statusFilter]);

  const getSettlementState = (expense) => {
    const paidByConfirmed = Boolean(expense?.settlementConfirmation?.paidByConfirmed || expense?.status);
    const paidToConfirmed = Boolean(expense?.settlementConfirmation?.paidToConfirmed || expense?.status);

    return {
      paidByConfirmed,
      paidToConfirmed,
      status: paidByConfirmed && paidToConfirmed,
    };
  };

  const getCurrentUserRole = (expense) => {
    if (!userId) return null;
    if (getUserRefId(expense?.paidBy) === userId) return 'paidBy';
    if (getUserRefId(expense?.paidTo) === userId) return 'paidTo';
    return null;
  };

  const hasCurrentUserConfirmed = (expense) => {
    const role = getCurrentUserRole(expense);
    const settlement = getSettlementState(expense);

    if (role === 'paidBy') return settlement.paidByConfirmed;
    if (role === 'paidTo') return settlement.paidToConfirmed;
    return false;
  };

  const getOtherPartyName = (expense) => {
    const role = getCurrentUserRole(expense);
    if (role === 'paidBy') return getUserRefName(expense.paidTo);
    if (role === 'paidTo') return getUserRefName(expense.paidBy);
    return 'Other user';
  };

  const getSettlementLabel = (expense) => {
    const settlement = getSettlementState(expense);
    const currentUserConfirmed = hasCurrentUserConfirmed(expense);
    const otherPartyName = getOtherPartyName(expense);

    if (settlement.status) {
      return {
        tone: 'settled',
        title: 'Settled',
        subtitle: 'Both users confirmed the payment is complete.'
      };
    }

    if (currentUserConfirmed) {
      return {
        tone: 'waiting',
        title: 'Waiting for confirmation',
        subtitle: `${otherPartyName} still needs to confirm settlement.`
      };
    }

    return {
      tone: 'pending',
      title: 'Pending your confirmation',
      subtitle: 'Mark as settled after the payment is actually completed.'
    };
  };

  const canSendReminder = (expense) => {
    return !getSettlementState(expense).status && expense?.paidBy?._id === userId;
  };

  // Toggle settlement confirmation with API call
  const toggleStatus = async (expense) => {
    if (!userId) {
      alert('User info not loaded. Please try again.');
      return;
    }

    setUpdatingStatus(expense._id);
    try {
      const res = await fetch(`https://milbantkar-1.onrender.com/api/expense/status/${expense._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        const updatedExpense = await res.json();
        setExpenses((prev) =>
          prev.map((exp) =>
            exp._id === expense._id ? mergeExpenseUsers(exp, updatedExpense) : exp
          )
        );

        const mergedExpense = mergeExpenseUsers(expense, updatedExpense);
        const nextIsConfirmed = hasCurrentUserConfirmed(mergedExpense);
        setStatusMessage(
          nextIsConfirmed
            ? 'Your settlement confirmation has been recorded.'
            : 'Your settlement confirmation has been removed.'
        );
      } else {
        const data = await res.json();
        console.error("Failed to update status:", data.message);
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status. Please check your connection.");
    }
    setUpdatingStatus(null);
  };

  // Send reminder alert to receiver
  const sendReminder = async (exp) => {
    if (!userId) {
      alert("User info not loaded. Please try again.");
      return;
    }
    
    try {
      // Get receiver user details
      const receiverIdentifier = getUserRefName(exp.paidTo) !== 'Unknown' ? getUserRefName(exp.paidTo) : getUserRefId(exp.paidTo);
      const receiverRes = await fetch(`https://milbantkar-1.onrender.com/api/user/${receiverIdentifier}`);
      
      if (!receiverRes.ok) {
        alert("Failed to fetch user details. Please try again.");
        return;
      }
      
      const receiverData = await receiverRes.json();
      const receiver = receiverData[0]; // API returns array
      
      if (!receiver) {
        alert("User details not found. Please try again.");
        return;
      }
      
      // Create in-app alert
      const alertRes = await fetch("https://milbantkar-1.onrender.com/api/alerts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: userId,
          receiver: receiver._id,
          message: `You have a pending payment for '${exp.description}' of amount ₹${exp.amount}.`,
          type: "info",
          expenseDetails: exp._id
        })
      });
      
      if (alertRes.ok) {
        alert(`Reminder sent to ${receiver.username}`);
      } else {
        const alertData = await alertRes.json().catch(() => ({}));
        alert("Failed to send reminder: " + (alertData.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending reminder:", err);
      alert("Error sending reminder. Please check your connection.");
    }
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
    return getUserRefName(exp.paidBy) === user ? 'paid' : 'received';
  };

  // Calculate summary stats
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const settledAmount = filteredExpenses
    .filter(exp => exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingAmount = filteredExpenses
    .filter(exp => !exp.status)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalPaid = filteredExpenses
    .filter(exp => getTransactionType(exp) === 'paid')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalReceived = filteredExpenses
    .filter(exp => getTransactionType(exp) === 'received')
    .reduce((sum, exp) => sum + exp.amount, 0);

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = setTimeout(() => setStatusMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  if (isLoading) {
    return (
      <>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
          rel="stylesheet" 
        />
        <style>{`
          .loading-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .loading-spinner {
            animation: spin 1s linear infinite, pulse 2s ease-in-out infinite alternate;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.1); }
          }
          .loading-text {
            animation: fadeInUp 0.8s ease-out;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="loading-container d-flex align-items-center justify-content-center">
          <div className="text-center text-white">
            <div className="loading-spinner rounded-circle border-4 border-light border-top-transparent mx-auto mb-4" 
                 style={{width: '4rem', height: '4rem'}}></div>
            <h3 className="loading-text">Loading your transactions...</h3>
            <p className="loading-text mt-2 opacity-75">Please wait while we fetch your data</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.0/font/bootstrap-icons.min.css" 
        rel="stylesheet" 
      />
      
      <style>{`
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        .slide-in-top {
          animation: slideInTop 0.6s ease-out;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }
        
        .slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .scale-in {
          animation: scaleIn 0.4s ease-out;
        }
        
        @keyframes slideInTop {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .card-enhanced {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .card-enhanced:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .stats-card {
          background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
        }
        
        .stats-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        
        .stats-card-success {
          background: linear-gradient(135deg, var(--bs-success) 0%, #20c997 100%);
        }
        
        .stats-card-warning {
          background: linear-gradient(135deg, var(--bs-warning) 0%, #fd7e14 100%);
        }
        
        .stats-card-info {
          background: linear-gradient(135deg, var(--bs-info) 0%, var(--bs-primary) 100%);
        }
        
        .stats-card-purple {
          background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
        }
        
        .btn-enhanced {
          transition: all 0.2s ease;
          border-radius: 12px;
          font-weight: 600;
        }
        
        .btn-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .search-input {
          border-radius: 15px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
        }
        
        .search-input:focus {
          border-color: var(--bs-primary);
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
          transform: scale(1.02);
        }
        
        .transaction-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          border-radius: 20px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
        }
        
        .transaction-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        
        .transaction-card.paid {
          border: 3px solid var(--bs-danger);
          box-shadow: 0 0px 20px rgba(255, 0, 0, 0.59);
        }
        
        .transaction-card.received {
          border: 3px solid var(--bs-success);
          box-shadow: 0 0px 25px rgb(17, 255, 0);
        }
        
        .transaction-card.pending {
          background: linear-gradient(135deg, rgba(255,249,196,0.8) 0%, rgba(255,255,255,0.9) 100%);
        }
        
        .filter-collapse {
          transition: all 0.3s ease;
        }
        
        .avatar-circle {
          transition: transform 0.2s ease;
        }
        
        .avatar-circle:hover {
          transform: scale(1.1);
        }
        
        .amount-display {
          font-size: 1.5rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .status-badge {
          border-radius: 25px;
          padding: 8px 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.75rem;
        }
        
        .glass-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 25px;
        }
        
        .stagger-animation-1 { animation-delay: 0.1s; }
        .stagger-animation-2 { animation-delay: 0.2s; }
        .stagger-animation-3 { animation-delay: 0.3s; }
        .stagger-animation-4 { animation-delay: 0.4s; }
        .stagger-animation-5 { animation-delay: 0.5s; }
        
        .header-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .loading-button {
          position: relative;
          overflow: hidden;
        }
        
        .loading-button .spinner-border {
          width: 1rem;
          height: 1rem;
        }

        .settlement-panel {
          min-width: 240px;
        }

        .settlement-summary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 10px;
        }

        .settlement-summary.pending {
          background: rgba(255, 193, 7, 0.18);
          color: #8a6700;
        }

        .settlement-summary.waiting {
          background: rgba(13, 202, 240, 0.16);
          color: #0b7285;
        }

        .settlement-summary.settled {
          background: rgba(25, 135, 84, 0.16);
          color: #146c43;
        }

        .settlement-copy {
          font-size: 0.8rem;
          color: #6c757d;
          margin-bottom: 10px;
        }

        .settlement-steps {
          display: grid;
          gap: 8px;
        }

        .settlement-step {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(248, 249, 250, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .settlement-step.is-complete {
          background: rgba(25, 135, 84, 0.08);
          border-color: rgba(25, 135, 84, 0.18);
        }

        .settlement-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .settlement-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }

        .settlement-name {
          font-weight: 600;
          color: #212529;
        }

        .settlement-role {
          display: block;
          font-size: 0.72rem;
          color: #6c757d;
        }

        .settlement-state {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .settlement-state.confirmed {
          background: rgba(25, 135, 84, 0.14);
          color: #146c43;
        }

        .settlement-state.awaiting {
          background: rgba(255, 193, 7, 0.15);
          color: #8a6700;
        }

        .settlement-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .btn-confirm-settlement {
          min-width: 180px;
        }

        .settlement-banner {
          border-radius: 16px;
          padding: 14px 18px;
          background: rgba(13, 110, 253, 0.08);
          border: 1px solid rgba(13, 110, 253, 0.12);
          color: #0a58ca;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .settlement-panel-mobile {
          margin-top: 14px;
        }
      `}</style>

      <div className="container-fluid" style={{background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh', padding: '2rem 0'}}>
        <div className="container">
          {/* Header Section */}
          <div className="glass-card p-5 mb-5 slide-in-top">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h1 style={{marginTop:'10px'}} className="display-4 fw-bold header-gradient mb-3">Transaction History</h1>
                <p className="lead text-muted mb-0">
                  <i className="bi bi-people-fill me-2 text-primary"></i>
                  Welcome back, <span className="fw-bold text-primary">{user}</span>
                </p>
              </div>
              <div className="col-md-4 text-end d-none d-md-block">
                <div className="bg-primary bg-opacity-10 p-3 rounded-4 d-inline-block">
                  <span className="text-primary fw-bold">
                    <i className="bi bi-graph-up me-2"></i>
                    {filteredExpenses.length} transactions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Dashboard */}
          <div className="row mb-5">
            <div className="col-lg col-md-6 mb-4">
              <div className="card stats-card text-white h-100 slide-in-left stagger-animation-1">
                <div className="card-body text-center p-4">
                  <div className="display-6 mb-3">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <h3 className="display-5 fw-bold">{filteredExpenses.length}</h3>
                  <p className="mb-0 opacity-90">Total Transactions</p>
                </div>
              </div>
            </div>

            <div className="col-lg col-md-6 mb-4">
              <div className="card stats-card-info text-white h-100 slide-in-left stagger-animation-2">
                <div className="card-body text-center p-4">
                  <div className="display-6 mb-3">
                    <i className="bi bi-currency-rupee"></i>
                  </div>
                  <h4 className="fw-bold">{formatCurrency(totalAmount)}</h4>
                  <p className="mb-0 opacity-90">Total Amount</p>
                </div>
              </div>
            </div>

            <div className="col-lg col-md-6 mb-4">
              <div className="card stats-card-success text-white h-100 slide-in-left stagger-animation-3">
                <div className="card-body text-center p-4">
                  <div className="display-6 mb-3">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <h4 className="fw-bold">{formatCurrency(settledAmount)}</h4>
                  <p className="mb-0 opacity-90">Settled</p>
                </div>
              </div>
            </div>

            <div className="col-lg col-md-6 mb-4">
              <div className="card stats-card-warning text-dark h-100 slide-in-left stagger-animation-4">
                <div className="card-body text-center p-4">
                  <div className="display-6 mb-3">
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <h4 className="fw-bold">{formatCurrency(pendingAmount)}</h4>
                  <p className="mb-0 opacity-90">Pending</p>
                </div>
              </div>
            </div>

            <div className="col-lg col-12 mb-4">
              <div className="card stats-card-purple text-white h-100 slide-in-left stagger-animation-5">
                <div className="card-body p-4">
                  <div className="row text-center">
                    <div className="col-6 border-end border-light border-opacity-25">
                      <div className="mb-2">
                        <i className="bi bi-arrow-up-circle fs-4 text-success"></i>
                        <span className="ms-2 fw-bold">Received</span>
                      </div>
                      <h5 className="fw-bold mb-0">{formatCurrency(totalReceived)}</h5>
                    </div>
                    <div className="col-6">
                      <div className="mb-2">
                        <i className="bi bi-arrow-down-circle fs-4 text-danger"></i>
                        <span className="ms-2 fw-bold">Paid</span>
                      </div>
                      <h5 className="fw-bold mb-0">{formatCurrency(totalPaid)}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-4 mb-5 slide-in-right">
            {statusMessage && (
              <div className="settlement-banner fade-in-up">
                <i className="bi bi-patch-check-fill me-2"></i>
                {statusMessage}
              </div>
            )}

            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark mb-2">
                  <i className="bi bi-search me-2"></i>Search Transactions
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg search-input"
                  placeholder="Search by description, person, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="col-md-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn btn-enhanced w-100 ${
                    showFilters || statusFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                >
                  <i className="bi bi-funnel me-2"></i>
                  Advanced Filters
                  <i className={`bi ${showFilters ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
                </button>
              </div>

              <div className="col-md-3">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("date");
                    setSortOrder("desc");
                    setStatusFilter("all");
                    setShowFilters(false);
                  }}
                  className="btn btn-outline-secondary btn-enhanced w-100"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset All
                </button>
              </div>
            </div>

            {/* Advanced Filters Collapse */}
            <div className={`filter-collapse ${showFilters ? '' : 'd-none'}`}>
              <hr className="my-4" />
              <div className="row g-3">
                <div className="col-md-4 fade-in-up stagger-animation-1">
                  <label className="form-label fw-semibold">Status Filter</label>
                  <select
                    className="form-select form-select-lg"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Transactions</option>
                    <option value="settled">Settled Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>

                <div className="col-md-4 fade-in-up stagger-animation-2">
                  <label className="form-label fw-semibold">Sort By</label>
                  <select
                    className="form-select form-select-lg"
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

                <div className="col-md-4 fade-in-up stagger-animation-3">
                  <label className="form-label fw-semibold">Sort Order</label>
                  <select
                    className="form-select form-select-lg"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="card glass-card d-none d-lg-block mb-5 slide-in-left">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 fw-bold">Date</th>
                      <th className="px-4 py-3 fw-bold">Description</th>
                      <th className="px-4 py-3 fw-bold">Paid By</th>
                      <th className="px-4 py-3 fw-bold">Paid To</th>
                      <th className="px-4 py-3 fw-bold">Amount</th>
                      <th className="px-4 py-3 fw-bold">Status</th>
                      <th className="px-4 py-3 fw-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((exp, index) => (
                        <tr key={exp._id} 
                            className={`${getTransactionType(exp) === 'paid' ? 'table-danger' : 'table-success'} fade-in-up`}
                            style={{animationDelay: `${index * 0.1}s`}}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-calendar3 text-muted me-2"></i>
                              <small className="fw-medium">{formatDate(exp.date)}</small>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-bold mb-1">{exp.description}</div>
                            <small className={`badge ${getTransactionType(exp) === 'paid' ? 'bg-danger' : 'bg-success'} bg-opacity-25`}>
                              {getTransactionType(exp) === 'paid' ? 'You paid' : 'You received'}
                            </small>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center avatar-circle" 
                                   style={{width: '40px', height: '40px'}}>
                                <span className="text-white fw-bold">
                                  {getUserInitial(exp.paidBy)}
                                </span>
                              </div>
                              <span className={`fw-medium ${getUserRefName(exp.paidBy) === user ? 'text-primary fw-bold' : ''}`}>
                                {getUserRefName(exp.paidBy) === user ? 'You' : getUserRefName(exp.paidBy)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-success rounded-circle me-3 d-flex align-items-center justify-content-center avatar-circle" 
                                   style={{width: '40px', height: '40px'}}>
                                <span className="text-white fw-bold">
                                  {getUserInitial(exp.paidTo)}
                                </span>
                              </div>
                              <span className={`fw-medium ${getUserRefName(exp.paidTo) === user ? 'text-primary fw-bold' : ''}`}>
                                {getUserRefName(exp.paidTo) === user ? 'You' : getUserRefName(exp.paidTo)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`amount-display ${getTransactionType(exp) === 'paid' ? 'text-danger' : 'text-success'}`}>
                              {getTransactionType(exp) === 'paid' ? '-' : '+'}{formatCurrency(exp.amount)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="settlement-panel">
                              <div className={`settlement-summary ${getSettlementLabel(exp).tone}`}>
                                <i className={`bi ${getSettlementState(exp).status ? 'bi-check-circle-fill' : hasCurrentUserConfirmed(exp) ? 'bi-hourglass-split' : 'bi-clock-fill'}`}></i>
                                {getSettlementLabel(exp).title}
                              </div>
                              <div className="settlement-copy">
                                {getSettlementLabel(exp).subtitle}
                              </div>
                              <div className="settlement-steps">
                                <div className={`settlement-step ${getSettlementState(exp).paidByConfirmed ? 'is-complete' : ''}`}>
                                  <div className="settlement-user">
                                    <div className="settlement-avatar">{getUserInitial(exp.paidBy)}</div>
                                    <div>
                                      <div className="settlement-name">{getUserRefName(exp.paidBy) === user ? 'You' : getUserRefName(exp.paidBy)}</div>
                                      <span className="settlement-role">Paid the amount</span>
                                    </div>
                                  </div>
                                  <span className={`settlement-state ${getSettlementState(exp).paidByConfirmed ? 'confirmed' : 'awaiting'}`}>
                                    <i className={`bi ${getSettlementState(exp).paidByConfirmed ? 'bi-check2-circle' : 'bi-hourglass-split'}`}></i>
                                    {getSettlementState(exp).paidByConfirmed ? 'Confirmed' : 'Awaiting'}
                                  </span>
                                </div>
                                <div className={`settlement-step ${getSettlementState(exp).paidToConfirmed ? 'is-complete' : ''}`}>
                                  <div className="settlement-user">
                                    <div className="settlement-avatar">{getUserInitial(exp.paidTo)}</div>
                                    <div>
                                      <div className="settlement-name">{getUserRefName(exp.paidTo) === user ? 'You' : getUserRefName(exp.paidTo)}</div>
                                      <span className="settlement-role">Confirms the settlement</span>
                                    </div>
                                  </div>
                                  <span className={`settlement-state ${getSettlementState(exp).paidToConfirmed ? 'confirmed' : 'awaiting'}`}>
                                    <i className={`bi ${getSettlementState(exp).paidToConfirmed ? 'bi-check2-circle' : 'bi-hourglass-split'}`}></i>
                                    {getSettlementState(exp).paidToConfirmed ? 'Confirmed' : 'Awaiting'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="settlement-actions">
                              <button
                                className={`btn btn-enhanced btn-sm btn-confirm-settlement ${hasCurrentUserConfirmed(exp) ? 'btn-outline-warning' : 'btn-outline-success'} ${updatingStatus === exp._id ? 'loading-button' : ''}`}
                                onClick={() => toggleStatus(exp)}
                                disabled={updatingStatus === exp._id || !userId}
                                title={hasCurrentUserConfirmed(exp) ? 'Remove your confirmation' : 'Confirm settlement'}
                              >
                                {updatingStatus === exp._id ? (
                                  <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                ) : (
                                  <>
                                    <i className={`bi ${hasCurrentUserConfirmed(exp) ? 'bi-arrow-counterclockwise' : 'bi-patch-check' } me-1`}></i>
                                    {hasCurrentUserConfirmed(exp) ? 'Undo My Confirmation' : 'Confirm Settled'}
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-outline-info btn-enhanced btn-sm"
                                onClick={() => sendReminder(exp)}
                                disabled={!canSendReminder(exp)}
                                title={canSendReminder(exp) ? 'Send Reminder' : 'Only the payer can remind while settlement is pending'}
                              >
                                <i className="bi bi-bell me-1"></i>
                                Remind
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="py-5 scale-in">
                            <i className="bi bi-inbox display-1 text-muted mb-4"></i>
                            <h4 className="fw-bold text-muted">No transactions found</h4>
                            <p className="text-muted">Try adjusting your search or filters</p>
                          </div>
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
              filteredExpenses.map((exp, index) => (
                <div
                  key={exp._id}
                  className={`transaction-card mb-4 fade-in-up ${getTransactionType(exp)} ${!exp.status ? 'pending' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-muted">
                        <i className="bi bi-calendar3 me-2"></i>
                        {formatDate(exp.date)}
                      </span>
                      <span className={`status-badge ${getSettlementState(exp).status ? "bg-success text-white" : hasCurrentUserConfirmed(exp) ? 'bg-info text-dark' : "bg-warning text-dark"}`}>
                        <i className={`bi ${getSettlementState(exp).status ? 'bi-check-circle-fill' : hasCurrentUserConfirmed(exp) ? 'bi-hourglass-split' : 'bi-clock-fill'} me-1`}></i>
                        {getSettlementLabel(exp).title}
                      </span>
                    </div>
                    <div className="fw-bold fs-5 mb-1">{exp.description}</div>
                    <div className="mb-2">
                      <span className={`badge ${getTransactionType(exp) === 'paid' ? 'bg-danger' : 'bg-success'} bg-opacity-25 me-2`}>
                        {getTransactionType(exp) === 'paid' ? 'You paid' : 'You received'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center avatar-circle" style={{ width: '36px', height: '36px' }}>
                        <span className="text-white fw-bold">
                          {getUserInitial(exp.paidBy)}
                        </span>
                      </div>
                      <span className={`fw-medium ${getUserRefName(exp.paidBy) === user ? 'text-primary fw-bold' : ''}`}>
                        {getUserRefName(exp.paidBy) === user ? 'You' : getUserRefName(exp.paidBy)}
                      </span>
                      <span className="mx-2 text-muted">→</span>
                      <div className="bg-success rounded-circle me-2 d-flex align-items-center justify-content-center avatar-circle" style={{ width: '36px', height: '36px' }}>
                        <span className="text-white fw-bold">
                          {getUserInitial(exp.paidTo)}
                        </span>
                      </div>
                      <span className={`fw-medium ${getUserRefName(exp.paidTo) === user ? 'text-primary fw-bold' : ''}`}>
                        {getUserRefName(exp.paidTo) === user ? 'You' : getUserRefName(exp.paidTo)}
                      </span>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <span className={`amount-display ${getTransactionType(exp) === 'paid' ? 'text-danger' : 'text-success'}`}>
                        {getTransactionType(exp) === 'paid' ? '-' : '+'}{formatCurrency(exp.amount)}
                      </span>
                    </div>
                    <div className="settlement-panel settlement-panel-mobile mb-3">
                      <div className={`settlement-summary ${getSettlementLabel(exp).tone}`}>
                        <i className={`bi ${getSettlementState(exp).status ? 'bi-check-circle-fill' : hasCurrentUserConfirmed(exp) ? 'bi-hourglass-split' : 'bi-clock-fill'}`}></i>
                        {getSettlementLabel(exp).title}
                      </div>
                      <div className="settlement-copy">{getSettlementLabel(exp).subtitle}</div>
                      <div className="settlement-steps">
                        <div className={`settlement-step ${getSettlementState(exp).paidByConfirmed ? 'is-complete' : ''}`}>
                          <div className="settlement-user">
                            <div className="settlement-avatar">{getUserInitial(exp.paidBy)}</div>
                            <div>
                              <div className="settlement-name">{getUserRefName(exp.paidBy) === user ? 'You' : getUserRefName(exp.paidBy)}</div>
                              <span className="settlement-role">Paid the amount</span>
                            </div>
                          </div>
                          <span className={`settlement-state ${getSettlementState(exp).paidByConfirmed ? 'confirmed' : 'awaiting'}`}>
                            <i className={`bi ${getSettlementState(exp).paidByConfirmed ? 'bi-check2-circle' : 'bi-hourglass-split'}`}></i>
                          </span>
                        </div>
                        <div className={`settlement-step ${getSettlementState(exp).paidToConfirmed ? 'is-complete' : ''}`}>
                          <div className="settlement-user">
                            <div className="settlement-avatar">{getUserInitial(exp.paidTo)}</div>
                            <div>
                              <div className="settlement-name">{getUserRefName(exp.paidTo) === user ? 'You' : getUserRefName(exp.paidTo)}</div>
                              <span className="settlement-role">Confirms the settlement</span>
                            </div>
                          </div>
                          <span className={`settlement-state ${getSettlementState(exp).paidToConfirmed ? 'confirmed' : 'awaiting'}`}>
                            <i className={`bi ${getSettlementState(exp).paidToConfirmed ? 'bi-check2-circle' : 'bi-hourglass-split'}`}></i>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-enhanced btn-sm flex-fill ${hasCurrentUserConfirmed(exp) ? 'btn-outline-warning' : 'btn-outline-success'} ${updatingStatus === exp._id ? 'loading-button' : ''}`}
                        onClick={() => toggleStatus(exp)}
                        disabled={updatingStatus === exp._id || !userId}
                        title={hasCurrentUserConfirmed(exp) ? 'Remove your confirmation' : 'Confirm settlement'}
                      >
                        {updatingStatus === exp._id ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <i className={`bi ${hasCurrentUserConfirmed(exp) ? 'bi-arrow-counterclockwise' : 'bi-patch-check'} me-1`}></i>
                            {hasCurrentUserConfirmed(exp) ? 'Undo' : 'Confirm'}
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-info btn-enhanced btn-sm flex-fill"
                        onClick={() => sendReminder(exp)}
                        disabled={!canSendReminder(exp)}
                        title={canSendReminder(exp) ? 'Send Reminder' : 'Only the payer can remind while settlement is pending'}
                      >
                        <i className="bi bi-bell me-1"></i>
                        Remind
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5 scale-in">
                <i className="bi bi-inbox display-1 text-muted mb-4"></i>
                <h4 className="fw-bold text-muted">No transactions found</h4>
                <p className="text-muted">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
        <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        rel="stylesheet" 
      />
      <link 
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" 
        rel="stylesheet" 
      />
      </div>
    </>
  );
}

export default History;