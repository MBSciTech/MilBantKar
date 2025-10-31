import React, { useState, useEffect, useRef } from 'react';
import { User, Edit3, Camera, Save, X, Mail, Phone, Calendar, Shield } from 'lucide-react';

const Profile = ({ username }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://milbantkar-1.onrender.com/api/user/${username}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData[0]);
        console.log(userData);
        setEditForm({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditing(!editing);
    if (!editing) {
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setProfilePicPreview(null);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB. Please choose a smaller image.');
        event.target.value = ''; // Reset file input
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Compress the image to reduce payload size
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800; // Max width for profile pic
          const maxHeight = 800; // Max height for profile pic
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfilePicPreview(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare payload
      const payload = {
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
      };
      if (profilePicPreview) {
        payload.profilePic = profilePicPreview;
      }
      // Send update to backend
      const response = await fetch(`https://milbantkar-1.onrender.com/api/user/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        setProfilePicPreview(null);
        // Update localStorage username if changed
        if (editForm.username && editForm.username !== user.username) {
          localStorage.setItem('username', editForm.username);
        }
        alert('Profile updated successfully!');
      } else {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Handle HTML error responses (like 413)
          if (response.status === 413) {
            errorMessage = 'Image is too large. Please choose a smaller image (recommended: under 1MB).';
          } else {
            errorMessage = `Error: ${response.status} ${response.statusText}`;
          }
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Helper function to safely get balance values
  const getBalance = (type) => {
    return user?.balances?.[type] || 0;
  };

  // Custom styles for glassmorphism effect
  const styles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      transition: all 0.3s ease;
    }
    
    .glass-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45);
    }
    
    .glass-input {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }
    
    .glass-input:focus {
      background: rgba(255, 255, 255, 0.7);
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
    
    .glass-display {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .profile-pic-container {
      position: relative;
      transition: transform 0.3s ease;
    }
    
    .profile-pic-container:hover {
      transform: scale(1.05);
    }
    
    .profile-pic {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: 4px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      object-fit: cover;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    
    .profile-pic-placeholder {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: 4px solid rgba(255, 255, 255, 0.3);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    
    .camera-btn {
      position: absolute;
      bottom: -8px;
      right: -8px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007bff, #6610f2);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
    }
    
    .camera-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.6);
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .btn-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
      color: white;
    }
    
    .btn-success-gradient {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      border: none;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
    }
    
    .btn-success-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.6);
      color: white;
    }
    
    .progress-glass {
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border-radius: 10px;
      overflow: hidden;
    }
    
    .progress-bar-red {
      background: linear-gradient(90deg, #ff6b6b, #ee5a52);
      transition: width 1s ease-out;
    }
    
    .progress-bar-green {
      background: linear-gradient(90deg, #51cf66, #40c057);
      transition: width 1s ease-out;
    }
    
    .admin-badge {
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      color: white;
      border-radius: 20px;
      padding: 5px 15px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
    
    .page-background {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px 0;
    }
    
    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
      .profile-pic, .profile-pic-placeholder {
        width: 120px;
        height: 120px;
      }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="page-background d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-3"></div>
            <p className="text-white">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <div className="page-background d-flex align-items-center justify-content-center">
          <div className="glass-card rounded p-5 text-center">
            <User size={64} className="text-muted mb-3" />
            <h2 className="h4 text-dark mb-2">User Not Found</h2>
            <p className="text-muted">The requested profile could not be loaded.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page-background">
        <div style={{'marginTop':'70px'}} className="container">
          {/* Header */}
          <div className="glass-card rounded p-4 p-md-5 mb-4">
            <div className="row align-items-center">
              <div className="col-12 col-md-auto text-center mb-4 mb-md-0">
                <div className="profile-pic-container d-inline-block">
                  {(profilePicPreview || user.profilePic) ? (
                    <img
                      src={profilePicPreview || user.profilePic}
                      alt="Profile"
                      className="profile-pic"
                    />
                  ) : (
                    <div className="profile-pic-placeholder">
                      <User size={60} color="white" />
                    </div>
                  )}
                  
                  {editing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="camera-btn"
                    >
                      <Camera size={20} />
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="d-none"
                  />
                </div>
              </div>

              <div className="col-12 col-md text-center text-md-start">
                <div className="d-flex flex-column flex-md-row align-items-center gap-3 mb-3">
                  <h1 className="h2 gradient-text mb-0 fw-bold">
                    {user.username || 'Anonymous User'}
                  </h1>
                  {user.isAdmin && (
                    <span className="admin-badge d-flex align-items-center gap-1">
                      <Shield size={16} />
                      Admin
                    </span>
                  )}
                </div>
                
                <p className="text-muted mb-3">
                  Member since {formatDate(user.createdAt)}
                </p>
                
                <button
                  onClick={handleEditToggle}
                  className="btn btn-gradient px-4 py-2 d-flex align-items-center gap-2 mx-auto mx-md-0"
                >
                  {editing ? <X size={20} /> : <Edit3 size={20} />}
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Personal Information */}
            <div className="col-12 col-lg-6 mb-4">
              <div className="glass-card rounded p-4 h-100">
                <h2 className="h4 text-dark mb-4 d-flex align-items-center gap-2">
                  <User size={24} className="text-primary" />
                  Personal Information
                </h2>
                
                <div className="row g-4">
                  {/* Username */}
                  <div className="col-12">
                    <label className="form-label fw-medium text-dark">Username</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="form-control glass-input rounded"
                        placeholder="Enter username"
                      />
                    ) : (
                      <div className="glass-display rounded p-3">
                        <p className="mb-0 text-dark">{user.username || 'Not set'}</p>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-12">
                    <label className="form-label fw-medium text-dark d-flex align-items-center gap-2">
                      <Mail size={16} className="text-primary" />
                      Email
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="form-control glass-input rounded"
                        placeholder="Enter email"
                      />
                    ) : (
                      <div className="glass-display rounded p-3">
                        <p className="mb-0 text-dark">{user.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-12">
                    <label className="form-label fw-medium text-dark d-flex align-items-center gap-2">
                      <Phone size={16} className="text-primary" />
                      Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="form-control glass-input rounded"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="glass-display rounded p-3">
                        <p className="mb-0 text-dark">{user.phone || 'Not set'}</p>
                      </div>
                    )}
                  </div>

                  {/* Join Date */}
                  <div className="col-12">
                    <label className="form-label fw-medium text-dark d-flex align-items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      Member Since
                    </label>
                    <div className="glass-display rounded p-3">
                      <p className="mb-0 text-dark">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="col-12 col-lg-6 mb-4">
              <div className="glass-card rounded p-4 h-100">
                <h2 className="h4 text-dark mb-4 d-flex align-items-center gap-2">
                  ₹
                  Financial Overview
                </h2>
                
                <div className="row g-4">
                  {/* Owed to Others */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium text-dark mb-0">You Owe Others</label>
                      <span className="text-danger fw-bold">
                        {formatCurrency(getBalance('owedToOthers'))}
                      </span>
                    </div>
                    <div className="progress-glass" style={{height: '8px'}}>
                      <div 
                        className="progress-bar-red h-100"
                        style={{
                          width: `${Math.min((getBalance('owedToOthers') / Math.max(getBalance('owedToOthers') + getBalance('owedByOthers'), 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Owed by Others */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium text-dark mb-0">Others Owe You</label>
                      <span className="text-success fw-bold">
                        {formatCurrency(getBalance('owedByOthers'))}
                      </span>
                    </div>
                    <div className="progress-glass" style={{height: '8px'}}>
                      <div 
                        className="progress-bar-green h-100"
                        style={{
                          width: `${Math.min((getBalance('owedByOthers') / Math.max(getBalance('owedToOthers') + getBalance('owedByOthers'), 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Net Balance */}
                  <div className="col-12">
                    <div className="glass-display rounded p-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 text-dark mb-0">Net Balance:</span>
                        <span className={`h4 fw-bold mb-0 ${
                          getBalance('owedByOthers') - getBalance('owedToOthers') >= 0 
                            ? 'text-success' 
                            : 'text-danger'
                        }`}>
                          {formatCurrency(getBalance('owedByOthers') - getBalance('owedToOthers'))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {editing && (
            <div className="text-center">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-success-gradient px-5 py-3 d-flex align-items-center gap-2 mx-auto"
              >
                {saving ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-white" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;