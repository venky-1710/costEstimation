import React, { useState, useEffect, useCallback } from 'react';
import { itemsAPI, brandsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Items = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  
  // Form state
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    brand: '',
    uom: 'piece',
    currentRate: '',
    description: '',
    specifications: '',
    isActive: true
  });

  // Brand form state
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [brandErrors, setBrandErrors] = useState({});
  
  // Unit of measurement options
  const uomOptions = [
    'piece', 'kg', 'ton', 'meter', 'sqft', 'cft', 'liter', 'bag', 'box', 'bundle'
  ];

  // Fetch items with filters
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: categoryFilter,
        brand: brandFilter
      };

      const response = await itemsAPI.getAll(params);
      setItems(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, brandFilter]);

  // Fetch brands for dropdown
  const fetchBrands = useCallback(async () => {
    try {
      const response = await brandsAPI.getAll({ limit: 1000, page: 1 });
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to fetch brands');
      setBrands([]); // Set empty array on error
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, [fetchBrands, fetchCategories]);

  // Form handling
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemForm(prev => ({
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

    if (!itemForm.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!itemForm.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!itemForm.brand) {
      newErrors.brand = 'Brand is required';
    }

    if (!itemForm.currentRate || itemForm.currentRate <= 0) {
      newErrors.currentRate = 'Current rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setItemForm({
      name: '',
      category: '',
      brand: '',
      uom: 'piece',
      currentRate: '',
      description: '',
      specifications: '',
      isActive: true
    });
    setErrors({});
  };

  // CRUD Operations
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await itemsAPI.create({
        ...itemForm,
        currentRate: parseFloat(itemForm.currentRate)
      });
      toast.success('Item created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchItems();
      fetchCategories(); // Refresh categories
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(error.response?.data?.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      brand: item.brand._id,
      uom: item.uom,
      currentRate: item.currentRate.toString(),
      description: item.description || '',
      specifications: item.specifications || '',
      isActive: item.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await itemsAPI.update(editingItem._id, {
        ...itemForm,
        currentRate: parseFloat(itemForm.currentRate)
      });
      toast.success('Item updated successfully!');
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      fetchCategories();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await itemsAPI.delete(item._id);
        toast.success('Item deleted successfully!');
        fetchItems();
        fetchCategories();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handleViewItem = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  // Quick create brand function
  const handleQuickCreateBrand = () => {
    setShowBrandModal(true);
  };

  // Brand form handling
  const handleBrandFormChange = (e) => {
    const { name, value } = e.target;
    setBrandForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors
    if (brandErrors[name]) {
      setBrandErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateBrandForm = () => {
    const newErrors = {};

    if (!brandForm.name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    setBrandErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!validateBrandForm()) return;

    try {
      setSubmitting(true);
      const response = await brandsAPI.create({
        name: brandForm.name.trim(),
        description: brandForm.description.trim()
      });
      toast.success('Brand created successfully!');
      setShowBrandModal(false);
      setBrandForm({ name: '', description: '' });
      setBrandErrors({});
      fetchBrands(); // Refresh brands
      setItemForm(prev => ({ ...prev, brand: response.data._id }));
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
        setBrandErrors(serverErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleBrandFilter = (e) => {
    setBrandFilter(e.target.value);
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
          <h2 className="card-title">Items Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Add Item
          </button>
        </div>

        <div className="card-body">
          {/* Search and Filters */}
          <div className="filters-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            
            <div className="filters">
              <select
                value={categoryFilter}
                onChange={handleCategoryFilter}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={brandFilter}
                onChange={handleBrandFilter}
                className="filter-select"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>

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

          {/* Items Table */}
          {loading ? (
            <div className="loading">Loading items...</div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>UOM</th>
                      <th>Current Rate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          No items found. {!searchTerm && !categoryFilter && !brandFilter && (
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="btn btn-primary btn-sm"
                              style={{ marginLeft: '10px' }}
                            >
                              Add First Item
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      items
                        .filter(item => {
                          if (statusFilter === 'active') return item.isActive;
                          if (statusFilter === 'inactive') return !item.isActive;
                          return true;
                        })
                        .map(item => (
                          <tr key={item._id}>
                            <td>
                              <div className="item-name">
                                <strong>{item.name}</strong>
                                {item.description && (
                                  <small>{item.description.substring(0, 50)}...</small>
                                )}
                              </div>
                            </td>
                            <td>{item.category}</td>
                            <td>{item.brand?.name || 'Unknown'}</td>
                            <td>{item.uom}</td>
                            <td>₹{item.currentRate.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="actions">
                                <button
                                  onClick={() => handleViewItem(item)}
                                  className="btn btn-sm btn-secondary"
                                  title="View"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="btn btn-sm btn-primary"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item)}
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

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal item-modal">
            <div className="modal-header">
              <h3>Create New Item</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={itemForm.name}
                      onChange={handleFormChange}
                      className={errors.name ? 'error' : ''}
                      placeholder="Enter item name"
                      required
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      name="category"
                      value={itemForm.category}
                      onChange={handleFormChange}
                      className={errors.category ? 'error' : ''}
                      placeholder="Enter category"
                      list="categories"
                      required
                    />
                    <datalist id="categories">
                      {categories.map(category => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>

                  <div className="form-group">
                    <label>Brand *</label>
                    <div className="brand-select-group">
                      <select
                        name="brand"
                        value={itemForm.brand}
                        onChange={handleFormChange}
                        className={errors.brand ? 'error' : ''}
                        required
                      >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                          <option key={brand._id} value={brand._id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleQuickCreateBrand}
                        className="btn btn-sm btn-secondary"
                        title="Create new brand"
                      >
                        +
                      </button>
                    </div>
                    {errors.brand && <span className="error-text">{errors.brand}</span>}
                  </div>

                  <div className="form-group">
                    <label>Unit of Measurement *</label>
                    <select
                      name="uom"
                      value={itemForm.uom}
                      onChange={handleFormChange}
                      required
                    >
                      {uomOptions.map(uom => (
                        <option key={uom} value={uom}>
                          {uom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Current Rate (₹) *</label>
                    <input
                      type="number"
                      name="currentRate"
                      value={itemForm.currentRate}
                      onChange={handleFormChange}
                      className={errors.currentRate ? 'error' : ''}
                      placeholder="Enter rate"
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors.currentRate && <span className="error-text">{errors.currentRate}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={itemForm.isActive}
                        onChange={handleFormChange}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={itemForm.description}
                    onChange={handleFormChange}
                    placeholder="Enter item description"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Specifications</label>
                  <textarea
                    name="specifications"
                    value={itemForm.specifications}
                    onChange={handleFormChange}
                    placeholder="Enter technical specifications"
                    rows="3"
                  />
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
                  {submitting ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal item-modal">
            <div className="modal-header">
              <h3>Edit Item</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateItem}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={itemForm.name}
                      onChange={handleFormChange}
                      className={errors.name ? 'error' : ''}
                      required
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      name="category"
                      value={itemForm.category}
                      onChange={handleFormChange}
                      className={errors.category ? 'error' : ''}
                      list="categories"
                      required
                    />
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>

                  <div className="form-group">
                    <label>Brand *</label>
                    <div className="brand-select-group">
                      <select
                        name="brand"
                        value={itemForm.brand}
                        onChange={handleFormChange}
                        className={errors.brand ? 'error' : ''}
                        required
                      >
                        <option value="">Select Brand</option>
                        {brands.map(brand => (
                          <option key={brand._id} value={brand._id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleQuickCreateBrand}
                        className="btn btn-sm btn-secondary"
                      >
                        +
                      </button>
                    </div>
                    {errors.brand && <span className="error-text">{errors.brand}</span>}
                  </div>

                  <div className="form-group">
                    <label>Unit of Measurement *</label>
                    <select
                      name="uom"
                      value={itemForm.uom}
                      onChange={handleFormChange}
                      required
                    >
                      {uomOptions.map(uom => (
                        <option key={uom} value={uom}>
                          {uom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Current Rate (₹) *</label>
                    <input
                      type="number"
                      name="currentRate"
                      value={itemForm.currentRate}
                      onChange={handleFormChange}
                      className={errors.currentRate ? 'error' : ''}
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors.currentRate && <span className="error-text">{errors.currentRate}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={itemForm.isActive}
                        onChange={handleFormChange}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={itemForm.description}
                    onChange={handleFormChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Specifications</label>
                  <textarea
                    name="specifications"
                    value={itemForm.specifications}
                    onChange={handleFormChange}
                    rows="3"
                  />
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
                  {submitting ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {showViewModal && viewingItem && (
        <div className="modal-overlay">
          <div className="modal item-modal">
            <div className="modal-header">
              <h3>Item Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="item-details">
                <div className="detail-group">
                  <label>Name:</label>
                  <span>{viewingItem.name}</span>
                </div>
                <div className="detail-group">
                  <label>Category:</label>
                  <span>{viewingItem.category}</span>
                </div>
                <div className="detail-group">
                  <label>Brand:</label>
                  <span>{viewingItem.brand?.name || 'Unknown'}</span>
                </div>
                <div className="detail-group">
                  <label>Unit of Measurement:</label>
                  <span>{viewingItem.uom}</span>
                </div>
                <div className="detail-group">
                  <label>Current Rate:</label>
                  <span>₹{viewingItem.currentRate.toFixed(2)}</span>
                </div>
                <div className="detail-group">
                  <label>Status:</label>
                  <span className={`status-badge ${viewingItem.isActive ? 'active' : 'inactive'}`}>
                    {viewingItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {viewingItem.description && (
                  <div className="detail-group">
                    <label>Description:</label>
                    <span>{viewingItem.description}</span>
                  </div>
                )}
                {viewingItem.specifications && (
                  <div className="detail-group">
                    <label>Specifications:</label>
                    <span>{viewingItem.specifications}</span>
                  </div>
                )}
                <div className="detail-group">
                  <label>Created:</label>
                  <span>{new Date(viewingItem.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-group">
                  <label>Last Updated:</label>
                  <span>{new Date(viewingItem.updatedAt).toLocaleDateString()}</span>
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
                  handleEditItem(viewingItem);
                }}
                className="btn btn-primary"
              >
                Edit Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Brand Modal */}
      {showBrandModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Brand</h3>
              <button
                onClick={() => setShowBrandModal(false)}
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
                    onChange={handleBrandFormChange}
                    className={brandErrors.name ? 'error' : ''}
                    placeholder="Enter brand name"
                    required
                    autoFocus
                  />
                  {brandErrors.name && <span className="error-text">{brandErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={brandForm.description}
                    onChange={handleBrandFormChange}
                    placeholder="Enter brand description (optional)"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
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
    </div>
  );
};

export default Items;
