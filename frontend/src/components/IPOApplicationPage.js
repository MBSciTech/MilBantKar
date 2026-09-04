import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FundingRecordForm from './FundingRecordForm';

const API_BASE = 'https://milbantkar-1.onrender.com';
const API_FALLBACK = 'http://localhost:5000';

function IPOApplicationPage({ event, fetchEventDetails }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newApp, setNewApp] = useState({ companyName: '', notes: '' });
  const [activeApp, setActiveApp] = useState(null); // to show funding records for an app

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/events/${event._id}/ipo-applications`).catch(() => axios.get(`${API_FALLBACK}/api/events/${event._id}/ipo-applications`));
      setApplications(res.data);
    } catch (error) {
      console.error('Error fetching applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event._id]);

  const handleCreateApp = async () => {
    try {
      const userId = localStorage.getItem('userId')?.replace(/"/g, '');
      const payload = {
        companyName: newApp.companyName,
        notes: newApp.notes,
        createdBy: userId,
        applicationDate: new Date()
      };
      await axios.post(`${API_BASE}/api/events/${event._id}/ipo-applications`, payload).catch(() => axios.post(`${API_FALLBACK}/api/events/${event._id}/ipo-applications`, payload));
      setNewApp({ companyName: '', notes: '' });
      setShowAddApp(false);
      fetchApplications();
    } catch (error) {
      console.error('Error creating IPO app', error);
    }
  };

  if (loading) return <div>Loading IPOs...</div>;

  return (
    <div className="ipo-page-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white">IPO Applications for {event.name}</h2>
        <button className="btn btn-light" onClick={() => setShowAddApp(!showAddApp)}>
          {showAddApp ? 'Cancel' : 'Add New IPO'}
        </button>
      </div>

      {showAddApp && (
        <div className="card mb-4 p-3 bg-dark text-white">
          <h4>Create New IPO Application</h4>
          <input 
            type="text" 
            className="form-control mb-2" 
            placeholder="Company Name" 
            value={newApp.companyName}
            onChange={(e) => setNewApp({...newApp, companyName: e.target.value})}
          />
          <textarea 
            className="form-control mb-2" 
            placeholder="Notes (optional)" 
            value={newApp.notes}
            onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
          />
          <button className="btn btn-primary" onClick={handleCreateApp}>Save</button>
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <div className="list-group">
            {applications.map(app => (
              <button 
                key={app._id} 
                className={`list-group-item list-group-item-action ${activeApp?._id === app._id ? 'active' : ''} bg-dark text-white border-secondary`}
                onClick={() => setActiveApp(app)}
              >
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">{app.companyName}</h5>
                  <small>{new Date(app.applicationDate).toLocaleDateString()}</small>
                </div>
                <p className="mb-1">Status: {app.status}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="col-md-8">
          {activeApp ? (
            <div className="card bg-dark text-white p-3 border-secondary">
              <h3>{activeApp.companyName} - Funding Details</h3>
              <FundingRecordForm ipoApp={activeApp} event={event} onRecordAdded={() => {}} />
            </div>
          ) : (
            <div className="text-white text-center mt-5">
              Select an IPO to view or add funding records
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IPOApplicationPage;
