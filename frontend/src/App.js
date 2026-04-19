import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Events from './components/Events';
import Budget from './components/Budget';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Transaction from './pages/Transaction';
import Profile from './components/Profile';
import EventPage from './components/EventPage';
import Visualise from './pages/Visualise';
import AdminPanel from './pages/AdminPanel';
import Help from './pages/Help';
import SettingsPage from './pages/SettingsPage';
import QRScanner from './components/QRScanner';
import Calculate from './pages/Calculate';

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://milbantkar-1.onrender.com";

// Initialize notifications
async function initializeNotifications() {
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      return; // User not logged in
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers are not supported');
      return;
    }

    // Register service worker
    try {
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered');

      // Request notification permission
      if (Notification.permission === 'granted') {
        // Already granted, subscribe to push
        await subscribeToPush(userId, registration);
      } else if (Notification.permission !== 'denied') {
        // Ask for permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush(userId, registration);
        }
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

// Subscribe user to push notifications
async function subscribeToPush(userId, registration) {
  try {
    const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || 
      'BAd8a7Z1LWECCANfOB8m2g_GC8amav5WiI0Tu8Ms7OqiD5aijWvOaNDMach4AnaHV11ojlezH99weg_aDeYHu3A';

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to backend
    const response = await fetch(`${API_BASE}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription })
    });

    if (response.ok) {
      console.log('✅ Push subscription saved');
    }
  } catch (error) {
    console.error('Error subscribing to push:', error);
  }
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  useEffect(() => {
    // Initialize notifications when user is logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
      initializeNotifications();
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideNavbar && <Navbar />}

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/events" element={<Events user={localStorage} />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/profile" element={<Profile username={localStorage.getItem('username')} />} />
          <Route path='/events/:eventId' element={<EventPage />}/>
          <Route path='/visualise' element={<Visualise/>}/>
          <Route path='/admin' element={<AdminPanel/>}/>
          <Route path='/help' element={<Help/>}/>
          <Route path='/settings' element={<SettingsPage/>}/>
          <Route path='/scanner' element={<QRScanner/>}/>
          <Route path='/calculate' element={<Calculate/>}/>
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
