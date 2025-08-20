import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Plus, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Shield,
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Home,
  Wallet
} from 'lucide-react';

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(3);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({
    avatar: '', 
    username: 'Loading...',
    email: 'loading@example.com',
    isAdmin: false
  });

  // Refs for click-outside logic
  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) return;
  
    fetch(`https://milbantkar-1.onrender.com/api/user/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const userData = Array.isArray(data) ? data[0] : data;
        if (userData) {
          setUser({
            avatar: userData.profilePic || '',
            username: userData.username || '',
            email: userData.email || '',
            isAdmin: userData.isAdmin || false
          });
        }
      })
      .catch((err) => console.error('❌ Error fetching user:', err));
  }, []);

  // Click outside logic for profile and alerts dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (isAlertsOpen && alertsRef.current && !alertsRef.current.contains(event.target)) {
        setIsAlertsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isAlertsOpen]);

  const alerts = [
    { id: 1, message: "Budget limit exceeded for Shopping", time: "2 hours ago", type: "warning" },
    { id: 2, message: "Monthly report is ready", time: "1 day ago", type: "info" },
    { id: 3, message: "Payment reminder: Credit card bill", time: "3 days ago", type: "danger" }
  ];

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, active: true },
    { path: "/history", label: "History", icon: FileText },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/budgets", label: "Budgets", icon: Target },
    { path: "/analytics", label: "Analytics", icon: TrendingUp }
  ];

  const handleLinkClick = (path) => {
    // In a real app, you'd use React Router
    console.log(`Navigating to: ${path}`);
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    console.log('Logging out...');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : 'unset';
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Custom styles
  const styles = `
    .modern-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      padding: 0.75rem 0;
    }

    .navbar-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      z-index: 1001;
    }

    .navbar-brand:hover {
      transform: scale(1.05);
      color: white;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .navbar-brand:hover .brand-icon {
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
      transform: rotate(5deg);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      border-radius: 12px;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.6s;
    }

    .nav-link:hover::before {
      left: 100%;
    }

    .nav-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 1001;
    }

    .add-expense-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
      border: none;
      cursor: pointer;
    }

    .add-expense-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(72, 187, 120, 0.5);
      color: white;
    }

    .notification-btn {
      position: relative;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: linear-gradient(135deg, #f56565, #e53e3e);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 101, 101, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(245, 101, 101, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 101, 101, 0); }
    }

    .profile-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      object-fit: cover;
    }

    .profile-avatar:hover {
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .profile-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .profile-placeholder:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.75rem);
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      padding: 1rem 0;
      transform: translateY(-10px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1002;
    }

    .dropdown-menu.show {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }

    .dropdown-header {
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      margin-bottom: 0.5rem;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #374151;
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .dropdown-item:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      transform: translateX(4px);
    }

    .dropdown-item.danger:hover {
      background: rgba(245, 101, 101, 0.1);
      color: #f56565;
    }

    .mobile-menu-toggle {
      display: none;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 1001;
    }

    .mobile-menu-toggle:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      right: -100%;
      width: 320px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      transition: right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1003;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .mobile-menu.open {
      right: 0;
    }

    .mobile-menu-header {
      padding: 2rem 1.5rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mobile-menu-close {
      background: rgba(0, 0, 0, 0.1);
      border: none;
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-menu-close:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    .mobile-nav-links {
      padding: 1rem 0;
    }

    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      color: #374151;
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
      border-left: 4px solid transparent;
    }

    .mobile-nav-item:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border-left-color: #667eea;
    }

    .mobile-nav-item.active {
      background: rgba(102, 126, 234, 0.15);
      color: #667eea;
      border-left-color: #667eea;
    }

    .mobile-menu-footer {
      margin-top: auto;
      padding: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .mobile-add-expense {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }

    .mobile-add-expense:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
      color: white;
    }

    .menu-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1002;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
    }

    .menu-backdrop.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .alert-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .alert-item:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .alert-item:last-child {
      border-bottom: none;
    }

    .alert-icon {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .alert-icon.warning {
      background: #f59e0b;
    }

    .alert-icon.danger {
      background: #ef4444;
    }

    .alert-icon.info {
      background: #3b82f6;
    }

    @media (max-width: 1024px) {
      .nav-links {
        display: none;
      }
      
      .mobile-menu-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .add-expense-btn {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .navbar-content {
        padding: 0 1rem;
      }
      
      .navbar-brand {
        font-size: 1.25rem;
      }
      
      .brand-icon {
        width: 36px;
        height: 36px;
      }

      .mobile-menu {
        width: 100%;
      }
    }

    body.menu-open {
      overflow: hidden;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      
      {/* Main Navbar */}
      <nav className="modern-navbar">
        <div className="navbar-content">
          {/* Brand Logo */}
          <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}>
            <div className="brand-icon">
              <Wallet size={20} color="white" />
            </div>
            Mil Bant Kar
          </a>

          {/* Desktop Navigation */}
          <ul className="nav-links">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <a 
                  href={item.path}
                  className={`nav-link ${item.active ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(item.path); }}
                >
                  <item.icon size={18} />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right Section */}
          <div className="right-section">
            {/* Add Expense Button - Desktop Only */}
            <a 
              href="/transaction" 
              className="add-expense-btn"
              onClick={(e) => { e.preventDefault(); handleLinkClick('/transaction'); }}
            >
              <Plus size={18} />
              Add Expense
            </a>

            {/* Notifications */}
            <div className="dropdown" ref={alertsRef}>
              <button 
                className="notification-btn"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              >
                <Bell size={20} />
                {alertCount > 0 && (
                  <span className="notification-badge">{alertCount}</span>
                )}
              </button>

              <div className={`dropdown-menu ${isAlertsOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">Notifications</h6>
                    <button 
                      className="btn btn-sm btn-link text-primary p-0"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setAlertCount(0)}
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                {alerts.map(alert => (
                  <div key={alert.id} className="alert-item">
                    <div className="d-flex align-items-start gap-3">
                      <div className={`alert-icon ${alert.type} mt-1`}></div>
                      <div className="flex-grow-1">
                        <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                          {alert.message}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {alert.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-center pt-3">
                  <a 
                    href="/notifications" 
                    className="text-decoration-none fw-medium"
                    style={{ fontSize: '0.85rem' }}
                    onClick={(e) => { e.preventDefault(); handleLinkClick('/notifications'); }}
                  >
                    View all notifications →
                  </a>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="dropdown" ref={profileRef}>
              <button 
                className="btn p-0 border-0"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <User size={20} color="white" />
                  </div>
                )}
              </button>

              <div className={`dropdown-menu ${isProfileOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="d-flex align-items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="rounded-circle" width="40" height="40" />
                    ) : (
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <User size={20} color="white" />
                      </div>
                    )}
                    <div>
                      <div className="fw-bold">{user.username}</div>
                      <div className="text-muted small">{user.email}</div>
                    </div>
                  </div>
                </div>

                <a href="/profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                  <User size={18} />
                  My Profile
                </a>
                <a href="/settings" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/settings'); }}>
                  <Settings size={18} />
                  Settings
                </a>
                <a href="/help" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/help'); }}>
                  <HelpCircle size={18} />
                  Help & Support
                </a>
                {user.isAdmin && (
                  <a href="/admin" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/admin'); }}>
                    <Shield size={18} />
                    Admin Panel
                  </a>
                )}
                <hr className="dropdown-divider" />
                <a href="/logout" className="dropdown-item danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                  <LogOut size={18} />
                  Sign Out
                </a>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="d-flex align-items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="rounded-circle" width="40" height="40" />
            ) : (
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <User size={20} color="white" />
              </div>
            )}
            <div>
              <div className="fw-bold">{user.username}</div>
              <div className="text-muted small">{user.email}</div>
            </div>
          </div>
          <button className="mobile-menu-close" onClick={toggleMobileMenu}>
            <X size={20} />
          </button>
        </div>

        <div className="mobile-nav-links">
          {navigationItems.map((item) => (
            <a 
              key={item.path}
              href={item.path}
              className={`mobile-nav-item ${item.active ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleLinkClick(item.path); }}
            >
              <item.icon size={20} />
              {item.label}
            </a>
          ))}
        </div>

        <div className="mobile-menu-footer">
          <a 
            href="/transaction" 
            className="mobile-add-expense"
            onClick={(e) => { e.preventDefault(); handleLinkClick('/transaction'); }}
          >
            <Plus size={20} />
            Add Expense
          </a>
          
          <a href="/profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
            <User size={18} />
            My Profile
          </a>
          <a href="/settings" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/settings'); }}>
            <Settings size={18} />
            Settings
          </a>
          <a href="/help" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/help'); }}>
            <HelpCircle size={18} />
            Help & Support
          </a>
          {user.isAdmin && (
            <a href="/admin" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLinkClick('/admin'); }}>
              <Shield size={18} />
              Admin Panel
            </a>
          )}
          <hr />
          <a href="/logout" className="dropdown-item danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <LogOut size={18} />
            Sign Out
          </a>
        </div>
      </div>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="menu-backdrop show"
          onClick={() => {
            setIsProfileOpen(false);
            setIsAlertsOpen(false);
            if (isMobileMenuOpen) {
              toggleMobileMenu();
            }
          }}
        />
      )}
    </>
  );
}

export default Navbar;