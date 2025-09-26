import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { 
  Plus, 
  Users, 
  Calendar, 
  Code, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  QrCode,
  Zap,
  Gift,
  
} from "lucide-react";

const API_BASE = "https://milbantkar-1.onrender.com";

function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ name: "", description: "" });
  const [joinCode, setJoinCode] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(false);
  const navigate = useNavigate();
  // Fetch user's events
  useEffect(() => {
    if (user?.userId) {
      setLoading(true);
      fetch(`${API_BASE}/api/events/user/${user.userId}`)
        .then((res) => res.json())
        .then((data) => {
          setEvents(data);
          setAnimatingCards(true);
          setTimeout(() => setAnimatingCards(false), 1000);
        })
        .catch((err) => console.error("Error fetching events:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Create new event
  const handleCreateEvent = async () => {
    console.log(user)
    if (!newEvent.name.trim() || !user || !user.userId) {
      showNotification("User not loaded. Please log in again.", "error");
      return;
    }



    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/events/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          createdBy: user.userId,
        }),
      });
      
      const res = await response.json();
      
      if (response.ok) {
        // Success animation
        const newEventData = res.event;
        setEvents([newEventData, ...events]);
        setNewEvent({ name: "", description: "" });
        
        // Show success notification
        showNotification("Event created successfully! 🎉", "success");
      } else {
        throw new Error(res.message || 'Failed to create event');
      }
    } catch (err) {
      console.error("Error creating event:", err);
      showNotification("Failed to create event ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  // Join event by code
  const handleJoinEvent = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/events/join/${joinCode}`, {
        userId: user.userId,
      });
      
      setEvents([res.data.event, ...events]);
      setJoinCode("");
      showNotification("Joined event successfully! ✅", "success");
    } catch (err) {
      console.error("Error joining event:", err);
      showNotification("Failed to join event ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // Simple notification system - in a real app, you'd use a toast library
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Code copied to clipboard! 📋", "success");
  };

  // Custom styles
  const styles = `
    .events-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
    }

    .events-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 118, 117, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
      pointer-events: none;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      box-shadow: 
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transition: left 0.6s;
    }

    .glass-card:hover::before {
      left: 100%;
    }

    .glass-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 
        0 20px 40px 0 rgba(31, 38, 135, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    .hero-section {
      text-align: center;
      padding: 4rem 0 2rem;
      position: relative;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
      animation: slideInDown 0.8s ease-out;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
      animation: slideInUp 0.8s ease-out 0.2s both;
    }

    .floating-icon {
      position: absolute;
      animation: float 6s ease-in-out infinite;
    }

    .floating-icon:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
    .floating-icon:nth-child(2) { top: 20%; right: 15%; animation-delay: 2s; }
    .floating-icon:nth-child(3) { bottom: 30%; left: 5%; animation-delay: 4s; }
    .floating-icon:nth-child(4) { bottom: 20%; right: 10%; animation-delay: 1s; }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-20px) rotate(5deg); }
      66% { transform: translateY(10px) rotate(-5deg); }
    }

    .tab-container {
      display: flex;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 8px;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tab-button {
      flex: 1;
      padding: 1rem 2rem;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 16px;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .tab-button.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .tab-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }

    .tab-button:hover::before {
      left: 100%;
    }

    .form-glass {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 1rem 1.5rem;
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .form-glass::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-glass:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
    }

    .btn-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 16px;
      padding: 1rem 2rem;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }

    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-gradient:active {
      transform: translateY(0);
    }

    .btn-gradient:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-success-gradient {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    }

    .btn-success-gradient:hover {
      box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
    }

    .event-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .event-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .event-card:hover::before {
      opacity: 1;
    }

    .event-card:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    }

    .event-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      opacity: 0.8;
    }

    .event-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .code-display {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-family: 'Monaco', 'Consolas', monospace;
      font-weight: 600;
      letter-spacing: 2px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .code-display:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.02);
    }

    .pulse-animation {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
      100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .empty-state-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1rem;
      opacity: 0.6;
    }

    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    }

    .notification.success {
      background: linear-gradient(135deg, #48bb78, #38a169);
    }

    .notification.error {
      background: linear-gradient(135deg, #f56565, #e53e3e);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInDown {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideInUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .stagger-animation {
      animation: slideInUp 0.6s ease-out both;
    }

    .stagger-animation:nth-child(1) { animation-delay: 0.1s; }
    .stagger-animation:nth-child(2) { animation-delay: 0.2s; }
    .stagger-animation:nth-child(3) { animation-delay: 0.3s; }
    .stagger-animation:nth-child(4) { animation-delay: 0.4s; }
    .stagger-animation:nth-child(5) { animation-delay: 0.5s; }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .tab-button {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
      
      .glass-card {
        margin-bottom: 1rem;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="events-container">
        {/* Floating background elements */}
        <div className="floating-icon">
          <Sparkles size={24} color="rgba(255,255,255,0.2)" />
        </div>
        <div className="floating-icon">
          <Users size={32} color="rgba(255,255,255,0.15)" />
        </div>
        <div className="floating-icon">
          <Calendar size={28} color="rgba(255,255,255,0.2)" />
        </div>
        <div className="floating-icon">
          <Gift size={26} color="rgba(255,255,255,0.18)" />
        </div>

        <div className="container py-4">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-title">
              Event Manager
            </h1>
            <p className="hero-subtitle">
              Create amazing events, split expenses effortlessly, and settle up with style
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="row justify-content-center mb-4">
            <div className="col-lg-6">
              <div className="tab-container">
                <button
                  className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  <Plus size={20} className="me-2" />
                  Create Event
                </button>
                <button
                  className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
                  onClick={() => setActiveTab('join')}
                >
                  <Code size={20} className="me-2" />
                  Join Event
                </button>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8">
              {activeTab === 'create' ? (
                <div className="glass-card p-4 stagger-animation">
                  <div className="row align-items-center mb-4">
                    <div className="col">
                      <h3 className="text-white mb-2 fw-bold">
                        <Sparkles size={28} className="me-2" />
                        Create New Event
                      </h3>
                      <p className="text-white-50 mb-0">
                        Start a new expense-sharing adventure
                      </p>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <input
                        type="text"
                        placeholder="What's the event name? (e.g., 'Goa Trip 2024')"
                        value={newEvent.name}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, name: e.target.value })
                        }
                        className="form-control form-glass"
                        maxLength={50}
                      />
                    </div>
                    
                    <div className="col-12">
                      <textarea
                        placeholder="Tell us more about this event... (optional)"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, description: e.target.value })
                        }
                        className="form-control form-glass"
                        rows={3}
                        maxLength={200}
                      />
                    </div>
                    
                    <div className="col-12">
                      <button
                        onClick={handleCreateEvent}
                        className={`btn btn-gradient w-100 ${loading ? 'pulse-animation' : ''}`}
                      >
                        {loading && <div className="spinner"></div>}
                        <Zap size={20} className="me-2" />
                        Create Event
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-4 stagger-animation">
                  <div className="row align-items-center mb-4">
                    <div className="col">
                      <h3 className="text-white mb-2 fw-bold">
                        <Users size={28} className="me-2" />
                        Join Existing Event
                      </h3>
                      <p className="text-white-50 mb-0">
                        Enter the event code to join the party
                      </p>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="form-control form-glass text-center"
                        style={{ letterSpacing: '4px', fontWeight: '600', fontSize: '1.25rem' }}
                      />
                    </div>
                    
                    <div className="col-12">
                      <button
                        onClick={handleJoinEvent}
                        disabled={loading || !joinCode.trim()}
                        className={`btn btn-success-gradient w-100 ${loading ? 'pulse-animation' : ''}`}
                      >
                        {loading && <div className="spinner"></div>}
                        <Gift size={20} className="me-2" />
                        Join Event
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="row">
            <div className="col-12">
              <div className="glass-card p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h3 className="text-white fw-bold mb-0">
                    <Calendar size={28} className="me-2" />
                    My Events
                  </h3>
                  <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {loading && events.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="spinner mx-auto mb-3" style={{ width: '40px', height: '40px' }}></div>
                    <p className="text-white-50">Loading your events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="empty-state">
                    <Calendar className="empty-state-icon" />
                    <h4 className="mb-3">No Events Yet</h4>
                    <p className="mb-4">Ready to split some expenses? Create your first event or join one using a code!</p>
                    <button
                      className="btn btn-gradient"
                      onClick={() => setActiveTab('create')}
                    >
                      <Plus size={20} className="me-2" />
                      Create Your First Event
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {events.map((event, index) => (
                      <div key={event.userId} className="col-12 col-md-6 col-xl-4">
                        <div className={`event-card ${animatingCards ? 'stagger-animation' : ''}`}>
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="flex-grow-1">
                              <h5 className="text-white fw-bold mb-1">{event.name}</h5>
                              <p className="text-white-50 mb-0 small">{event.description || 'No description'}</p>
                            </div>
                            <ArrowRight size={20} className="text-white-50 flex-shrink-0 ms-2" onClick={() => navigate(`/events/${event._id}`)} />
                          </div>
                          
                          <div className="event-meta mb-3">
                            <span>
                              <Users size={16} />
                              {event.participants?.length || 0} members
                            </span>
                            <span>
                            ₹ {event.isClose ? "Active" : "Close"}
                          </span>

                          </div>
                          
                          <div 
                            className="code-display"
                            onClick={() => copyToClipboard(event.code)}
                          >
                            <div className="d-flex align-items-center">
                              <QrCode size={16} className="me-2" />
                              <span>{event.code}</span>
                            </div>
                            <Copy size={16} className="opacity-75" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Events;