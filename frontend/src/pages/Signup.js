import React, { useState } from 'react';

function Signup() {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      phone: '',
      password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        // In your actual app, uncomment these lines:
        const res = await fetch('https://milbantkar-1.onrender.com/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        alert(data.message);
  
        
      } catch (err) {
        console.error(err);
        alert('Signup failed!');
        setIsLoading(false);
      }
    };
  
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '60px', height: '60px'}}>
                    <span className="text-white fs-4">✨</span>
                  </div>
                  <h2 className="card-title text-dark mb-1">Create Account</h2>
                  <p className="text-muted">Start managing your expenses today</p>
                </div>
  
                <div>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label text-dark fw-medium">Username</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <span className="text-muted">👤</span>
                      </span>
                      <input 
                        type="text"
                        className="form-control border-start-0 ps-2"
                        id="username"
                        name="username" 
                        placeholder="Choose a username" 
                        value={formData.username}
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>
  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label text-dark fw-medium">Email</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <span className="text-muted">📧</span>
                      </span>
                      <input 
                        type="email" 
                        className="form-control border-start-0 ps-2"
                        id="email"
                        name="email" 
                        placeholder="Enter your email" 
                        value={formData.email}
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>
  
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label text-dark fw-medium">Phone <span className="text-muted">(Optional)</span></label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <span className="text-muted">📱</span>
                      </span>
                      <input 
                        type="tel" 
                        className="form-control border-start-0 ps-2"
                        id="phone"
                        name="phone" 
                        placeholder="Enter your phone number" 
                        value={formData.phone}
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
  
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label text-dark fw-medium">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <span className="text-muted">🔒</span>
                      </span>
                      <input 
                        type="password" 
                        className="form-control border-start-0 ps-2"
                        id="password"
                        name="password" 
                        placeholder="Create a secure password" 
                        value={formData.password}
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>
  
                  <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" id="terms" required />
                    <label className="form-check-label text-muted" htmlFor="terms">
                      I agree to the <a href="#" className="text-decoration-none text-primary">Terms of Service</a> and <a href="#" className="text-decoration-none text-primary">Privacy Policy</a>
                    </label>
                  </div>
  
                  <button 
                    type="button" 
                    className="btn btn-success w-100 py-2 fw-medium"
                    disabled={isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
  
                  <div className="text-center mt-4">
                    <span className="text-muted">Already have an account? </span>
                    <a href="login" className="text-decoration-none text-success fw-medium">Sign in</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default Signup