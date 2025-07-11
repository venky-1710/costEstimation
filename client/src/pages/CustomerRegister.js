import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './CustomerRegister.css';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    customerType: 'individual',
    companyName: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    gstNumber: '',
    tags: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        customerType: formData.customerType,
        companyName: formData.companyName,
        address: formData.address,
        gstNumber: formData.gstNumber
      };

      const response = await authAPI.registerCustomer(registrationData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Registration successful! Welcome to our platform.');
      navigate('/customer-dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-register-container" style={{margin: 0, padding: 0}}>
      <div className="customer-register-card">
        <div className="customer-register-header">
          <h2>Create Your Account</h2>
          <p>Join us today and start managing your estimates effortlessly</p>
        </div>

        <form onSubmit={handleSubmit} className="customer-register-form">
          <div className="progress-indicator">
            <div className="progress-step active"></div>
            <div className="progress-step active"></div>
            <div className="progress-step active"></div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Personal Details</h3>
            
            <div className="form-group">
              <label>Full Name <span className="required-field">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email Address <span className="required-field">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required-field">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Create Password <span className="required-field">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Minimum 6 characters"
                />
                <div className="field-hint">Choose a strong password with at least 6 characters</div>
              </div>

              <div className="form-group">
                <label>Confirm Password <span className="required-field">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div className="form-section">
            <h3>Account Type</h3>
            
            <div className="customer-type-selector">
              <div 
                className={`type-option ${formData.customerType === 'individual' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({...prev, customerType: 'individual'}))}
              >
                <div style={{fontSize: '24px', marginBottom: '8px'}}>👤</div>
                <div style={{fontWeight: '600'}}>Individual</div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '5px'}}>Personal account</div>
              </div>
              
              <div 
                className={`type-option ${formData.customerType === 'business' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({...prev, customerType: 'business'}))}
              >
                <div style={{fontSize: '24px', marginBottom: '8px'}}>🏢</div>
                <div style={{fontWeight: '600'}}>Business</div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '5px'}}>Company account</div>
              </div>
            </div>

            {formData.customerType === 'business' && (
              <div className="form-group" style={{marginTop: '20px'}}>
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your company name"
                />
              </div>
            )}

            <div className="form-group">
              <label>GST Number (Optional)</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="Enter GST number if applicable"
              />
              <div className="field-hint">Required for generating GST invoices</div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Details</h3>
            
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="House/Flat number, Street name"
              />
            </div>

            <div className="form-grid-three">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="123456"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading && <span className="loading-spinner"></span>}
            {loading ? 'Creating Your Account...' : 'Create Account'}
          </button>
        </form>

        <div className="customer-register-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
