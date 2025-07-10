import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatesAPI, customersAPI, itemsAPI, brandsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Estimates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEstimate, setViewingEstimate] = useState(null);

  const itemsPerPage = 10;

  const fetchEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter
      };

      console.log('Fetching estimates with params:', params);
      const response = await estimatesAPI.getAll(params);
      console.log('Estimates API response:', response.data);
      
      setEstimates(response.data.estimates || response.data);
      setTotalPages(response.data.totalPages || Math.ceil((response.data.length || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching estimates:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch estimates');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  const fetchCustomers = useCallback(async () => {
    try {
      console.log('Fetching customers...');
      const response = await customersAPI.getAll({ limit: 100 });
      console.log('Customers response:', response.data);
      setCustomers(response.data.customers || response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      console.error('Customer error response:', error.response?.data);
      if (error.response?.status === 403) {
        toast.error('Access denied for customers. Check your permissions.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required for customers.');
      }
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      console.log('Fetching items...');
      const response = await itemsAPI.getAll({ limit: 100 });
      console.log('Items response:', response.data);
      setItems(response.data.items || response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Items error response:', error.response?.data);
      if (error.response?.status === 403) {
        toast.error('Access denied for items. Check your permissions.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required for items.');
      }
    }
  }, []);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, [fetchCustomers, fetchItems]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle estimate actions
  const handleEditEstimate = (estimate) => {
    navigate(`/estimates/edit/${estimate._id}`);
  };

  const handleUpdateEstimate = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      
      const subtotal = calculateSubtotal(editingEstimate.items);
      const total = calculateTotal(
        subtotal,
        editingEstimate.discount,
        editingEstimate.discountType,
        editingEstimate.loadingCharges
      );

      const estimateData = {
        ...editingEstimate,
        subtotal,
        total
      };

      console.log('Updating estimate:', estimateData);
      await estimatesAPI.update(editingEstimate._id, estimateData);
      toast.success('Estimate updated successfully');
      setShowEditModal(false);
      setEditingEstimate(null);
      await fetchEstimates();
    } catch (error) {
      console.error('Error updating estimate:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update estimate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEstimate = async (estimateId, estimateNumber) => {
    if (window.confirm(`Are you sure you want to delete estimate "${estimateNumber}"?`)) {
      try {
        console.log('Deleting estimate:', estimateId);
        await estimatesAPI.delete(estimateId);
        toast.success('Estimate deleted successfully');
        await fetchEstimates();
      } catch (error) {
        console.error('Error deleting estimate:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to delete estimate');
      }
    }
  };

  const handleViewEstimate = (estimate) => {
    setViewingEstimate(estimate);
    setShowViewModal(true);
  };

  const handleMarkAsSent = async (estimateId, sentVia) => {
    try {
      await estimatesAPI.markAsSent(estimateId, sentVia);
      toast.success(`Estimate marked as sent via ${sentVia}`);
      await fetchEstimates();
    } catch (error) {
      console.error('Error marking estimate as sent:', error);
      toast.error('Failed to mark estimate as sent');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-secondary';
      case 'sent': return 'badge-primary';
      case 'viewed': return 'badge-warning';
      case 'converted': return 'badge-success';
      case 'expired': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i._id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  // PDF Download function
  const downloadEstimatePDF = async (estimate) => {
    try {
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.width = '800px';

      const customerName = getCustomerName(estimate.customer);
      const customer = customers.find(c => c._id === estimate.customer);

      pdfContent.innerHTML = `
        <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0;">ESTIMATE</h1>
          <p style="margin: 5px 0; color: #666;">Estimate #: ${estimate.estimateNumber}</p>
          <p style="margin: 5px 0; color: #666;">Date: ${new Date(estimate.createdAt).toLocaleDateString()}</p>
          <p style="margin: 5px 0; color: #666;">Valid Till: ${new Date(estimate.validTill).toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; margin-bottom: 10px;">Bill To:</h3>
          <p style="margin: 5px 0;"><strong>${customerName}</strong></p>
          ${customer?.phone ? `<p style="margin: 5px 0;">Phone: ${customer.phone}</p>` : ''}
          ${customer?.email ? `<p style="margin: 5px 0;">Email: ${customer.email}</p>` : ''}
          ${customer?.address ? `<p style="margin: 5px 0;">Address: ${customer.address}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Rate</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(estimate.items || []).map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${getItemName(item.item)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${item.rate.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${item.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 20px;">
          <p style="margin: 5px 0;">Subtotal: ₹${estimate.subtotal?.toLocaleString()}</p>
          ${estimate.discount ? `<p style="margin: 5px 0;">Discount: -₹${estimate.discountAmount?.toLocaleString()}</p>` : ''}
          ${estimate.loadingCharges ? `<p style="margin: 5px 0;">Loading Charges: ₹${estimate.loadingCharges?.toLocaleString()}</p>` : ''}
          <p style="margin: 10px 0; font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 10px;">
            Total: ₹${estimate.total?.toLocaleString()}
          </p>
        </div>

        ${estimate.notes ? `
          <div style="margin-top: 30px;">
            <h4 style="color: #333;">Notes:</h4>
            <p style="margin: 10px 0; line-height: 1.5;">${estimate.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
          <p>Thank you for your business!</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      // Generate PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`estimate-${estimate.estimateNumber}.pdf`);
      document.body.removeChild(pdfContent);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Filter estimates based on user role
  const getFilteredEstimates = () => {
    let baseEstimates = estimates;
    
    // If user is a customer, only show their estimates
    if (user.role === 'customer') {
      baseEstimates = estimates.filter(estimate => 
        estimate.customer === user._id || 
        (typeof estimate.customer === 'object' && estimate.customer._id === user._id)
      );
    }
    
    return baseEstimates.filter(estimate => {
      const customerName = getCustomerName(estimate.customer);
      const matchesSearch = estimate.estimateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           estimate.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || estimate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredEstimates = getFilteredEstimates();

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {user.role === 'customer' ? 'My Estimates' : 'Estimates Management'}
          </h2>
          <div className="header-actions">
            <div className="search-filters">
              <input
                type="text"
                placeholder="Search estimates..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="converted">Converted</option>
                <option value="expired">Expired</option>
              </select>
              {user.role !== 'customer' && (
                <button
                  onClick={() => navigate('/estimates/new')}
                  className="btn btn-primary"
                >
                  + Create Estimate
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading">Loading estimates...</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estimate #</th>
                      {user.role !== 'customer' && <th>Customer</th>}
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Valid Till</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstimates.length === 0 ? (
                      <tr>
                        <td colSpan={user.role === 'customer' ? "6" : "7"} className="text-center">
                          {user.role === 'customer' 
                            ? 'No estimates found for you.' 
                            : 'No estimates found.'
                          }
                          {user.role !== 'customer' && (
                            <button 
                              onClick={() => navigate('/estimates/new')}
                              className="btn btn-link"
                            >
                              Create your first estimate
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredEstimates.map((estimate) => (
                        <tr key={estimate._id}>
                          <td>
                            <strong>{estimate.estimateNumber}</strong>
                          </td>
                          {user.role !== 'customer' && (
                            <td>{getCustomerName(estimate.customer)}</td>
                          )}
                          <td>₹{estimate.total?.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(estimate.status)}`}>
                              {estimate.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>{formatDate(estimate.validTill)}</td>
                          <td>{formatDate(estimate.createdAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleViewEstimate(estimate)}
                                className="btn-icon btn-view"
                                title="View Estimate"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => downloadEstimatePDF(estimate)}
                                className="btn-icon btn-download"
                                title="Download PDF"
                              >
                                📄
                              </button>
                              {user.role !== 'customer' && (
                                <>
                                  <button
                                    onClick={() => handleEditEstimate(estimate)}
                                    className="btn-icon btn-edit"
                                    title="Edit Estimate"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEstimate(estimate._id, estimate.estimateNumber)}
                                    className="btn-icon btn-delete"
                                    title="Delete Estimate"
                                  >
                                    �️
                                  </button>
                                  {estimate.status === 'draft' && (
                                    <button
                                      onClick={() => handleMarkAsSent(estimate._id, 'email')}
                                      className="btn-icon btn-send"
                                      title="Send Estimate"
                                    >
                                      �
                                    </button>
                                  )}
                                </>
                              )}
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

      {/* Create Estimate Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal estimate-modal">
            <div className="modal-header">
              <h3>Create New Estimate</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateEstimate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer *</label>
                    <div className="select-with-create">
                      <select
                        value={newEstimate.customer}
                        onChange={(e) => setNewEstimate({ ...newEstimate, customer: e.target.value })}
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name || 'Unknown'} - {customer.phone || 'No phone'}
                          </option>
                        ))}
                      </select>
                      {customers.length === 0 && (
                        <button
                          type="button"
                          onClick={() => console.log('Create customer - functionality moved to separate page')}
                          className="btn btn-sm btn-primary"
                          style={{ marginLeft: '10px' }}
                        >
                          + Create Customer
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Valid Till *</label>
                    <input
                      type="date"
                      value={newEstimate.validTill}
                      onChange={(e) => setNewEstimate({ ...newEstimate, validTill: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="items-section">
                  <h4>Items</h4>
                  {(newEstimate.items || []).map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-select-group">
                        <select
                          value={item.item}
                          onChange={(e) => handleItemChange(index, 'item', e.target.value, true)}
                          required
                        >
                          <option value="">Select Item</option>
                          {items.map(itemOption => (
                            <option key={itemOption._id} value={itemOption._id}>
                              {itemOption.name} - {itemOption.category}
                            </option>
                          ))}
                        </select>
                        {items.length === 0 && index === 0 && (
                          <button
                            type="button"
                            onClick={() => console.log('Create item - functionality moved to separate page')}
                            className="btn btn-sm btn-primary"
                            style={{ marginLeft: '5px' }}
                          >
                            + Create Item
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value), true)}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value), true)}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Total"
                        value={item.total}
                        readOnly
                      />
                      {newEstimate.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index, true)}
                          className="btn-icon btn-delete"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    + Add Item
                  </button>
                </div>

                {/* Calculations Section */}
                <div className="calculations-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount</label>
                      <div className="discount-group">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newEstimate.discount}
                          onChange={(e) => setNewEstimate({ ...newEstimate, discount: Number(e.target.value) })}
                        />
                        <select
                          value={newEstimate.discountType}
                          onChange={(e) => setNewEstimate({ ...newEstimate, discountType: e.target.value })}
                        >
                          <option value="percentage">%</option>
                          <option value="amount">₹</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Loading Charges</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newEstimate.loadingCharges}
                        onChange={(e) => setNewEstimate({ ...newEstimate, loadingCharges: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={newEstimate.notes}
                    onChange={(e) => setNewEstimate({ ...newEstimate, notes: e.target.value })}
                    rows="3"
                    placeholder="Additional notes or terms..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit and View Modals would go here - similar structure to Create Modal */}
      {/* For brevity, I'll implement them in the next part if needed */}
    </div>
  );
};

export default Estimates;
