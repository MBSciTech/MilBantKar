import React, { useState, useEffect } from 'react';

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({
    avatar: '', // default placeholder
    name: 'Loading...',
    email: 'loading@example.com'
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/user${localStorage.getItem('userId')}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error('Error fetching user:', err));
  }, []);

  const Alerts = [
    { id: 1, message: "Budget limit exceeded for Shopping", time: "2 hours ago", type: "warning" },
    { id: 2, message: "Monthly report is ready", time: "1 day ago", type: "info" },
    { id: 3, message: "Payment reminder: Credit card bill", time: "3 days ago", type: "danger" }
  ];

  return (
    <>
      {/* Bootstrap CSS */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          {/* Brand Logo */}
          <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
            <span className="me-2 fs-4">💰</span>
            Mil Bant Kar
          </a>

          {/* Mobile menu toggle */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation Links */}
          <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active fw-medium px-3" href="/dashboard">📊 Dashboard</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-medium px-3" href="/history">📝 History</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-medium px-3" href="/events">📅 Events</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-medium px-3" href="/budgets">🎯 Budgets</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-medium px-3" href="/analytics">📈 Analytics</a>
              </li>
            </ul>

            {/* Right side items */}
            <div className="d-flex align-items-center">
              {/* Search Bar */}
              <div className="me-3 d-none d-lg-block">
                <div className="input-group" style={{ width: '250px' }}>
                  <span className="input-group-text bg-light border-0">🔍</span>
                  <input
                    type="text"
                    className="form-control bg-light border-0"
                    placeholder="Search expenses..."
                  />
                </div>
              </div>

              {/* Add Expense Button */}
              <button className="btn btn-success btn-sm me-3 fw-medium">+ Add Expense</button>

              {/* Alerts Dropdown */}
              <div className="dropdown me-3">
                <button
                  className="btn btn-outline-light position-relative border-0"
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  🔔
                  {alertCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {alertCount}
                    </span>
                  )}
                </button>

                {isAlertsOpen && (
                  <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ width: '320px', right: 0, top: '100%' }}>
                    <div className="dropdown-header d-flex justify-content-between align-items-center">
                      <span className="fw-medium">Notifications</span>
                      <small className="text-primary" style={{ cursor: 'pointer' }}>Mark all read</small>
                    </div>
                    <div className="dropdown-divider"></div>

                    {Alerts.map(alert => (
                      <div key={alert.id} className="dropdown-item-text p-3 border-bottom">
                        <div className="d-flex">
                          <div className={`me-2 ${
                            alert.type === 'warning' ? 'text-warning' :
                            alert.type === 'danger' ? 'text-danger' : 'text-info'
                          }`}>
                            {alert.type === 'warning' ? '⚠️' :
                              alert.type === 'danger' ? '🚨' : 'ℹ️'}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-medium small">{alert.message}</div>
                            <small className="text-muted">{alert.time}</small>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="dropdown-item text-center">
                      <small><a href="#" className="text-decoration-none">View all notifications</a></small>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="dropdown">
                <button className="btn p-0 border-0" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="rounded-circle"
                    width="40"
                    height="40"
                    style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                  />
                </button>

                {isProfileOpen && (
                  <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ right: 0, top: '100%' }}>
                    <div className="dropdown-header">
                      <div className="d-flex align-items-center">
                        <img src={user.avatar} alt="Profile" className="rounded-circle me-2" width="32" height="32" />
                        <div>
                          <div className="fw-medium">{user.name}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item" href="#profile">👤 My Profile</a>
                    <a className="dropdown-item" href="#settings">⚙️ Settings</a>
                    <a className="dropdown-item" href="#billing">💳 Billing</a>
                    <a className="dropdown-item" href="#help">❓ Help & Support</a>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item text-danger" href="#logout">🚪 Sign Out</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop for dropdowns */}
      {(isProfileOpen || isAlertsOpen) && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 999 }}
          onClick={() => {
            setIsProfileOpen(false);
            setIsAlertsOpen(false);
          }}
        />
      )}
    </>
  );
}

export default Navbar;
