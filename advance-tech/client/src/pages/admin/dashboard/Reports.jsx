import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../components/ToastContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/dashboard/stats');
      if (response.data.success) {
        setData(response.data.stats);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading charts metadata.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-cyan-primary" role="status" style={{ color: '#06b6d4' }}>
          <span className="visually-hidden">Loading reports...</span>
        </div>
      </div>
    );
  }

  // 1. Gender Data
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [data.maleCount, data.femaleCount],
      backgroundColor: ['rgba(6, 182, 212, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['#06b6d4', '#ef4444'],
      borderWidth: 1
    }]
  };

  // 2. Department Data
  const deptLabels = data.departmentBreakdown.map(d => d.department || 'Unknown');
  const deptCounts = data.departmentBreakdown.map(d => d.count);
  const departmentChartData = {
    labels: deptLabels,
    datasets: [{
      label: 'Users Count',
      data: deptCounts,
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: '#3b82f6',
      borderWidth: 1
    }]
  };

  // 3. State Data
  const stateLabels = data.reports.states.map(s => s.state);
  const stateCounts = data.reports.states.map(s => s.count);
  const stateChartData = {
    labels: stateLabels,
    datasets: [{
      label: 'State Wise registrations',
      data: stateCounts,
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: '#10b981',
      borderWidth: 1
    }]
  };

  // 4. Country Data
  const countryLabels = data.reports.countries.map(c => c.country);
  const countryCounts = data.reports.countries.map(c => c.count);
  const countryChartData = {
    labels: countryLabels,
    datasets: [{
      label: 'Country Count',
      data: countryCounts,
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: '#f59e0b',
      borderWidth: 1
    }]
  };

  // 5. Monthly Registration Timeline Data
  const monthlyLabels = data.reports.monthly.map(m => m.month);
  const monthlyCounts = data.reports.monthly.map(m => m.count);
  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Registrations',
      data: monthlyCounts,
      fill: true,
      backgroundColor: 'rgba(6, 182, 212, 0.15)',
      borderColor: '#06b6d4',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8' }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Analytics & Reports</h2>
        <p className="text-muted">Graphical analysis of user registrations and demographic breakdowns.</p>
      </div>

      <div className="row g-4">
        {/* Timeline Chart */}
        <div className="col-12 mb-4">
          <div className="glass-card p-4">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Monthly Registration Timeline</h4>
            <div style={{ height: '300px' }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Gender Breakdown (Pie) */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4 h-100">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Gender Distribution</h4>
            <div className="d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
              <Pie
                data={genderChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: '#94a3b8' } } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Department Distribution (Bar) */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4 h-100">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Department Distribution</h4>
            <div style={{ height: '260px' }}>
              <Bar data={departmentChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* State distribution (Bar) */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4 h-100">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Registrations by State</h4>
            <div style={{ height: '260px' }}>
              <Bar data={stateChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Country distribution (Doughnut) */}
        <div className="col-12 col-md-6 mb-4">
          <div className="glass-card p-4 h-100">
            <h4 className="mb-4" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Country Breakdown</h4>
            <div className="d-flex align-items-center justify-content-center" style={{ height: '260px' }}>
              <Doughnut
                data={countryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: '#94a3b8' } } }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
