import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';

export default function Login() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if redirect contains warning message
    if (searchParams.get('expired')) {
      showToast('Your admin session has expired. Please login again.', 'error');
    }
    
    // Check if remember me exists
    const savedUser = localStorage.getItem('rememberedAdmin');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/login', { username, password });
      if (response.data.success) {
        showToast('Login Successful!', 'success');
        
        // Save token and profile details
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminProfile', JSON.stringify(response.data.admin));

        if (rememberMe) {
          localStorage.setItem('rememberedAdmin', username);
        } else {
          localStorage.removeItem('rememberedAdmin');
        }

        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        showToast(err.response.data.message, 'error');
      } else {
        showToast('Invalid credentials or connection issue.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Please contact the head of system administration at IT support to reset admin credentials.');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background cyan glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(2,132,199,0.05) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }}></div>

      <div className="w-100 px-3" style={{ maxWidth: '420px', zIndex: 10 }}>
        {/* Brand */}
        <div className="text-center mb-4">
          <a className="d-inline-flex align-items-center fw-bold text-decoration-none fs-2 mb-2" href="/" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
            <span className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--cyan-primary)' }}>
              <i className="bi bi-cpu text-white" style={{ fontSize: '1.5rem' }}></i>
            </span>
            ADVANCE <span className="ms-1" style={{ color: 'var(--cyan-primary)' }}>TECH</span>
          </a>
          <h4 className="text-muted opacity-75 fs-6">Admin Portal</h4>
        </div>

        {/* Login Card */}
        <div className="glass-card p-4 p-md-5">
          <h3 className="text-center mb-4 fw-bold" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Sign In</h3>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="floating-label-group mb-4">
              <input
                type="text"
                className="form-control form-control-custom"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label>Username</label>
            </div>

            {/* Password */}
            <div className="floating-label-group mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-custom"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
              <button
                type="button"
                className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-secondary opacity-50 px-3"
                onClick={() => setShowPassword(!showPassword)}
                style={{ zIndex: 20 }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
            </div>

            {/* Remember & Forgot options */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    backgroundColor: rememberMe ? 'var(--cyan-primary)' : 'transparent',
                    borderColor: 'var(--border-color)'
                  }}
                />
                <label className="form-check-label text-muted fs-7 select-none" htmlFor="rememberMe" style={{ fontSize: '0.85rem' }}>
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-cyan-primary text-decoration-none fw-medium"
                style={{ color: 'var(--cyan-primary)', fontSize: '0.85rem' }}
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-cyan w-100 py-3" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-box-arrow-in-right me-2"></i>
              )}
              Access Dashboard
            </button>
          </form>
        </div>

        {/* Back to Home link */}
        <div className="text-center mt-4">
          <a href="/" className="text-muted text-decoration-none fs-7">
            <i className="bi bi-arrow-left me-1"></i> Back to Registration Form
          </a>
        </div>
      </div>
    </div>
  );
}
