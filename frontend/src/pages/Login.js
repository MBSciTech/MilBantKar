import React, { useState } from 'react';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('https://milbantkar-1.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Login successful!');
        console.log("User info:", data.user);

        // Save both username & ID in localStorage
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userId', data.user.id);

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.error || 'Login failed!');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed! Server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }
        
        .login-container::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: drift 20s linear infinite;
        }
        
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .gradient-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          font-size: 1.2rem;
        }
        
        .custom-input {
          padding-left: 50px !important;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .custom-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
        }
        
        .password-toggle {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          z-index: 10;
          color: #999;
          transition: color 0.3s;
        }
        
        .password-toggle:hover {
          color: #667eea;
        }
        
        .btn-login {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }
        
        .form-check-input:checked {
          background-color: #667eea;
          border-color: #667eea;
        }
        
        .link-primary {
          color: #667eea !important;
          font-weight: 600;
        }
        
        .link-primary:hover {
          color: #764ba2 !important;
        }
      `}</style>

      <div className="login-container d-flex align-items-center justify-content-center p-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-5 col-xl-4">
              <div className="login-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="gradient-icon rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '70px', height: '70px'}}>
                    <span className="text-white fs-1">💰</span>
                  </div>
                  <h2 className="fw-bold mb-2" style={{color: '#333'}}>Welcome Back</h2>
                  <p className="text-muted mb-0">Sign in to manage your expenses</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-semibold" style={{color: '#333'}}>Username</label>
                    <div className="input-with-icon">
                      <span className="input-icon">👤</span>
                      <input 
                        type="text" 
                        className="form-control custom-input"
                        id="username"
                        name="username" 
                        placeholder="Enter your username" 
                        value={formData.username}
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold" style={{color: '#333'}}>Password</label>
                    <div className="input-with-icon position-relative">
                      <span className="input-icon">🔒</span>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control custom-input"
                        id="password"
                        name="password" 
                        placeholder="Enter your password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="rememberMe" />
                      <label className="form-check-label text-muted" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="link-primary text-decoration-none">Forgot password?</a>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-login text-white w-100 py-3 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <span className="text-muted">Don't have an account? </span>
                    <a href="/signup" className="link-primary text-decoration-none fw-semibold">Sign up</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;