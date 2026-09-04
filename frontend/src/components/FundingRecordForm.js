import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://milbantkar-1.onrender.com';
const API_FALLBACK = 'http://localhost:5000';

function FundingRecordForm({ ipoApp, event, onRecordAdded }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [financierId, setFinancierId] = useState('');
  const [applicants, setApplicants] = useState([{ applicantId: '', amountFunded: '', file: null, ocrOverride: false, canOverride: false }]);
  
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getHeaders = () => {
    const userId = localStorage.getItem('userId')?.replace(/"/g, '');
    return { 'X-User-Id': userId };
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/funding-records?status=`, { headers: getHeaders() }).catch(() => axios.get(`${API_FALLBACK}/api/funding-records`, { headers: getHeaders() }));
      // filter by ipoApplicationId locally or via query.
      const filtered = res.data.filter(r => r.ipoApplicationId?._id === ipoApp._id || r.ipoApplicationId === ipoApp._id);
      setRecords(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const currentUserId = localStorage.getItem('userId')?.replace(/"/g, '');
    if (currentUserId) setFinancierId(currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipoApp._id]);

  const handleAddApplicant = () => {
    setApplicants([...applicants, { applicantId: '', amountFunded: '', file: null, ocrOverride: false, canOverride: false }]);
  };

  const handleFileChange = (index, file) => {
    const newApps = [...applicants];
    newApps[index].file = file;
    setApplicants(newApps);
  };

  const handleChange = (index, field, value) => {
    const newApps = [...applicants];
    newApps[index][field] = value;
    setApplicants(newApps);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!financierId) {
      setErrorMsg('Financier required');
      return;
    }

    setUploading(true);
    try {
      const payloadApplicants = [];

      for (const app of applicants) {
        if (!app.applicantId || !app.amountFunded || !app.file) {
          setErrorMsg('All applicant fields (user, amount, screenshot) are required');
          setUploading(false);
          return;
        }
        
        // Upload file
        const formData = new FormData();
        formData.append('screenshot', app.file);
        const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData).catch(() => axios.post(`${API_FALLBACK}/api/upload`, formData));
        
        payloadApplicants.push({
          applicantId: app.applicantId,
          amountFunded: Number(app.amountFunded),
          fundingProofScreenshot: uploadRes.data.path,
          requestOverride: app.ocrOverride
        });
      }

      await axios.post(`${API_BASE}/api/ipo-applications/${ipoApp._id}/funding-records`, {
        financierId,
        applicants: payloadApplicants
      }, { headers: getHeaders() }).catch(err => {
         return axios.post(`${API_FALLBACK}/api/ipo-applications/${ipoApp._id}/funding-records`, {
            financierId,
            applicants: payloadApplicants
          }, { headers: getHeaders() });
      });

      setApplicants([{ applicantId: '', amountFunded: '', file: null, ocrOverride: false, canOverride: false }]);
      fetchRecords();
      if(onRecordAdded) onRecordAdded();
      
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.canOverride) {
        setErrorMsg(err.response.data.message);
        // Allow override
        const newApps = [...applicants];
        const failedAppIndex = newApps.findIndex(a => a.applicantId === err.response.data.applicantId);
        if(failedAppIndex >= 0) {
            newApps[failedAppIndex].canOverride = true;
            setApplicants(newApps);
        }
      } else {
        setErrorMsg(err.response?.data?.message || 'Error creating funding records');
      }
    } finally {
      setUploading(false);
    }
  };

  // State transitions
  const handleTransition = async (recordId, endpoint, data, file) => {
    try {
      let screenshotPath = data[`${endpoint}ProofScreenshot`];
      
      if (file) {
        const formData = new FormData();
        formData.append('screenshot', file);
        const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData).catch(() => axios.post(`${API_FALLBACK}/api/upload`, formData));
        screenshotPath = uploadRes.data.path;
        data[`${endpoint}ProofScreenshot`] = screenshotPath;
      }
      
      await axios.patch(`${API_BASE}/api/funding-records/${recordId}/${endpoint}`, data, { headers: getHeaders() }).catch(err => {
         return axios.patch(`${API_FALLBACK}/api/funding-records/${recordId}/${endpoint}`, data, { headers: getHeaders() });
      });
      fetchRecords();
    } catch(err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="mt-3">
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      
      <div className="card bg-secondary text-white p-3 mb-4">
        <h5>Fund this IPO</h5>
        <div className="mb-2">
          <label>Financier:</label>
          <select className="form-control" value={financierId} onChange={(e) => setFinancierId(e.target.value)}>
             <option value="">Select Financier</option>
             {event.participants?.map(p => (
               <option key={p._id} value={p._id}>{p.username}</option>
             ))}
          </select>
        </div>

        {applicants.map((app, index) => (
          <div key={index} className="border p-2 mb-2 rounded bg-dark">
            <h6>Applicant {index + 1}</h6>
            <div className="row">
              <div className="col-md-4">
                <select className="form-control" value={app.applicantId} onChange={(e) => handleChange(index, 'applicantId', e.target.value)}>
                   <option value="">Select Applicant</option>
                   {event.participants?.map(p => (
                     <option key={p._id} value={p._id}>{p.username}</option>
                   ))}
                </select>
              </div>
              <div className="col-md-3">
                <input type="number" className="form-control" placeholder="Amount (₹)" value={app.amountFunded} onChange={(e) => handleChange(index, 'amountFunded', e.target.value)} />
              </div>
              <div className="col-md-5">
                <input type="file" className="form-control" accept="image/*" onChange={(e) => handleFileChange(index, e.target.files[0])} />
              </div>
            </div>
            {app.canOverride && (
              <div className="mt-2 text-warning">
                <label>
                  <input type="checkbox" checked={app.ocrOverride} onChange={(e) => handleChange(index, 'ocrOverride', e.target.checked)} /> 
                  {' '} Manual OCR Override (Alert will be sent)
                </label>
              </div>
            )}
          </div>
        ))}
        
        <div className="d-flex justify-content-between mt-2">
           <button className="btn btn-outline-light btn-sm" onClick={handleAddApplicant}>+ Add Another Applicant</button>
           <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
             {uploading ? 'Processing...' : 'Submit Funding'}
           </button>
        </div>
      </div>

      <h5>Existing Funding Records</h5>
      {loading ? <p>Loading records...</p> : records.length === 0 ? <p>No records found.</p> : (
        <div className="list-group">
          {records.map(record => (
            <div key={record._id} className="list-group-item bg-dark text-white border-secondary mb-2">
              <div className="d-flex justify-content-between">
                 <strong>{record.financierId?.username} → {record.applicantId?.username}</strong>
                 <span>₹{record.amountFunded}</span>
              </div>
              <div className="text-muted small">Status: {record.overallStatus}</div>
              
              {/* Actions based on lifecycle */}
              {record.overallStatus === 'Funded' && (
                <div className="mt-2">
                   <button className="btn btn-sm btn-info me-2" onClick={() => handleTransition(record._id, 'allotment', { allotmentStatus: 'fully_allotted', allotedAmount: record.amountFunded })}>Full Allotment</button>
                   <button className="btn btn-sm btn-warning me-2" onClick={() => handleTransition(record._id, 'allotment', { allotmentStatus: 'not_allotted', allotedAmount: 0 })}>No Allotment</button>
                   <button className="btn btn-sm btn-secondary" onClick={() => {
                     const amt = prompt('Enter allotted amount:');
                     if(amt) handleTransition(record._id, 'allotment', { allotmentStatus: 'partially_allotted', allotedAmount: Number(amt) });
                   }}>Partial Allotment</button>
                </div>
              )}
              
              {/* Parallel Tracks for Partial Allotment or general post-allotment processing */}
              <div className="mt-3 row">
                  <div className="col-md-6 border-end border-secondary">
                      {record.refundStatus === 'pending' && (
                          <div>
                              <strong className="text-warning">Refund Pending (₹{record.refundAmount})</strong>
                              <button className="btn btn-sm btn-outline-warning ms-2" onClick={() => {
                                  // Simplified prompt for proof, usually this would be a real file upload UI per button
                                  const proof = prompt('Enter path for refund proof screenshot (simulated for simplicity, use actual upload in prod):', 'uploads/simulated_refund.png');
                                  if (proof) handleTransition(record._id, 'refund', { refundProofScreenshot: proof });
                              }}>Process Refund</button>
                          </div>
                      )}
                      {record.refundStatus === 'settled' && <strong className="text-success">Refund Settled</strong>}
                  </div>
                  <div className="col-md-6">
                      {record.holdingStatus === 'holding' && (
                          <div>
                              <strong className="text-info">Holding (₹{record.allotedAmount})</strong>
                              <button className="btn btn-sm btn-outline-info ms-2" onClick={() => {
                                  const proceeds = prompt('Enter sale proceeds (₹):');
                                  if (proceeds) handleTransition(record._id, 'sale', { saleProceeds: Number(proceeds) });
                              }}>Record Sale</button>
                          </div>
                      )}
                      {record.settlementStatus === 'pending' && (
                          <div>
                              <strong className="text-warning">Settlement Pending (₹{record.saleProceeds})</strong>
                              <button className="btn btn-sm btn-outline-success ms-2" onClick={() => {
                                  const proof = prompt('Enter path for settlement proof screenshot:', 'uploads/simulated_settle.png');
                                  if (proof) handleTransition(record._id, 'settle', { settlementProofScreenshot: proof });
                              }}>Process Settlement</button>
                          </div>
                      )}
                      {record.settlementStatus === 'settled' && <strong className="text-success">Settlement Complete</strong>}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FundingRecordForm;
