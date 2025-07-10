import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    tags: [],
    traderProfile: {
      businessName: '',
      address: '',
      gstNumber: '',
      licenseNumber: ''
    }
  });

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Edit modes
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Predefined tag suggestions based on user role
  const getTagSuggestions = () => {
    const commonTags = ['regular', 'premium', 'vip'];
    const roleTags = {
      admin: ['system-admin', 'super-user', 'manager'],
      trader: ['wholesale', 'retail', 'bulk-supplier', 'local-vendor', 'premium-dealer'],
      customer: ['residential', 'commercial', 'contractor', 'architect', 'individual']
    };
    return [...commonTags, ...(roleTags[user?.role] || [])];
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      const userData = response.data;
      
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        tags: userData.tags || [],
        traderProfile: userData.traderProfile || {
          businessName: '',
          address: '',
          gstNumber: '',
          licenseNumber: ''
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('traderProfile.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        traderProfile: {
          ...prev.traderProfile,
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addTag = () => {
    setShowTagInput(true);
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    
    // Validation
    if (!trimmedTag) {
      toast.error('Tag cannot be empty');
      return;
    }
    
    if (trimmedTag.length > 50) {
      toast.error('Tag must be less than 50 characters');
      return;
    }
    
    if (profileData.tags.includes(trimmedTag)) {
      toast.error('Tag already exists');
      return;
    }
    
    if (profileData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }

    setProfileData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }));
    setNewTag('');
    setShowTagInput(false);
  };

  const addPredefinedTag = (tag) => {
    if (!profileData.tags.includes(tag)) {
      setProfileData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const cancelAddTag = () => {
    setNewTag('');
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove) => {
    setProfileData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setSaving(true);
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data);
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setSaving(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTags = async () => {
    try {
      const response = await authAPI.updateTags(profileData.tags);
      toast.success('Tags updated successfully!');
      // Update the auth context with new user data
      const updatedUser = { ...user, tags: response.data.tags };
      updateUser(updatedUser);
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error(error.response?.data?.message || 'Failed to update tags');
      // Revert to original tags on error
      fetchUserProfile();
    }
  };

  // Auto-save tags when they change (with debounce)
  useEffect(() => {
    if (editMode && profileData.tags.length > 0) {
      const timeoutId = setTimeout(() => {
        handleUpdateTags();
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [profileData.tags, editMode]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Profile Management</h2>
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Info
            </button>
            <button
              className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Personal Information</h3>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-primary"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      onClick={() => setEditMode(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="role-field"
                    />
                  </div>
                </div>

                {/* Tags Section */}
                <div className="form-group">
                  <label>
                    Tags 
                    <span className="tag-counter">({profileData.tags.length}/10)</span>
                  </label>
                  <div className="tags-container">
                    {profileData.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="tag-remove"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    
                    {editMode && profileData.tags.length < 10 && (
                      <>
                        {!showTagInput ? (
                          <button
                            type="button"
                            onClick={addTag}
                            className="btn btn-sm btn-secondary"
                          >
                            + Add Tag
                          </button>
                        ) : (
                          <div className="tag-input-container">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Enter tag name"
                              className="tag-input"
                              maxLength="50"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag();
                                } else if (e.key === 'Escape') {
                                  cancelAddTag();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddTag}
                              className="btn btn-sm btn-primary"
                              title="Add tag"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={cancelAddTag}
                              className="btn btn-sm btn-secondary"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {profileData.tags.length === 0 && !editMode && (
                      <span className="no-tags">No tags added yet</span>
                    )}
                  </div>
                  
                  {/* Tag Suggestions */}
                  {editMode && !showTagInput && profileData.tags.length < 10 && (
                    <div className="tag-suggestions">
                      <small>Suggested tags:</small>
                      <div className="suggestions-container">
                        {getTagSuggestions()
                          .filter(tag => !profileData.tags.includes(tag))
                          .slice(0, 8) // Show max 8 suggestions
                          .map((tag, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => addPredefinedTag(tag)}
                              className="suggestion-tag"
                              title={`Add "${tag}" tag`}
                            >
                              {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trader Profile Section */}
                {user?.role === 'trader' && (
                  <div className="trader-profile-section">
                    <h4>Business Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Business Name</label>
                        <input
                          type="text"
                          name="traderProfile.businessName"
                          value={profileData.traderProfile.businessName}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-group">
                        <label>GST Number</label>
                        <input
                          type="text"
                          name="traderProfile.gstNumber"
                          value={profileData.traderProfile.gstNumber}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          name="traderProfile.licenseNumber"
                          value={profileData.traderProfile.licenseNumber}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="form-group">
                        <label>Business Address</label>
                        <textarea
                          name="traderProfile.address"
                          value={profileData.traderProfile.address}
                          onChange={handleProfileChange}
                          disabled={!editMode}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="password-section">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                  <small>Password must be at least 6 characters long</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
