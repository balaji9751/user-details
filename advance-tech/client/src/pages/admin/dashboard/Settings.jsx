import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../components/ToastContext';

export default function Settings() {
  const { showToast } = useToast();

  // Profile Form States
  const [profile, setProfile] = useState({ fullname: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Activity Logs States
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    // Read current profile details
    const saved = localStorage.getItem('adminProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile({ fullname: parsed.fullname || '', email: parsed.email || '' });
    }

    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const r = await api.get('/admin/logs');
      if (r.data.success) {
        setLogs(r.data.logs);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading admin activity logs.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.fullname.trim() || !profile.email.trim()) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/admin/update-profile', profile);
      if (response.data.success) {
        showToast('Profile details updated successfully!', 'success');
        
        // Update local session storage
        const saved = JSON.parse(localStorage.getItem('adminProfile') || '{}');
        saved.fullname = profile.fullname;
        saved.email = profile.email;
        localStorage.setItem('adminProfile', JSON.stringify(saved));
        
        fetchActivityLogs();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update admin profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please fill out password fields.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.put('/admin/change-password', { oldPassword, newPassword });
      if (response.data.success) {
        showToast('Password changed successfully!', 'success');
        setOldPassword('');
        setNewPassword('');
        fetchActivityLogs();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        showToast(err.response.data.message, 'error');
      } else {
        showToast('Password change failed.', 'error');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Account Settings</h2>
        <p className="text-muted">Manage profile details, reset password, and review security audits.</p>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
              <i className="bi bi-person-circle me-2" style={{ color: 'var(--cyan-primary)' }}></i> Update Profile
            </h4>
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-4">
                <label className="form-label text-muted">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={profile.fullname}
                  onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-cyan px-4" disabled={profileLoading}>
                {profileLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
              <i className="bi bi-shield-lock-fill me-2" style={{ color: 'var(--cyan-primary)' }}></i> Change Password
            </h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="form-label text-muted">Current Password</label>
                <input
                  type="password"
                  className="form-control form-control-custom"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted">New Password</label>
                <input
                  type="password"
                  className="form-control form-control-custom"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-cyan px-4" disabled={passwordLoading}>
                {passwordLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Activity Logs Card */}
        <div className="col-12 mt-2">
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
                <i className="bi bi-list-check me-2" style={{ color: 'var(--cyan-primary)' }}></i> Admin Activity Audit Logs
              </h4>
              <button className="btn btn-outline-secondary border-0 btn-sm text-cyan-primary" onClick={fetchActivityLogs} style={{ color: 'var(--cyan-primary)' }}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh Logs
              </button>
            </div>

            {logsLoading ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-cyan-primary" role="status" style={{ color: 'var(--cyan-primary)' }}>
                  <span className="visually-hidden">Loading logs...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive-custom">
                <table className="table table-custom align-middle">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Activity Details</th>
                      <th>IP Address</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-3 text-muted">No audit logs found.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className={`badge ${
                              log.action === 'LOGIN' ? 'bg-success bg-opacity-10 text-success' :
                              log.action.includes('DELETE') ? 'bg-danger bg-opacity-10 text-danger' :
                              log.action.includes('DOWNLOAD') ? 'bg-info bg-opacity-10 text-info' :
                              'bg-warning bg-opacity-10 text-warning'
                            } px-2.5 py-1.5`} style={{ fontSize: '0.75rem' }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-color)' }}>{log.details}</td>
                          <td className="text-muted">{log.ip_address || '-'}</td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
