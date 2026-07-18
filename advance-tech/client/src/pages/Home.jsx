import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/ToastContext';

export default function Home() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    department: '',
    state: '',
    country: '',
    address: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Tally Integration States
  const [tallyLedgers, setTallyLedgers] = useState([]);
  const [showTallySelect, setShowTallySelect] = useState(false);
  const [fetchingTally, setFetchingTally] = useState(false);

  // Departments List
  const departments = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Product Management'];

  const fetchTallyLedgers = async () => {
    setFetchingTally(true);
    try {
      const response = await api.get('/tally/ledgers');
      if (response.data.success) {
        setTallyLedgers(response.data.ledgers);
        setShowTallySelect(true);
        showToast(`Successfully fetched ledgers from ${response.data.source}!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to TallyPrime gateway.', 'error');
    } finally {
      setFetchingTally(false);
    }
  };

  const handleSelectTallyLedger = (ledger) => {
    let mappedDept = 'Sales';
    if (departments.includes(ledger.under)) {
      mappedDept = ledger.under;
    } else if (ledger.under.toLowerCase().includes('debtor') || ledger.under.toLowerCase().includes('creditor')) {
      mappedDept = 'Finance';
    } else if (ledger.under.toLowerCase().includes('sale')) {
      mappedDept = 'Sales';
    } else if (ledger.under.toLowerCase().includes('admin') || ledger.under.toLowerCase().includes('office')) {
      mappedDept = 'Operations';
    }

    setFormData({
      fullname: ledger.name,
      email: ledger.email || `${ledger.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      phone: ledger.phone || '9876543210',
      gender: 'Male',
      dob: '1995-05-15',
      department: mappedDept,
      state: ledger.state || 'Maharashtra',
      country: ledger.country || 'India',
      address: ledger.address || 'Tally sync address placeholder',
      pincode: ledger.pincode || '400001'
    });

    setErrors({});
    setShowTallySelect(false);
    showToast(`Pre-filled form with ${ledger.name} details from TallyPrime!`, 'success');
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    
    switch (name) {
      case 'fullname':
        if (!value.trim()) errorMsg = 'Full Name is required';
        break;
      case 'email':
        if (!value.trim()) {
          errorMsg = 'Email Address is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errorMsg = 'Invalid email format';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errorMsg = 'Phone Number is required';
        } else if (!/^\d{10}$/.test(value)) {
          errorMsg = 'Phone Number must be exactly 10 digits';
        }
        break;
      case 'gender':
        if (!value) errorMsg = 'Gender is required';
        break;
      case 'dob':
        if (!value) {
          errorMsg = 'Date of Birth is required';
        } else {
          const dobDate = new Date(value);
          const today = new Date();
          if (dobDate >= today) {
            errorMsg = 'Date of Birth must be in the past';
          }
        }
        break;
      case 'department':
        if (!value) errorMsg = 'Department selection is required';
        break;
      case 'state':
        if (!value.trim()) errorMsg = 'State is required';
        break;
      case 'country':
        if (!value.trim()) errorMsg = 'Country is required';
        break;
      case 'address':
        if (!value.trim()) errorMsg = 'Address is required';
        break;
      case 'pincode':
        if (!value.trim()) {
          errorMsg = 'Pincode is required';
        } else if (!/^\d+$/.test(value)) {
          errorMsg = 'Pincode must contain only numeric characters';
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    const fieldError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields on submit
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please correct validation errors before submitting.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/register', formData);
      if (response.data.success) {
        setShowSuccessModal(true);
        // Clear Form fields
        setFormData({
          fullname: '',
          email: '',
          phone: '',
          gender: '',
          dob: '',
          department: '',
          state: '',
          country: '',
          address: '',
          pincode: ''
        });
        setErrors({});
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Validation errors from express-validator
        const backendErrors = {};
        err.response.data.errors.forEach(e => {
          backendErrors[e.field] = e.message;
        });
        setErrors(backendErrors);
        showToast('Registration failed. Correct validation rules.', 'error');
      } else if (err.response && err.response.data && err.response.data.message) {
        showToast(err.response.data.message, 'error');
      } else {
        showToast('Something went wrong. Please check connection.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background cyan glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(2,132,199,0.06) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-light-subtle py-3" style={{ zIndex: 10 }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center fw-bold" href="/" style={{ fontFamily: 'Inter', color: 'var(--text-color)' }}>
            <span className="p-2 rounded-3 me-2 d-inline-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--cyan-primary)' }}>
              <i className="bi bi-cpu text-white" style={{ fontSize: '1.25rem' }}></i>
            </span>
            ADVANCE <span className="ms-1" style={{ color: 'var(--cyan-primary)' }}>TECH</span>
          </a>
          <div className="d-flex ms-auto">
            <a href="/admin/login" className="btn btn-outline-dark rounded-pill px-4 fw-medium border-secondary border-opacity-25">
              <i className="bi bi-shield-lock me-1"></i> Admin Portal
            </a>
          </div>
        </div>
      </nav>

      {/* Main Area */}
      <div className="container my-auto py-5" style={{ zIndex: 5 }}>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="glass-card p-4 p-md-5">
              <div className="text-center mb-5">
                <h1 className="mb-2" style={{ fontFamily: 'Inter', fontSize: '2.5rem', color: 'var(--text-color)' }}>Register Account</h1>
                <p className="text-muted">Enter your details to create an account on Advance Tech platform</p>
              </div>
              {/* TallyPrime Integration Button and Select */}
              <div className="mb-4 p-3 rounded border border-info border-opacity-25" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span className="fw-semibold text-dark d-block">TallyPrime Desktop Integration</span>
                    <small className="text-muted">Import name, under, phone, and address details directly from your Tally ODBC Server.</small>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-cyan btn-sm text-white px-3 d-flex align-items-center" 
                    style={{ background: 'var(--cyan-primary)', border: 'none' }}
                    onClick={fetchTallyLedgers} 
                    disabled={fetchingTally}
                  >
                    {fetchingTally ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-arrow-repeat me-1 fs-6"></i>
                    )}
                    Sync Tally Ledgers
                  </button>
                </div>

                {showTallySelect && (
                  <div className="mt-3">
                    <label className="form-label text-dark fw-medium small">Select a Ledger to Import:</label>
                    <select 
                      className="form-select bg-white" 
                      onChange={(e) => {
                        const selectedIdx = e.target.value;
                        if (selectedIdx !== "") {
                          handleSelectTallyLedger(tallyLedgers[selectedIdx]);
                        }
                      }}
                      defaultValue=""
                      style={{ borderRadius: '8px', padding: '10px' }}
                    >
                      <option value="" disabled>--- Select Ledgers Synced from Tally ---</option>
                      {tallyLedgers.map((l, idx) => (
                        <option key={idx} value={idx}>
                          {l.name} ({l.under}) {l.phone ? `- Tel: ${l.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="row">
                  {/* Full Name */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        name="fullname"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.fullname ? 'is-invalid' : ''}`}
                        value={formData.fullname}
                        onChange={handleChange}
                        required
                      />
                      <label>Full Name</label>
                      {errors.fullname && <div className="invalid-feedback text-start">{errors.fullname}</div>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="email"
                        name="email"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <label>Email Address</label>
                      {errors.email && <div className="invalid-feedback text-start">{errors.email}</div>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="tel"
                        name="phone"
                        maxLength="10"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.phone ? 'is-invalid' : ''}`}
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      <label>Phone Number (10 Digits)</label>
                      {errors.phone && <div className="invalid-feedback text-start">{errors.phone}</div>}
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <select
                        name="gender"
                        className={`form-select form-control-custom ${errors.gender ? 'is-invalid' : ''}`}
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled hidden></option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <label>Gender</label>
                      {errors.gender && <div className="invalid-feedback text-start">{errors.gender}</div>}
                    </div>
                  </div>

                  {/* DOB */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="date"
                        name="dob"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.dob ? 'is-invalid' : ''}`}
                        value={formData.dob}
                        onChange={handleChange}
                        required
                      />
                      <label>Date of Birth</label>
                      {errors.dob && <div className="invalid-feedback text-start">{errors.dob}</div>}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <select
                        name="department"
                        className={`form-select form-control-custom ${errors.department ? 'is-invalid' : ''}`}
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled hidden></option>
                        {departments.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <label>Department</label>
                      {errors.department && <div className="invalid-feedback text-start">{errors.department}</div>}
                    </div>
                  </div>

                  {/* State */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        name="state"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.state ? 'is-invalid' : ''}`}
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                      <label>State</label>
                      {errors.state && <div className="invalid-feedback text-start">{errors.state}</div>}
                    </div>
                  </div>

                  {/* Country */}
                  <div className="col-md-6 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        name="country"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.country ? 'is-invalid' : ''}`}
                        value={formData.country}
                        onChange={handleChange}
                        required
                      />
                      <label>Country</label>
                      {errors.country && <div className="invalid-feedback text-start">{errors.country}</div>}
                    </div>
                  </div>

                  {/* Pincode */}
                  <div className="col-md-12 mb-4">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        name="pincode"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.pincode ? 'is-invalid' : ''}`}
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                      />
                      <label>Pincode</label>
                      {errors.pincode && <div className="invalid-feedback text-start">{errors.pincode}</div>}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-md-12 mb-4">
                    <div className="floating-label-group">
                      <textarea
                        name="address"
                        rows="2"
                        placeholder=" "
                        className={`form-control form-control-custom ${errors.address ? 'is-invalid' : ''}`}
                        value={formData.address}
                        onChange={handleChange}
                        required
                      ></textarea>
                      <label>Full Address</label>
                      {errors.address && <div className="invalid-feedback text-start">{errors.address}</div>}
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <button type="submit" className="btn btn-cyan w-100 py-3 mt-2" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-person-plus-fill me-2"></i>
                    )}
                    Complete Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer border-top border-secondary border-opacity-25 py-4 text-center mt-auto" style={{ zIndex: 10 }}>
        <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Advance Tech. All rights reserved. Built with professional standards.
        </p>
      </footer>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom glass-card p-4">
              <div className="modal-body text-center">
                <div className="success-checkmark-circle">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h3 className="modal-title fw-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Success</h3>
                <p className="text-muted mb-4">Registration Successfully Completed.</p>
                <button
                  type="button"
                  className="btn btn-cyan px-4 py-2"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
