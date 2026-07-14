import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../components/ToastContext';

export default function Overview() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayRegistrations: 0,
    maleCount: 0,
    femaleCount: 0,
    departmentCount: 0,
    latestRegistrations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: 'bi-people', color: 'bg-primary-subtle text-primary', border: 'border-primary' },
    { title: "Today's Signups", value: stats.todayRegistrations, icon: 'bi-calendar-check', color: 'bg-success-subtle text-success', border: 'border-success' },
    { title: 'Male Registered', value: stats.maleCount, icon: 'bi-gender-male', color: 'bg-info-subtle text-info', border: 'border-info' },
    { title: 'Female Registered', value: stats.femaleCount, icon: 'bi-gender-female', color: 'bg-danger-subtle text-danger', border: 'border-danger' },
    { title: 'Departments', value: stats.departmentCount, icon: 'bi-building', color: 'bg-warning-subtle text-warning', border: 'border-warning' }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-cyan-primary" role="status" style={{ color: '#06b6d4', width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Dashboard Overview</h2>
        <p className="text-muted">Real-time registration statistics and platform performance metrics.</p>
      </div>

      {/* Cards List */}
      <div className="row g-4 mb-5">
        {statCards.map((card, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-4 col-xl-2.4" style={{ flex: '1 0 18%' }}>
            <div className={`glass-card stat-card border-start border-4 ${card.border}`} style={{ minHeight: '110px' }}>
              <div>
                <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.85rem' }}>{card.title}</span>
                <h3 className="mb-0 fw-bold" style={{ fontSize: '1.75rem', color: 'var(--text-color)' }}>{card.value}</h3>
              </div>
              <div className={`stat-icon ${card.color}`}>
                <i className={`bi ${card.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Registrations Grid */}
      <div className="row">
        <div className="col-12 col-xl-8 mb-4">
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Latest Registrations</h4>
              <button onClick={fetchStats} className="btn btn-outline-secondary border-0 btn-sm text-cyan-primary" style={{ color: 'var(--cyan-primary)' }}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>

            <div className="table-responsive-custom">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th>Country</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No users registered yet.</td>
                    </tr>
                  ) : (
                    stats.latestRegistrations.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-semibold" style={{ color: 'var(--text-color)' }}>{u.fullname}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>
                            {u.department || 'N/A'}
                          </span>
                        </td>
                        <td className="text-muted">{u.country}</td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Activity & Shortcuts */}
        <div className="col-12 col-xl-4 mb-4">
          <div className="glass-card p-4 h-100">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Quick Links</h4>
            <div className="d-grid gap-3">
              <a href="/admin/dashboard/users" className="btn btn-light text-start p-3 d-flex align-items-center justify-content-between border border-light-subtle" style={{ borderRadius: '12px', background: 'var(--sidebar-bg)' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-people-fill me-3 fs-4" style={{ color: 'var(--cyan-primary)' }}></i>
                  <div>
                    <span className="fw-semibold d-block" style={{ color: 'var(--text-color)' }}>Manage Users</span>
                    <small className="text-muted">Edit, search, filter database records</small>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </a>

              <a href="/admin/dashboard/reports" className="btn btn-light text-start p-3 d-flex align-items-center justify-content-between border border-light-subtle" style={{ borderRadius: '12px', background: 'var(--sidebar-bg)' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-bar-chart-fill me-3 fs-4" style={{ color: 'var(--cyan-primary)' }}></i>
                  <div>
                    <span className="fw-semibold d-block" style={{ color: 'var(--text-color)' }}>View Charts</span>
                    <small className="text-muted">Analyze gender & department metrics</small>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </a>

              <a href="/admin/dashboard/downloads" className="btn btn-light text-start p-3 d-flex align-items-center justify-content-between border border-light-subtle" style={{ borderRadius: '12px', background: 'var(--sidebar-bg)' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-cloud-arrow-down-fill me-3 fs-4" style={{ color: 'var(--cyan-primary)' }}></i>
                  <div>
                    <span className="fw-semibold d-block" style={{ color: 'var(--text-color)' }}>Exports Area</span>
                    <small className="text-muted">Download PDF, Excel, Word & CSVs</small>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
