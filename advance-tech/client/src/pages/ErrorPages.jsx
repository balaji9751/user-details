import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-center" style={{
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
      padding: '2rem'
    }}>
      <div className="glass-card p-5 max-w-500 mx-auto border-secondary border-opacity-10" style={{ maxWidth: '480px' }}>
        <h1 className="display-1 text-cyan-primary fw-extrabold mb-3" style={{ color: '#06b6d4', fontFamily: 'Outfit' }}>404</h1>
        <h3 className="text-white mb-2" style={{ fontFamily: 'Outfit' }}>Page Not Found</h3>
        <p className="text-muted mb-4">The URL page you are looking for does not exist, or has been moved to another location.</p>
        <button onClick={() => navigate('/')} className="btn btn-cyan px-4 py-2.5 rounded-pill">
          <i className="bi bi-house-door-fill me-2"></i> Go to Homepage
        </button>
      </div>
    </div>
  );
}

export function ServerError() {
  const navigate = useNavigate();
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-center" style={{
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
      padding: '2rem'
    }}>
      <div className="glass-card p-5 max-w-500 mx-auto border-secondary border-opacity-10" style={{ maxWidth: '480px' }}>
        <h1 className="display-1 text-danger fw-extrabold mb-3" style={{ fontFamily: 'Outfit' }}>500</h1>
        <h3 className="text-white mb-2" style={{ fontFamily: 'Outfit' }}>Internal Server Error</h3>
        <p className="text-muted mb-4">Something went wrong on our servers. We are investigating the issue, please try again later.</p>
        <div className="d-flex gap-3 justify-content-center">
          <button onClick={() => window.location.reload()} className="btn btn-outline-light px-4 py-2.5 rounded-pill">
            <i className="bi bi-arrow-clockwise me-1"></i> Reload Page
          </button>
          <button onClick={() => navigate('/')} className="btn btn-cyan px-4 py-2.5 rounded-pill">
            <i className="bi bi-house-door-fill me-1"></i> Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
