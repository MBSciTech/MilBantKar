import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import { getAuthSession } from './utils/authSession';

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://milbantkar-1.onrender.com";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const session = getAuthSession();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Initialize notifications
async function initializeNotifications() {
  try {
    const session = getAuthSession();
    const userId = session?.userId || localStorage.getItem('userId');
    
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
    getAuthSession();

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
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events user={localStorage} /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path="/transaction" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile username={localStorage.getItem('username')} /></ProtectedRoute>} />
          <Route path='/events/:eventId' element={<ProtectedRoute><EventPage /></ProtectedRoute>}/>
          <Route path='/visualise' element={<ProtectedRoute><Visualise/></ProtectedRoute>}/>
          <Route path='/admin' element={<ProtectedRoute><AdminPanel/></ProtectedRoute>}/>
          <Route path='/help' element={<Help/>}/>
          <Route path='/settings' element={<ProtectedRoute><SettingsPage/></ProtectedRoute>}/>
          <Route path='/scanner' element={<ProtectedRoute><QRScanner/></ProtectedRoute>}/>
          <Route path='/calculate' element={<ProtectedRoute><Calculate/></ProtectedRoute>}/>
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
