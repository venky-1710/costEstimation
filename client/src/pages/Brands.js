import React, { useState, useEffect, useCallback } from 'react';
import { brandsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Brands = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const brandsPerPage = 10;
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [viewingBrand, setViewingBrand] = useState(null);
  
  // Form state
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});

  // Fetch brands with filters
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: brandsPerPage,
        search: searchTerm
      };

      const response = await brandsAPI.getAll(params);
      setBrands(response.data.brands || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Form handling
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBrandForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!brandForm.name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setBrandForm({
      name: '',
      description: '',
      isActive: true
    });
    setErrors({});
  };

  // CRUD Operations
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await brandsAPI.create({
        name: brandForm.name.trim(),
        description: brandForm.description.trim()
      });
      toast.success('Brand created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchBrands();
    } catch (error) {
      console.error('Error creating brand:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create brand';
      toast.error(errorMessage);
      
      // Handle specific validation errors
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.param || err.path] = err.msg;
        });
        setErrors(serverErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      description: brand.description || '',
      isActive: brand.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await brandsAPI.update(editingBrand._id, {
        name: brandForm.name.trim(),
        description: brandForm.description.trim(),
        isActive: brandForm.isActive
      });
      toast.success('Brand updated successfully!');
      setShowEditModal(false);
      setEditingBrand(null);
      resetForm();
      fetchBrands();
    } catch (error) {
      console.error('Error updating brand:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update brand';
      toast.error(errorMessage);
      
      // Handle specific validation errors
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.param || err.path] = err.msg;
        });
        setErrors(serverErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brand) => {
    if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        await brandsAPI.delete(brand._id);
        toast.success('Brand deleted successfully!');
        fetchBrands();
      } catch (error) {
        console.error('Error deleting brand:', error);
        toast.error(error.response?.data?.message || 'Failed to delete brand');
      }
    }
  };

  const handleViewBrand = (brand) => {
    setViewingBrand(brand);
    setShowViewModal(true);
  };

  // Filter handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Brands Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Add Brand
          </button>
        </div>

        <div className="card-body">
          {/* Search and Filters */}
          <div className="filters-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            
            <div className="filters">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Brands Table */}
          {loading ? (
            <div className="loading">Loading brands...</div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">
                          No brands found. {!searchTerm && (
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="btn btn-primary btn-sm"
                              style={{ marginLeft: '10px' }}
                            >
                              Add First Brand
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      brands
                        .filter(brand => {
                          if (statusFilter === 'active') return brand.isActive;
                          if (statusFilter === 'inactive') return !brand.isActive;
                          return true;
                        })
                        .map(brand => (
                          <tr key={brand._id}>
                            <td>
                              <div className="brand-name">
                                <strong>{brand.name}</strong>
                              </div>
                            </td>
                            <td>{brand.description || '-'}</td>
                            <td>
                              <span className={`status-badge ${brand.isActive ? 'active' : 'inactive'}`}>
                                {brand.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>{new Date(brand.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="actions">
                                <button
                                  onClick={() => handleViewBrand(brand)}
                                  className="btn btn-sm btn-secondary"
                                  title="View"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleEditBrand(brand)}
                                  className="btn btn-sm btn-primary"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteBrand(brand)}
                                  className="btn btn-sm btn-danger"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Brand</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBrand}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={brandForm.name}
                    onChange={handleFormChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter brand name"
                    required
                    autoFocus
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={brandForm.description}
                    onChange={handleFormChange}
                    placeholder="Enter brand description (optional)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={brandForm.isActive}
                      onChange={handleFormChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {showEditModal && editingBrand && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Brand</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateBrand}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={brandForm.name}
                    onChange={handleFormChange}
                    className={errors.name ? 'error' : ''}
                    required
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={brandForm.description}
                    onChange={handleFormChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={brandForm.isActive}
                      onChange={handleFormChange}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Brand Modal */}
      {showViewModal && viewingBrand && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Brand Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="brand-details">
                <div className="detail-group">
                  <label>Name:</label>
                  <span>{viewingBrand.name}</span>
                </div>
                <div className="detail-group">
                  <label>Description:</label>
                  <span>{viewingBrand.description || 'No description'}</span>
                </div>
                <div className="detail-group">
                  <label>Status:</label>
                  <span className={`status-badge ${viewingBrand.isActive ? 'active' : 'inactive'}`}>
                    {viewingBrand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Created:</label>
                  <span>{new Date(viewingBrand.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-group">
                  <label>Last Updated:</label>
                  <span>{new Date(viewingBrand.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditBrand(viewingBrand);
                }}
                className="btn btn-primary"
              >
                Edit Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;
