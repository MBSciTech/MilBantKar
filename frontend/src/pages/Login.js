import React, { useState } from 'react';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
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
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <div
                  className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                  style={{width: '60px', height: '60px'}}
                >
                  <span className="text-white fs-4">💰</span>
                </div>
                <h2 className="card-title text-dark mb-1">Welcome Back</h2>
                <p className="text-muted">Sign in to manage your expenses</p>
              </div>

              <form onSubmit={handleSubmit}>
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
                      placeholder="Enter your username" 
                      value={formData.username}
                      onChange={handleChange} 
                      required 
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
                      placeholder="Enter your password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="rememberMe" />
                    <label className="form-check-label text-muted" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a href="" className="text-decoration-none text-primary">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-medium"
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
                  <a href="/signup" className="text-decoration-none text-primary fw-medium">Sign up</a>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
