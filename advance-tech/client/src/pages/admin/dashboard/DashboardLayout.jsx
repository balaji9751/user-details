import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/ToastContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [theme, setTheme] = useState(() => {
    const hasInitialized = localStorage.getItem('theme_initialized_v2');
    if (!hasInitialized) {
      localStorage.setItem('theme_initialized_v2', 'true');
      localStorage.setItem('theme', 'light');
      return 'light';
    }
    return localStorage.getItem('theme') || 'light';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  
  // Admin Info
  const [adminProfile, setAdminProfile] = useState({
    username: 'admin',
    fullname: 'Administrator',
    email: 'admin@advancetech.com'
  });

  // Simulated notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New user registered via portal', time: '5m ago', icon: 'bi-person-plus-fill', read: false },
    { id: 2, text: 'System backup completed successfully', time: '1h ago', icon: 'bi-hdd-fill', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const savedProfile = localStorage.getItem('adminProfile');
    if (savedProfile) {
      setAdminProfile(JSON.parse(savedProfile));
    }

    // Set Theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Date/Time Clock
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [theme, navigate]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminProfile');
    showToast('Logged out successfully.', 'info');
    navigate('/admin/login');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'bi-grid-1x2-fill' },
    { name: 'Users', path: '/admin/dashboard/users', icon: 'bi-people-fill' },
    { name: 'Reports', path: '/admin/dashboard/reports', icon: 'bi-bar-chart-fill' },
    { name: 'Downloads', path: '/admin/dashboard/downloads', icon: 'bi-cloud-arrow-down-fill' },
    { name: 'Settings', path: '/admin/dashboard/settings', icon: 'bi-gear-fill' },
    { name: 'Tally Sync', path: '/admin/dashboard/tally', icon: 'bi-arrow-repeat' }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar Panel */}
      <aside className={`sidebar-panel ${sidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <Link className="d-flex align-items-center fw-bold text-decoration-none" to="/admin/dashboard" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
            <span className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--cyan-primary)' }}>
              <i className="bi bi-cpu text-white" style={{ fontSize: '1.1rem' }}></i>
            </span>
            ADVANCE <span style={{ color: 'var(--cyan-primary)', marginLeft: '4px' }}>TECH</span>
          </Link>
          <button className={`btn btn-close sidebar-toggle-btn ${theme === 'dark' ? 'btn-close-white' : ''}`} onClick={() => setSidebarOpen(false)} aria-label="Close"></button>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={idx} className="sidebar-item">
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-top border-secondary border-opacity-10 mt-auto">
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center py-2" style={{ borderRadius: '8px' }}>
            <i className="bi bi-box-arrow-right me-2"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary border-0 sidebar-toggle-btn me-2" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-3 text-secondary"></i>
            </button>
            
            {/* Clock */}
            <span className="text-muted d-none d-md-flex align-items-center fw-medium me-4" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-calendar3 me-2"></i>
              {dateTime.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle */}
            <button className="btn btn-outline-secondary border-0 p-2 rounded-circle" onClick={toggleTheme} title="Toggle theme">
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary'}`} style={{ fontSize: '1.25rem' }}></i>
            </button>

            {/* Notification Dropdown */}
            <div className="position-relative">
              <button className="btn btn-outline-secondary border-0 p-2 rounded-circle position-relative" onClick={() => setShowNotifications(!showNotifications)}>
                <i className="bi bi-bell-fill text-secondary" style={{ fontSize: '1.2rem' }}></i>
                {notifications.some(n => !n.read) && (
                  <span className="position-absolute top-1 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="glass-card position-absolute end-0 mt-2 p-2" style={{
                  width: '320px',
                  zIndex: 2000,
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary border-opacity-10">
                    <span className="fw-bold" style={{ color: 'var(--text-color)' }}>Notifications</span>
                    <button className="btn btn-link p-0 text-cyan-primary text-decoration-none fw-medium" onClick={markAllRead} style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)' }}>Mark all read</button>
                  </div>
                  <div className="py-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} className={`d-flex p-2 gap-2 align-items-start border-bottom border-secondary border-opacity-5 ${!n.read ? 'bg-light bg-opacity-10' : ''}`} style={{ fontSize: '0.85rem' }}>
                        <i className={`bi ${n.icon}`} style={{ fontSize: '1.1rem', color: 'var(--cyan-primary)' }}></i>
                        <div className="flex-grow-1">
                          <p className="mb-0 text-wrap" style={{ color: 'var(--text-color)' }}>{n.text}</p>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="dropdown">
              <button className="btn d-flex align-items-center border-0 p-1" data-bs-toggle="dropdown" aria-expanded="false">
                <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '38px', height: '38px', backgroundColor: 'var(--cyan-primary)', fontWeight: 600 }}>
                  {adminProfile.fullname.substring(0, 1).toUpperCase()}
                </div>
                <div className="text-start d-none d-md-block">
                  <p className="mb-0 fw-bold" style={{ fontSize: '0.9rem', lineHeight: 1.1, color: 'var(--text-color)' }}>{adminProfile.fullname}</p>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Admin</span>
                </div>
              </button>
              <ul className={`dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 p-2 ${theme === 'dark' ? 'bg-dark-subtle' : 'bg-white border'}`} style={{ borderRadius: '12px', minWidth: '180px' }}>
                <li className="p-2 border-bottom border-secondary border-opacity-10 mb-1">
                  <p className="mb-0 fw-bold text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>{adminProfile.fullname}</p>
                  <span className="text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>{adminProfile.email}</span>
                </li>
                <li>
                  <Link className="dropdown-item rounded-3 py-2" to="/admin/dashboard/settings" style={{ color: 'var(--text-color)' }}>
                    <i className="bi bi-person-fill me-2 text-muted"></i> Edit Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item rounded-3 py-2" to="/admin/dashboard/settings" style={{ color: 'var(--text-color)' }}>
                    <i className="bi bi-shield-lock-fill me-2 text-muted"></i> Change Password
                  </Link>
                </li>
                <li><hr className="dropdown-divider border-secondary border-opacity-10" /></li>
                <li>
                  <button onClick={handleLogout} className="dropdown-item rounded-3 py-2 text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Content Body Grid */}
        <section className="content-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
