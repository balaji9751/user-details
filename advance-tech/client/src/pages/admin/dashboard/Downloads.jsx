import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../components/ToastContext';

export default function Downloads() {
  const { showToast } = useToast();
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/dashboard/stats');
      if (response.data.success) {
        setTotalUsersCount(response.data.stats.totalUsers);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading details for exports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format) => {
    if (totalUsersCount === 0) {
      showToast('No users records exist to download.', 'error');
      return;
    }
    // Launch download in new window/tab using token auth query param
    const token = localStorage.getItem('adminToken');
    window.open(`/api/download/${format}?token=${token}`, '_blank');
    showToast(`Generating ${format.toUpperCase()} export...`, 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-cyan-primary" role="status" style={{ color: '#06b6d4' }}>
          <span className="visually-hidden">Loading downloads data...</span>
        </div>
      </div>
    );
  }

  const formats = [
    { name: 'Adobe PDF Document', ext: 'pdf', icon: 'bi-file-earmark-pdf-fill', color: 'text-danger', desc: 'Secure vector page document with formal table grids.' },
    { name: 'Microsoft Excel Sheet', ext: 'excel', icon: 'bi-file-earmark-excel-fill', color: 'text-success', desc: 'Raw tabular spreadsheet with custom columns width.' },
    { name: 'Microsoft Word Document', ext: 'docx', icon: 'bi-file-earmark-word-fill', color: 'text-primary', desc: 'Editable office template formatting layout.' },
    { name: 'Comma Separated Values', ext: 'csv', icon: 'bi-file-earmark-spreadsheet-fill', color: 'text-info', desc: 'Plain-text database standard for programmatic ingestion.' }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Downloads Section</h2>
        <p className="text-muted">Export entire user directory records in standard formats or trigger a print layout.</p>
      </div>

      <div className="glass-card p-4 mb-4 text-center py-5" style={{
        background: 'rgba(2, 132, 199, 0.05)',
        border: '1px solid rgba(2, 132, 199, 0.15)'
      }}>
        <i className="bi bi-cloud-arrow-down-fill mb-3" style={{ fontSize: '3rem', color: 'var(--cyan-primary)' }}></i>
        <h3 className="mb-2" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Ready for Export</h3>
        <p className="text-muted max-w-500 mx-auto">There are currently <strong style={{ color: 'var(--text-color)' }}>{totalUsersCount}</strong> registered users in the database. Select your preferred export format below.</p>
      </div>

      <div className="row g-4">
        {formats.map((f, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-3">
            <div className="glass-card p-4 h-100 d-flex flex-column text-center justify-content-between">
              <div>
                <i className={`bi ${f.icon} ${f.color} mb-3 d-block`} style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mb-2" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>{f.name}</h5>
                <p className="text-muted fs-8" style={{ fontSize: '0.85rem' }}>{f.desc}</p>
              </div>
              <button
                className="btn btn-cyan w-100 mt-4 py-2"
                onClick={() => handleDownload(f.ext)}
              >
                <i className="bi bi-download me-1"></i> Download
              </button>
            </div>
          </div>
        ))}

        {/* Print Option */}
        <div className="col-12 mt-4">
          <div className="glass-card p-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-printer-fill text-secondary me-3 fs-3"></i>
              <div>
                <h5 className="mb-1" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Local Print / Save as PDF</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Format the current browser view into a clean document print layout.</p>
              </div>
            </div>
            <button className="btn btn-outline-secondary px-4 py-2.5" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Print Webpage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
