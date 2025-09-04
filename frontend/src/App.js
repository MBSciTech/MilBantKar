import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />

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
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
