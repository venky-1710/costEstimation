import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'trader',
    traderProfile: {
      businessName: '',
      businessAddress: '',
      gstNumber: '',
      licenseNumber: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('traderProfile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        traderProfile: {
          ...prev.traderProfile,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.role === 'trader') {
      if (!formData.traderProfile.businessName.trim()) {
        newErrors.businessName = 'Business name is required for traders';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);
      if (result.success) {
        // Show success message about pending approval
        alert('Account created successfully! Your account is pending approval. You will be notified once approved.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <div className="register-header">
          <h2 className="register-title">Create Trader/Admin Account</h2>
          <p className="register-subtitle">Fill in the details to get started - Your account will need approval</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-control ${errors.phone ? 'error' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control role-select"
            >
              <option value="trader">Trader</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'trader' && (
            <div className="trader-fields">
              <h3 className="trader-fields-title">Business Information</h3>
              
              <div className="form-group">
                <label htmlFor="businessName" className="form-label">Business Name</label>
                <input
                  type="text"
                  id="businessName"
                  name="traderProfile.businessName"
                  value={formData.traderProfile.businessName}
                  onChange={handleChange}
                  className={`form-control ${errors.businessName ? 'error' : ''}`}
                  placeholder="Enter your business name"
                />
                {errors.businessName && <div className="error-message">{errors.businessName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="businessAddress" className="form-label">Business Address</label>
                <textarea
                  id="businessAddress"
                  name="traderProfile.businessAddress"
                  value={formData.traderProfile.businessAddress}
                  onChange={handleChange}
                  className="form-control textarea-control"
                  placeholder="Enter your business address"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gstNumber" className="form-label">GST Number</label>
                <input
                  type="text"
                  id="gstNumber"
                  name="traderProfile.gstNumber"
                  value={formData.traderProfile.gstNumber}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter GST number (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="licenseNumber" className="form-label">License Number</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="traderProfile.licenseNumber"
                  value={formData.traderProfile.licenseNumber}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter license number (optional)"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-btn"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link-container">
          <p className="login-link-text">
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </p>
          <p className="login-link-text">
            Want to register as a customer?{' '}
            <Link to="/register-customer" className="login-link">
              Customer Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
