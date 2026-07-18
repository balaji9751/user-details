import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../components/ToastContext';

export default function UsersList() {
  const { showToast } = useToast();

  // Core Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });

  // Query Params States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modals States
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const departments = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Product Management'];

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Users
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: {
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          sortField,
          sortOrder,
          gender,
          department,
          state,
          country,
          startDate,
          endDate
        }
      });
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading user database records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortField, sortOrder, gender, department, state, country, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchUsers(1);
    setSelectedIds([]); // Reset select items when query resets
  }, [fetchUsers]);

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  // Checkbox selects
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Delete Action
  const handleDelete = async () => {
    try {
      const response = await api.delete(`/users/${deleteId}`);
      if (response.data.success) {
        showToast('User deleted successfully.', 'success');
        setDeleteId(null);
        fetchUsers(pagination.currentPage);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user.', 'error');
    }
  };

  // Edit Action Validate & Save
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    // Validate inputs
    const errors = {};
    if (!editUser.fullname.trim()) errors.fullname = 'Name is required';
    if (!editUser.email.trim()) errors.email = 'Email is required';
    if (!/^\d{10}$/.test(editUser.phone)) errors.phone = 'Phone must be 10 digits';
    if (!editUser.gender) errors.gender = 'Gender is required';
    if (!editUser.dob) errors.dob = 'DOB is required';
    if (!editUser.state.trim()) errors.state = 'State is required';
    if (!editUser.country.trim()) errors.country = 'Country is required';
    if (!editUser.address.trim()) errors.address = 'Address is required';
    if (!/^\d+$/.test(editUser.pincode)) errors.pincode = 'Pincode must be numeric';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      const response = await api.put(`/users/${editUser.id}`, editUser);
      if (response.data.success) {
        showToast('User details updated successfully!', 'success');
        setEditUser(null);
        setEditErrors({});
        fetchUsers(pagination.currentPage);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const backendErr = {};
        err.response.data.errors.forEach(e => {
          backendErr[e.field] = e.message;
        });
        setEditErrors(backendErr);
      } else {
        showToast('Error updating user record.', 'error');
      }
    }
  };

  // Bulk Export triggers
  const handleBulkDownload = (format) => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one user to download.', 'error');
      return;
    }
    const idsString = selectedIds.join(',');
    window.open(`/api/download/${format}?ids=${idsString}&token=${localStorage.getItem('adminToken')}`, '_blank');
  };

  return (
    <div>
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Users Database</h2>
          <p className="text-muted">Perform secure CRUD operations, search records, or bulk export files.</p>
        </div>
        
        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-cyan-primary me-2 fw-semibold" style={{ color: 'var(--cyan-primary)' }}>
              {selectedIds.length} Selected
            </span>
            <div className="dropdown">
              <button className="btn btn-cyan btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="bi bi-box-arrow-up-right me-1"></i> Export Selected
              </button>
              <ul className="dropdown-menu dropdown-menu-end border-0 shadow bg-light-subtle">
                <li><button className="dropdown-item" onClick={() => handleBulkDownload('pdf')}>Export PDF</button></li>
                <li><button className="dropdown-item" onClick={() => handleBulkDownload('excel')}>Export Excel (.xlsx)</button></li>
                <li><button className="dropdown-item" onClick={() => handleBulkDownload('docx')}>Export Word (.docx)</button></li>
                <li><button className="dropdown-item" onClick={() => handleBulkDownload('csv')}>Export CSV</button></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Filters Area */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3">
          {/* Search Box */}
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-secondary border-opacity-10 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-custom py-2"
                placeholder="Search by Name, Email, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Department Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-control-custom"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-control-custom"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="col-6 col-md-2">
            <input
              type="date"
              className="form-control form-control-custom"
              value={startDate}
              title="Start Date filter"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="col-6 col-md-2">
            <input
              type="date"
              className="form-control form-control-custom"
              value={endDate}
              title="End Date filter"
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-cyan-primary" role="status" style={{ color: 'var(--cyan-primary)' }}>
              <span className="visually-hidden">Loading database...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive-custom mb-3">
              <table className="table table-custom align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        onChange={handleSelectAll}
                        checked={users.length > 0 && selectedIds.length === users.length}
                        aria-label="Select all users"
                      />
                    </th>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                      ID {sortField === 'id' && (sortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('fullname')} style={{ cursor: 'pointer' }}>
                      Full Name {sortField === 'fullname' && (sortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                      Email {sortField === 'email' && (sortOrder === 'ASC' ? '▲' : '▼')}
                    </th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">No records match your filters.</td>
                    </tr>
                  ) : (
                    users.map((u, idx) => (
                      <tr key={u.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => handleSelectOne(u.id)}
                            aria-label={`Select user ${u.fullname}`}
                          />
                        </td>
                        <td>{(pagination.currentPage - 1) * pagination.limit + idx + 1}</td>
                        <td className="fw-semibold" style={{ color: 'var(--text-color)' }}>{u.fullname}</td>
                        <td className="text-muted">{u.email}</td>
                        <td className="text-muted">{u.phone}</td>
                        <td className="text-muted">{u.gender}</td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>
                            {u.department || 'N/A'}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>{u.state}, {u.country}</td>
                        <td>
                          <div className="d-flex gap-1.5">
                            {/* View button */}
                            <button
                              className="btn btn-outline-info border-0 btn-sm me-1"
                              onClick={async () => {
                                try {
                                  const r = await api.get(`/users/${u.id}`);
                                  setViewUser(r.data.user);
                                } catch {
                                  showToast('Failed to load user details', 'error');
                                }
                              }}
                              title="View profile"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {/* Edit button */}
                            <button
                              className="btn btn-outline-warning border-0 btn-sm me-1"
                              onClick={() => {
                                setEditUser({ ...u, dob: u.dob.substring(0, 10) });
                                setEditErrors({});
                              }}
                              title="Edit user"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {/* Delete button */}
                            <button
                              className="btn btn-outline-danger border-0 btn-sm"
                              onClick={() => setDeleteId(u.id)}
                              title="Delete user"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Showing {users.length} of {pagination.totalItems} entries
                </span>
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0 gap-1">
                    <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link border-secondary border-opacity-10" onClick={() => fetchUsers(pagination.currentPage - 1)} style={{ background: 'var(--sidebar-bg)', color: 'var(--text-color)' }}>
                        Previous
                      </button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link border-secondary border-opacity-10"
                          style={{
                            backgroundColor: pagination.currentPage === i + 1 ? 'var(--cyan-primary)' : 'var(--sidebar-bg)',
                            color: pagination.currentPage === i + 1 ? '#ffffff' : 'var(--text-color)',
                            borderColor: 'var(--border-color)'
                          }}
                          onClick={() => fetchUsers(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                      <button className="page-link border-secondary border-opacity-10" onClick={() => fetchUsers(pagination.currentPage + 1)} style={{ background: 'var(--sidebar-bg)', color: 'var(--text-color)' }}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* VIEW MODAL (Detailed user profile in premium layout) */}
      {viewUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content modal-content-custom glass-card p-4">
              <div className="modal-header border-0 pb-0">
                <h3 className="modal-title fw-bold" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Profile Details</h3>
                <button type="button" className="btn-close" onClick={() => setViewUser(null)} aria-label="Close" style={{ filter: 'var(--text-color) === "#ffffff" ? "invert(1)" : "none"' }}></button>
              </div>
              <div className="modal-body mt-3">
                <div className="row g-4">
                  {/* Left Column Profile Intro card */}
                  <div className="col-md-4 text-center border-end border-secondary border-opacity-10">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px', backgroundColor: 'var(--cyan-primary)', fontSize: '2.5rem', fontWeight: 600 }}>
                      {viewUser.fullname.substring(0,1).toUpperCase()}
                    </div>
                    <h4 className="mb-1" style={{ color: 'var(--text-color)' }}>{viewUser.fullname}</h4>
                    <span className="badge bg-secondary bg-opacity-10 text-cyan-primary px-3 py-1.5" style={{ color: 'var(--cyan-primary)' }}>
                      {viewUser.department || 'N/A'}
                    </span>
                    <hr className="my-4 border-secondary border-opacity-10" />
                    <div className="text-start fs-8 text-muted px-2">
                      <p className="mb-1"><i className="bi bi-hash me-2" style={{ color: 'var(--cyan-primary)' }}></i> ID: {viewUser.id}</p>
                      <p className="mb-1"><i className="bi bi-clock me-2" style={{ color: 'var(--cyan-primary)' }}></i> Joined: {new Date(viewUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Right Column details */}
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Email Address</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.email}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Phone Number</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.phone}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Gender</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.gender}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Date of Birth</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{new Date(viewUser.dob).toLocaleDateString()}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>State / Region</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.state}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Country</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.country}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Pincode</span>
                        <span className="fw-medium" style={{ color: 'var(--text-color)' }}>{viewUser.pincode}</span>
                      </div>
                      <div className="col-12 mt-3">
                        <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Full Address</span>
                        <p className="border border-light-subtle rounded-3 p-3 bg-light-subtle mb-0" style={{ color: 'var(--text-color)' }}>
                          {viewUser.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 mt-4">
                <a
                  href={`/api/download/pdf?id=${viewUser.id}&token=${localStorage.getItem('adminToken')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-info rounded-pill px-4 me-auto"
                >
                  <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF Report
                </a>
                <button type="button" className="btn btn-cyan rounded-pill px-4" onClick={() => setViewUser(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content modal-content-custom glass-card p-4">
              <div className="modal-header border-0 pb-0">
                <h3 className="modal-title fw-bold" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Edit User Details</h3>
                <button type="button" className="btn-close" onClick={() => setEditUser(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleEditSave} noValidate>
                <div className="modal-body mt-3">
                  <div className="row">
                    {/* Name */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Full Name</label>
                      <input
                        type="text"
                        name="fullname"
                        className={`form-control form-control-custom ${editErrors.fullname ? 'is-invalid' : ''}`}
                        value={editUser.fullname}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.fullname && <div className="invalid-feedback">{editErrors.fullname}</div>}
                    </div>

                    {/* Email */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control form-control-custom ${editErrors.email ? 'is-invalid' : ''}`}
                        value={editUser.email}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.email && <div className="invalid-feedback">{editErrors.email}</div>}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        maxLength="10"
                        className={`form-control form-control-custom ${editErrors.phone ? 'is-invalid' : ''}`}
                        value={editUser.phone}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.phone && <div className="invalid-feedback">{editErrors.phone}</div>}
                    </div>

                    {/* Gender */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Gender</label>
                      <select
                        name="gender"
                        className={`form-select form-control-custom ${editErrors.gender ? 'is-invalid' : ''}`}
                        value={editUser.gender}
                        onChange={handleEditChange}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {editErrors.gender && <div className="invalid-feedback">{editErrors.gender}</div>}
                    </div>

                    {/* DOB */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className={`form-control form-control-custom ${editErrors.dob ? 'is-invalid' : ''}`}
                        value={editUser.dob}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.dob && <div className="invalid-feedback">{editErrors.dob}</div>}
                    </div>

                    {/* Department */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Department</label>
                      <select
                        name="department"
                        className={`form-select form-control-custom ${editErrors.department ? 'is-invalid' : ''}`}
                        value={editUser.department}
                        onChange={handleEditChange}
                        required
                      >
                        {departments.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* State */}
                    <div className="col-md-4 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>State</label>
                      <input
                        type="text"
                        name="state"
                        className={`form-control form-control-custom ${editErrors.state ? 'is-invalid' : ''}`}
                        value={editUser.state}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.state && <div className="invalid-feedback">{editErrors.state}</div>}
                    </div>

                    {/* Country */}
                    <div className="col-md-4 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Country</label>
                      <input
                        type="text"
                        name="country"
                        className={`form-control form-control-custom ${editErrors.country ? 'is-invalid' : ''}`}
                        value={editUser.country}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.country && <div className="invalid-feedback">{editErrors.country}</div>}
                    </div>

                    {/* Pincode */}
                    <div className="col-md-4 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        className={`form-control form-control-custom ${editErrors.pincode ? 'is-invalid' : ''}`}
                        value={editUser.pincode}
                        onChange={handleEditChange}
                        required
                      />
                      {editErrors.pincode && <div className="invalid-feedback">{editErrors.pincode}</div>}
                    </div>

                    {/* Address */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Address</label>
                      <textarea
                        name="address"
                        rows="2"
                        className={`form-control form-control-custom ${editErrors.address ? 'is-invalid' : ''}`}
                        value={editUser.address}
                        onChange={handleEditChange}
                        required
                      ></textarea>
                      {editErrors.address && <div className="invalid-feedback">{editErrors.address}</div>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 mt-4">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setEditUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-cyan px-4 py-2">Save Details</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content modal-content-custom glass-card p-4 text-center">
              <i className="bi bi-exclamation-triangle-fill text-warning mb-3" style={{ fontSize: '3rem' }}></i>
              <h4 className="mb-2 fw-bold" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>Are you sure?</h4>
              <p className="text-muted mb-4">This action cannot be undone. Do you want to delete this user record?</p>
              <div className="d-flex gap-3 justify-content-center">
                <button className="btn btn-outline-secondary px-4 w-50" onClick={() => setDeleteId(null)}>No</button>
                <button className="btn btn-danger px-4 w-50" onClick={handleDelete}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
