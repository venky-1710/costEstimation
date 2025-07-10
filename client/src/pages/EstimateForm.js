import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { estimatesAPI, customersAPI, itemsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EstimateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  // State management
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // Store all customers for search
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  
  // Form state
  const [estimateForm, setEstimateForm] = useState({
    customer: '',
    validTill: '',
    discount: 0,
    discountType: 'percentage',
    loadingCharges: 0,
    notes: '',
    status: 'draft'
  });

  // Estimate items
  const [estimateItems, setEstimateItems] = useState([{
    item: '',
    quantity: 1,
    rate: 0,
    total: 0
  }]);

  const [errors, setErrors] = useState({});

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = estimateItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    
    let discountAmount = 0;
    const discount = parseFloat(estimateForm.discount) || 0;
    if (estimateForm.discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    
    const loadingCharges = parseFloat(estimateForm.loadingCharges) || 0;
    const total = subtotal - discountAmount + loadingCharges;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }, [estimateItems, estimateForm.discount, estimateForm.discountType, estimateForm.loadingCharges]);

  // Fetch data functions
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getForEstimate({ limit: 1000 });
      console.log('Customers for estimate:', response.data);
      const fetchedCustomers = response.data.customers || [];
      setAllCustomers(fetchedCustomers);
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (!customerSearchTerm) {
      setCustomers(allCustomers);
    } else {
      const filtered = allCustomers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(customerSearchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
      );
      setCustomers(filtered);
    }
  }, [customerSearchTerm, allCustomers]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await itemsAPI.getAll({ limit: 1000 });
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    }
  }, []);

  const fetchEstimate = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await estimatesAPI.getById(id);
      const estimate = response.data;
      
      setEstimateForm({
        customer: estimate.customer._id,
        validTill: new Date(estimate.validTill).toISOString().split('T')[0],
        discount: estimate.discount || 0,
        discountType: estimate.discountType || 'percentage',
        loadingCharges: estimate.loadingCharges || 0,
        notes: estimate.notes || '',
        status: estimate.status || 'draft'
      });
      
      setEstimateItems((estimate.items || []).map(item => ({
        item: item.item?._id || '',
        quantity: item.quantity,
        rate: item.rate,
        total: item.total
      })));
      
    } catch (error) {
      console.error('Error fetching estimate:', error);
      toast.error('Failed to fetch estimate');
      navigate('/estimates');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    if (isEditMode) {
      fetchEstimate();
    }
  }, [fetchCustomers, fetchItems, fetchEstimate, isEditMode]);

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEstimateForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...estimateItems];
    updatedItems[index][field] = value;
    
    // Auto-calculate rate from item if item is selected
    if (field === 'item' && value) {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        updatedItems[index].rate = selectedItem.currentRate;
      }
    }
    
    // Calculate total for this item
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].total = quantity * rate;
    }
    
    setEstimateItems(updatedItems);
  };

  const addItem = () => {
    setEstimateItems([...estimateItems, {
      item: '',
      quantity: 1,
      rate: 0,
      total: 0
    }]);
  };

  const removeItem = (index) => {
    if (estimateItems.length > 1) {
      const updatedItems = estimateItems.filter((_, i) => i !== index);
      setEstimateItems(updatedItems);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!estimateForm.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (!estimateForm.validTill) {
      newErrors.validTill = 'Valid till date is required';
    }

    // Validate estimate items
    estimateItems.forEach((item, index) => {
      if (!item.item) {
        newErrors[`item_${index}`] = 'Item is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'Quantity must be greater than 0';
      }
      if (!item.rate || item.rate <= 0) {
        newErrors[`rate_${index}`] = 'Rate must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const estimateData = {
        ...estimateForm,
        items: estimateItems.map(item => ({
          item: item.item,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate)
        })),
        discount: parseFloat(estimateForm.discount),
        loadingCharges: parseFloat(estimateForm.loadingCharges)
      };

      if (isEditMode) {
        await estimatesAPI.update(id, estimateData);
        toast.success('Estimate updated successfully!');
      } else {
        await estimatesAPI.create(estimateData);
        toast.success('Estimate created successfully!');
      }
      
      navigate('/estimates');
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast.error(error.response?.data?.message || 'Failed to save estimate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    const draftData = { ...estimateForm, status: 'draft' };
    setEstimateForm(draftData);
    await handleSubmit({ preventDefault: () => {} });
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading estimate...</div>
      </div>
    );
  }

  // Check if required data is available
  const canCreateEstimate = customers.length > 0 && items.length > 0;

  if (!canCreateEstimate && !loading) {
    return (
      <div className="dashboard">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Create New Estimate</h2>
            <button
              type="button"
              onClick={() => navigate('/estimates')}
              className="btn btn-secondary"
            >
              Back to Estimates
            </button>
          </div>
          <div className="card-body">
            <div className="missing-data-notice">
              <h3>Setup Required</h3>
              <p>To create estimates, you need to have customers and items in your system.</p>
              
              <div className="setup-actions">
                {customers.length === 0 && (
                  <div className="setup-item">
                    <span>📋 No customers found</span>
                    <button
                      onClick={() => navigate('/customers')}
                      className="btn btn-primary"
                    >
                      Add Customers
                    </button>
                  </div>
                )}
                
                {items.length === 0 && (
                  <div className="setup-item">
                    <span>📦 No items found</span>
                    <button
                      onClick={() => navigate('/items')}
                      className="btn btn-primary"
                    >
                      Add Items
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {isEditMode ? 'Edit Estimate' : 'Create New Estimate'}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/estimates')}
            className="btn btn-secondary"
          >
            Back to Estimates
          </button>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer *</label>
                  
                  {/* Customer Search Input */}
                  <div className="customer-search-wrapper">
                    <input
                      type="text"
                      placeholder="Search customers by name, phone, or email..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="customer-search-input"
                    />
                  </div>
                  
                  <div className="customer-select-group">
                    <select
                      name="customer"
                      value={estimateForm.customer}
                      onChange={handleFormChange}
                      className={errors.customer ? 'error' : ''}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.length === 0 ? (
                        <option disabled>
                          {customerSearchTerm ? 'No customers found matching search' : 'No customers available - Please add customers first'}
                        </option>
                      ) : (
                        customers.map(customer => (
                          <option key={customer._id} value={customer._id} title={`${customer.displayName}${customer.fullAddress ? ' - ' + customer.fullAddress : ''}${customer.gstNumber ? ' (GST: ' + customer.gstNumber + ')' : ''}`}>
                            {customer.displayName}
                          </option>
                        ))
                      )}
                    </select>
                    {allCustomers.length === 0 && (
                      <button
                        type="button"
                        onClick={() => window.open('/customers', '_blank')}
                        className="btn btn-sm btn-secondary"
                        title="Add customers"
                      >
                        + Add Customers
                      </button>
                    )}
                  </div>
                  {errors.customer && <span className="error-text">{errors.customer}</span>}
                  
                  {/* Display selected customer details */}
                  {estimateForm.customer && (() => {
                    const selectedCustomer = customers.find(c => c._id === estimateForm.customer) || 
                                           allCustomers.find(c => c._id === estimateForm.customer);
                    return selectedCustomer ? (
                      <div className="selected-customer-info">
                        <div className="customer-details">
                          <div className="detail-row">
                            <span className="label">Contact:</span>
                            <span className="value">{selectedCustomer.phone || 'No phone'}{selectedCustomer.email ? ` | ${selectedCustomer.email}` : ''}</span>
                          </div>
                          {selectedCustomer.fullAddress && (
                            <div className="detail-row">
                              <span className="label">Address:</span>
                              <span className="value">{selectedCustomer.fullAddress}</span>
                            </div>
                          )}
                          {selectedCustomer.gstNumber && (
                            <div className="detail-row">
                              <span className="label">GST:</span>
                              <span className="value">{selectedCustomer.gstNumber}</span>
                            </div>
                          )}
                          {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                            <div className="detail-row">
                              <span className="label">Tags:</span>
                              <span className="value">
                                {selectedCustomer.tags.map(tag => (
                                  <span key={tag} className="customer-tag">{tag}</span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="form-group">
                  <label>Valid Till *</label>
                  <input
                    type="date"
                    name="validTill"
                    value={estimateForm.validTill}
                    onChange={handleFormChange}
                    className={errors.validTill ? 'error' : ''}
                    required
                  />
                  {errors.validTill && <span className="error-text">{errors.validTill}</span>}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={estimateForm.status}
                    onChange={handleFormChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="viewed">Viewed</option>
                    <option value="converted">Converted</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="form-section">
              <div className="section-header">
                <h3>Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-primary btn-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="items-table">
                <div className="items-header">
                  <div>Item</div>
                  <div>Quantity</div>
                  <div>Rate</div>
                  <div>Total</div>
                  <div>Action</div>
                </div>

                {estimateItems.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="form-group">                        <select
                          value={item.item}
                          onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                          className={errors[`item_${index}`] ? 'error' : ''}
                          required
                        >
                          <option value="">Select Item</option>
                          {items.length === 0 ? (
                            <option disabled>No items available - Please add items first</option>
                          ) : (
                            items.map(availableItem => (
                              <option key={availableItem._id} value={availableItem._id}>
                                {availableItem.name} ({availableItem.brand?.name}) - ₹{availableItem.currentRate}/{availableItem.uom}
                              </option>
                            ))
                          )}
                        </select>
                      {errors[`item_${index}`] && <span className="error-text">{errors[`item_${index}`]}</span>}
                    </div>

                    <div className="form-group">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className={errors[`quantity_${index}`] ? 'error' : ''}
                        min="0"
                        step="0.01"
                        required
                      />
                      {errors[`quantity_${index}`] && <span className="error-text">{errors[`quantity_${index}`]}</span>}
                    </div>

                    <div className="form-group">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className={errors[`rate_${index}`] ? 'error' : ''}
                        min="0"
                        step="0.01"
                        required
                      />
                      {errors[`rate_${index}`] && <span className="error-text">{errors[`rate_${index}`]}</span>}
                    </div>

                    <div className="item-total">
                      ₹{(parseFloat(item.total) || 0).toFixed(2)}
                    </div>

                    <div className="item-actions">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn btn-sm btn-danger"
                        disabled={estimateItems.length === 1}
                        title="Remove Item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Section */}
            <div className="form-section">
              <h3>Calculations</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    name="discountType"
                    value={estimateForm.discountType}
                    onChange={handleFormChange}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    name="discount"
                    value={estimateForm.discount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Loading Charges (₹)</label>
                  <input
                    type="number"
                    name="loadingCharges"
                    value={estimateForm.loadingCharges}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Totals Display */}
              <div className="totals-section">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span>
                  <span>-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Loading Charges:</span>
                  <span>₹{(parseFloat(estimateForm.loadingCharges) || 0).toFixed(2)}</span>
                </div>
                <div className="total-row final-total">
                  <span>Total:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="form-section">
              <h3>Notes</h3>
              <div className="form-group">
                <textarea
                  name="notes"
                  value={estimateForm.notes}
                  onChange={handleFormChange}
                  placeholder="Enter any additional notes or terms..."
                  rows="4"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/estimates')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={submitting}
                  className="btn btn-outline"
                >
                  Save as Draft
                </button>
              )}
              
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Saving...' : (isEditMode ? 'Update Estimate' : 'Create Estimate')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EstimateForm;
