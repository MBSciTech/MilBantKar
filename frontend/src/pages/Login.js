import React, { useState, useEffect } from 'react';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if credentials are saved
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }

    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      .floating-shape {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Username is required';
        } else {
          delete newErrors.username;
        }
        break;
      
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 1) {
          newErrors.password = 'Please enter your password';
        } else {
          delete newErrors.password;
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name]);
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('rememberedUsername');
    }
  };

  const showNotification = (message, type) => {
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `custom-notification alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      border: none;
      border-radius: 12px;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validate all fields
    const isValid = Object.keys(formData).every(key => validateField(key, formData[key]));
    
    if (!isValid) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementById(firstError)?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('https://milbantkar-1.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('Login successful! Redirecting...', 'success');
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', formData.username);
        }

        // Save user data
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('authToken', data.token || 'dummy-token'); // In real app, use actual token

        setTimeout(() => {
        window.location.href = '/dashboard';
        }, 1500);
      } else {
        showNotification(data.error || 'Invalid credentials!', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error! Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClass = "form-control custom-input";
    if (errors[fieldName] && touched[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
      return `${baseClass} is-valid`;
    }
    return baseClass;
  };

  const handleDemoLogin = () => {
    setFormData({
      username: 'demo_user',
      password: 'demo123'
    });
    showNotification('Demo credentials filled! Click Sign In to continue.', 'success');
  };

  return (
    <>
      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
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
        
        .background-shapes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        .shape {
          position: absolute;
          opacity: 0.1;
          border-radius: 50%;
        }
        
        .shape-1 {
          width: 250px;
          height: 250px;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          top: 15%;
          left: 10%;
        }
        
        .shape-2 {
          width: 180px;
          height: 180px;
          background: linear-gradient(45deg, #48dbfb, #0abde3);
          bottom: 25%;
          right: 15%;
        }
        
        .shape-3 {
          width: 120px;
          height: 120px;
          background: linear-gradient(45deg, #1dd1a1, #10ac84);
          top: 60%;
          left: 5%;
        }
        
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          animation: slideUp 0.6s ease-out;
          position: relative;
          z-index: 10;
          transition: all 0.3s ease;
        }
        
        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .gradient-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        
        .gradient-icon:hover {
          transform: scale(1.1) rotate(-5deg);
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
          transition: all 0.3s ease;
        }
        
        .custom-input {
          padding-left: 50px !important;
          border: 2px solid #e8ecf4;
          border-radius: 16px;
          transition: all 0.3s ease;
          height: 56px;
          font-size: 16px;
        }
        
        .custom-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.3rem rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }
        
        .custom-input.is-invalid {
          border-color: #ff4757;
          box-shadow: 0 0 0 0.3rem rgba(255, 71, 87, 0.15);
        }
        
        .custom-input.is-valid {
          border-color: #2ed573;
          box-shadow: 0 0 0 0.3rem rgba(46, 213, 115, 0.15);
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
          transition: all 0.3s ease;
          padding: 8px;
          border-radius: 8px;
        }
        
        .password-toggle:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }
        
        .btn-login {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          padding: 16px;
          font-weight: 600;
          font-size: 1.1rem;
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          height: 56px;
          position: relative;
          overflow: hidden;
        }
        
        .btn-login::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .btn-login:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 20px 45px rgba(102, 126, 234, 0.5);
        }
        
        .btn-login:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .btn-login:active {
          transform: translateY(-1px);
        }
        
        .btn-login:disabled {
          opacity: 0.7;
          transform: none;
        }
        
        .btn-demo {
          background: linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%);
          border: none;
          border-radius: 16px;
          padding: 12px;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(255, 159, 243, 0.4);
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }
        
        .btn-demo:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(255, 159, 243, 0.5);
        }
        
        .form-check-input:checked {
          background-color: #667eea;
          border-color: #667eea;
        }
        
        .form-check-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .link-primary {
          color: #667eea !important;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .link-primary::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #667eea;
          transition: width 0.3s ease;
        }
        
        .link-primary:hover {
          color: #764ba2 !important;
          text-decoration: none;
        }
        
        .link-primary:hover::after {
          width: 100%;
        }
        
        .error-message {
          color: #ff4757;
          font-size: 0.875rem;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .success-message {
          color: #2ed573;
          font-size: 0.875rem;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: #718096;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .divider::before {
          margin-right: 10px;
        }
        
        .divider::after {
          margin-left: 10px;
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
          .login-card {
            margin: 10px;
            padding: 24px !important;
          }
          
          .login-container {
            padding: 10px;
          }
          
          .shape {
            display: none;
          }
        }
        
        @media (max-width: 576px) {
          .login-card {
            border-radius: 20px;
          }
          
          .custom-input {
            height: 52px;
            font-size: 16px;
          }
          
          .btn-login, .btn-demo {
            height: 52px;
          }
          
          .d-flex.justify-content-between {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
        
        /* Loading animation */
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .loading {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="login-container">
        {/* Background shapes */}
        <div className="background-shapes">
          <div className="shape shape-1 floating-shape"></div>
          <div className="shape shape-2 floating-shape" style={{animationDelay: '2s'}}></div>
          <div className="shape shape-3 floating-shape" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4">
              <div className="login-card p-4 p-md-5">
              <div className="text-center mb-4">
                  <div className="gradient-icon rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '80px', height: '80px'}}>
                    <span className="text-white fs-1">💰</span>
                </div>
                  <h2 className="fw-bold mb-2" style={{color: '#2d3748'}}>Welcome Back</h2>
                  <p className="text-muted mb-0">Sign in to manage your expenses</p>
              </div>

                <button 
                  type="button"
                  className="btn btn-demo text-white w-100 fw-semibold"
                  onClick={handleDemoLogin}
                >
                  🚀 Try Demo Account
                </button>

                <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-semibold" style={{color: '#2d3748'}}>
                      Username
                    </label>
                    <div className="input-with-icon">
                      <span className="input-icon">👤</span>
                    <input 
                      type="text" 
                        className={getInputClassName('username')}
                      id="username"
                      name="username" 
                      placeholder="Enter your username" 
                      value={formData.username}
                      onChange={handleChange} 
                        onBlur={handleBlur}
                      required 
                    />
                  </div>
                    {errors.username && touched.username && (
                      <div className="error-message">
                        <span>⚠️</span> {errors.username}
                      </div>
                    )}
                    {!errors.username && touched.username && formData.username && (
                      <div className="success-message">
                        <span>✓</span> Username looks good!
                      </div>
                    )}
                </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold" style={{color: '#2d3748'}}>
                      Password
                    </label>
                    <div className="input-with-icon position-relative">
                      <span className="input-icon">🔒</span>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className={getInputClassName('password')}
                      id="password"
                      name="password" 
                      placeholder="Enter your password" 
                      value={formData.password} 
                      onChange={handleChange} 
                        onBlur={handleBlur}
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
                    {errors.password && touched.password && (
                      <div className="error-message">
                        <span>⚠️</span> {errors.password}
                      </div>
                    )}
                    {!errors.password && touched.password && formData.password && (
                      <div className="success-message">
                        <span>✓</span> Password entered
                  </div>
                    )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="rememberMe" 
                        checked={rememberMe}
                        onChange={handleRememberMe}
                      />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                    <a href="#" className="link-primary text-decoration-none">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                    className="btn btn-login text-white w-100 fw-semibold mb-3"
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

                  <div className="text-center">
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
