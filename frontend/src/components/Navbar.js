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
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Home,
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Vote,
  Trash2,
  Eye,
  MessageSquare,
  CreditCard
} from 'lucide-react';

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [user, setUser] = useState({
    avatar: '', 
    username: 'Loading...',
    email: 'loading@example.com',
    isAdmin: false
  });

  // Refs for click-outside logic
  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  // Fetch current user data
  useEffect(() => {
    const username = typeof window !== 'undefined' && window.localStorage ? 
      localStorage.getItem('username') : 'demo_user';
    
    if (!username) return;
  
    fetch(`https://milbantkar-1.onrender.com/api/user/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const userData = Array.isArray(data) ? data[0] : data;
        if (userData) {
          setCurrentUser(userData);
          setUser({
            avatar: userData.profilePic || '',
            username: userData.username || '',
            email: userData.email || '',
            isAdmin: userData.isAdmin || false
          });
        }
      })
      .catch((err) => console.error('Error fetching user:', err));
  }, []);

  // Click outside logic for dropdowns
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
  
  // Fetch alerts
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    fetch("https://milbantkar-1.onrender.com/api/alerts")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Filter alerts for current user if we have user data
        const userAlerts = currentUser ? 
          data.filter(alert => 
            !alert.receiver || 
            alert.receiver._id === currentUser._id || 
            alert.receiver.username === currentUser.username
          ).reverse() : 
          data.reverse();
        
        setAlerts(userAlerts);
        
        // Count unseen alerts
        const unseenCount = userAlerts.filter(alert => !alert.seen).length;
        setAlertCount(unseenCount);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [currentUser]);

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, active: false },
    { path: "/history", label: "History", icon: FileText, active: false },
    { path: "/events", label: "Events", icon: Calendar, active: false },
    { path: "/visualise", label: "Visualise", icon: TrendingUp, active: false}
  ];

  const handleLinkClick = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('username');
    }
    console.log('Logging out...');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : 'unset';
    }
  };

  // Handle notification click
  const handleNotificationClick = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    setIsAlertsOpen(false);
    
    // Mark as seen (you can implement API call here)
    markAlertAsSeen(alert._id);
  };

  const markAlertAsSeen = async (alertId) => {
    try {
      // You'll need to implement this API endpoint
      await fetch(`https://milbantkar-1.onrender.com/api/alerts/seen/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert._id === alertId ? { ...alert, seen: true } : alert
      ));
      
      // Update count
      setAlertCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as seen:', error);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await fetch(`https://milbantkar-1.onrender.com/api/alerts/${alertId}`, {
        method: 'DELETE'
      });
      
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
      setIsModalOpen(false);
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const voteInPoll = async (alertId, optionIndex) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`https://milbantkar-1.onrender.com/api/alerts/vote/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          optionIndex: optionIndex
        })
      });
      
      if (response.ok) {
        const updatedAlert = await response.json();
        setAlerts(prev => prev.map(alert => 
          alert._id === alertId ? updatedAlert.alert : alert
        ));
        setSelectedAlert(updatedAlert.alert);
      }
    } catch (error) {
      console.error('Error voting in poll:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={20} className="text-warning" />;
      case 'info': return <Info size={20} className="text-info" />;
      case 'success': return <CheckCircle size={20} className="text-success" />;
      case 'poll': return <Vote size={20} className="text-primary" />;
      default: return <Bell size={20} className="text-secondary" />;
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'warning': return '#ffc107';
      case 'info': return '#0dcaf0';
      case 'success': return '#198754';
      case 'poll': return '#0d6efd';
      default: return '#6c757d';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInHours = Math.floor((now - alertDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
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
      min-width: 320px;
      max-width: 400px;
      padding: 1rem 0;
      transform: translateY(-10px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1002;
      max-height: 80vh;
      overflow-y: auto;
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

    .alert-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .alert-item:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .alert-item:last-child {
      border-bottom: none;
    }

    .alert-item.unread {
      background: rgba(13, 110, 253, 0.05);
      border-left: 4px solid #0d6efd;
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

      .dropdown-menu {
        min-width: 280px;
        max-width: 90vw;
      }
    }

    body.menu-open {
      overflow: hidden;
    }

    /* Modal Styles */
    .notification-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .notification-modal.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      transform: translateY(20px);
      transition: all 0.3s ease;
    }

    .notification-modal.show .modal-content {
      transform: translateY(0);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: between;
      gap: 1rem;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .poll-option {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .poll-option:hover {
      border-color: #0d6efd;
      background: rgba(13, 110, 253, 0.05);
    }

    .poll-option.voted {
      border-color: #198754;
      background: rgba(25, 135, 84, 0.1);
    }

    .progress-bar {
      height: 4px;
      background: #e9ecef;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: #0d6efd;
      border-radius: 2px;
      transition: width 0.3s ease;
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
                  onClick={(e) => { e.preventDefault(); handleLinkClick(item.path);}}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h6 style={{ margin: 0, fontWeight: 'bold' }}>Notifications</h6>
                    <button 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#0d6efd', 
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      onClick={() => setAlertCount(0)}
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                {alerts.length === 0 ? (
                  <div className="alert-item" style={{ textAlign: 'center', color: '#6c757d' }}>
                    <Bell size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <div>No notifications yet</div>
                  </div>
                ) : (
                  alerts.slice(0, 5).map(alert => (
                    <div 
                      key={alert._id} 
                      className={`alert-item ${!alert.seen ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(alert)}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                        {getAlertIcon(alert.type)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: !alert.seen ? '600' : '500', 
                            fontSize: '0.9rem',
                            marginBottom: '0.25rem',
                            lineHeight: '1.4'
                          }}>
                            {alert.message}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Clock size={12} />
                            {formatTimeAgo(alert.createdAt)}
                            {alert.sender && (
                              <>
                                <span>•</span>
                                <span>from {alert.sender.username}</span>
                              </>
                            )}
                          </div>
                          {alert.type === 'poll' && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#0d6efd',
                              marginTop: '0.25rem',
                              fontWeight: '500'
                            }}>
                              <Vote size={12} style={{ marginRight: '0.25rem' }} />
                              Poll • Click to vote
                            </div>
                          )}
                        </div>
                        {!alert.seen && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            background: getAlertTypeColor(alert.type),
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '0.5rem'
                          }}></div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {alerts.length > 5 && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <button 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#0d6efd', 
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.preventDefault(); handleLinkClick('/notifications'); }}
                    >
                      View all {alerts.length} notifications →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile */}
            <div className="dropdown" ref={profileRef}>
              <button 
                style={{ background: 'none', border: 'none', padding: 0 }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" style={{ borderRadius: '50%', width: '40px', height: '40px' }} />
                    ) : (
                      <div style={{ 
                        borderRadius: '50%', 
                        background: '#0d6efd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '40px', 
                        height: '40px' 
                      }}>
                        <User size={20} color="white" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                      <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{user.email}</div>
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
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '0.5rem 0' }}></div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" style={{ borderRadius: '50%', width: '40px', height: '40px' }} />
            ) : (
              <div style={{ 
                borderRadius: '50%', 
                background: '#0d6efd', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '40px', 
                height: '40px' 
              }}>
                <User size={20} color="white" />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 'bold' }}>{user.username}</div>
              <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{user.email}</div>
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
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '0.5rem 0' }}></div>
          <a href="/logout" className="dropdown-item danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <LogOut size={18} />
            Sign Out
          </a>
        </div>
      </div>

      {/* Notification Modal */}
      {selectedAlert && (
        <div className={`notification-modal ${isModalOpen ? 'show' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsModalOpen(false);
            setSelectedAlert(null);
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                {getAlertIcon(selectedAlert.type)}
                <div>
                  <h5 style={{ margin: 0, fontWeight: '600' }}>
                    {selectedAlert.type.charAt(0).toUpperCase() + selectedAlert.type.slice(1)} Notification
                  </h5>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.25rem' }}>
                    {selectedAlert.sender ? `From: ${selectedAlert.sender.username}` : 'System notification'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAlert(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h6 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Message</h6>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                  {selectedAlert.message}
                </p>
              </div>

              {selectedAlert.expenseDetails && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h6 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>
                        Related Expense
                      </h6>

                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '1rem',
                          borderRadius: '12px',
                          border: '1px solid #e9ecef',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <CreditCard size={18} color="#6c63ff" />
                          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Expense Details</span>
                        </div>

                        <div style={{ display: 'grid', rowGap: '0.5rem', fontSize: '0.9rem' }}>
                          <div>
                            <strong>Paid By: </strong>
                            {console.log(selectedAlert.expenseDetails)}
                            {selectedAlert.expenseDetails?.paidBy?.username || "Unknown"}

                          </div>
                          <div>
                            <strong>Paid To: </strong>
                            {selectedAlert.expenseDetails?.paidTo?.username || "Unknown"}
                          </div>
                          <div>
                            <strong>Amount: </strong>
                            ₹{selectedAlert.expenseDetails?.amount}
                          </div>
                          <div>
                            <strong>Description: </strong>
                            {selectedAlert.expenseDetails?.description || "No description"}
                          </div>
                          <div>
                            <strong>Date: </strong>
                            {new Date(selectedAlert.expenseDetails?.date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Status: </strong>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: selectedAlert.expenseDetails?.status ? '#155724' : '#721c24',
                                backgroundColor: selectedAlert.expenseDetails?.status ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${
                                  selectedAlert.expenseDetails?.status ? '#c3e6cb' : '#f5c6cb'
                                }`,
                              }}
                            >
                              {selectedAlert.expenseDetails?.status ? 'Settled' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


              {selectedAlert.type === 'poll' && selectedAlert.pollOptions && (
                <div>
                  <h6 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Poll Options</h6>
                  {selectedAlert.pollOptions.map((option, index) => {
                    const totalVotes = selectedAlert.pollOptions.reduce((sum, opt) => sum + opt.votes.length, 0);
                    const votes = option.votes.length;
                    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                    const hasVoted = currentUser && option.votes.some(vote => 
                      (typeof vote === 'string' ? vote : vote._id || vote.toString()) === currentUser._id
                    );
                    
                    return (
                      <div
                        key={index}
                        className={`poll-option ${hasVoted ? 'voted' : ''}`}
                        onClick={() => !hasVoted && voteInPoll(selectedAlert._id, index)}
                        style={{ 
                          opacity: hasVoted ? 1 : 0.8,
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: hasVoted ? '600' : '500' }}>
                            {option.option}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {hasVoted && <CheckCircle size={16} className="text-success" />}
                            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                              {votes} vote{votes !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              background: hasVoted ? '#198754' : '#0d6efd'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#6c757d', 
                    marginTop: '1rem',
                    textAlign: 'center'
                  }}>
                    Total votes: {selectedAlert.pollOptions.reduce((sum, opt) => sum + opt.votes.length, 0)}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                <Clock size={14} style={{ marginRight: '0.25rem' }} />
                {new Date(selectedAlert.createdAt).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedAlert(null);
                  }}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {(isMobileMenuOpen || isModalOpen) && (
        <div 
          className={`menu-backdrop ${(isMobileMenuOpen || isModalOpen) ? 'show' : ''}`}
          onClick={() => {
            setIsProfileOpen(false);
            setIsAlertsOpen(false);
            if (isMobileMenuOpen) {
              toggleMobileMenu();
            }
            if (isModalOpen) {
              setIsModalOpen(false);
              setSelectedAlert(null);
            }
          }}
        />
      )}
    </>
  );
}

export default Navbar;