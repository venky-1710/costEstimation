import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { estimatesAPI, customersAPI, itemsAPI } from '../services/api';
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

  const handleDeleteEstimate = async (id, estimateNumber) => {
    if (window.confirm(`Are you sure you want to delete estimate ${estimateNumber}?`)) {
      try {
        await estimatesAPI.delete(id);
        toast.success('Estimate deleted successfully');
        fetchEstimates();
      } catch (error) {
        console.error('Error deleting estimate:', error);
        toast.error(error.response?.data?.message || 'Failed to delete estimate');
      }
    }
  };

  const handleViewEstimate = (estimate) => {
    setViewingEstimate(estimate);
    setShowViewModal(true);
  };

  const handleMarkAsSent = async (id, method) => {
    try {
      await estimatesAPI.markAsSent(id, { method });
      toast.success(`Estimate marked as sent via ${method}`);
      fetchEstimates();
    } catch (error) {
      console.error('Error marking estimate as sent:', error);
      toast.error(error.response?.data?.message || 'Failed to mark estimate as sent');
    }
  };

  // Helper functions
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

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-secondary';
      case 'sent': return 'badge-info';
      case 'viewed': return 'badge-warning';
      case 'converted': return 'badge-success';
      case 'expired': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const handlePagination = (page) => {
    setCurrentPage(page);
  };

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
                                    🗑️
                                  </button>
                                  {estimate.status === 'draft' && (
                                    <button
                                      onClick={() => handleMarkAsSent(estimate._id, 'email')}
                                      className="btn-icon btn-send"
                                      title="Send Estimate"
                                    >
                                      📧
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
                    onClick={() => handlePagination(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePagination(currentPage + 1)}
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

      {/* View Modal */}
      {showViewModal && viewingEstimate && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>Estimate Details - {viewingEstimate.estimateNumber}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="estimate-view">
                <div className="estimate-header">
                  <div className="estimate-info">
                    <p><strong>Customer:</strong> {getCustomerName(viewingEstimate.customer)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${getStatusBadgeClass(viewingEstimate.status)}`}>
                        {viewingEstimate.status?.toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Valid Till:</strong> {formatDate(viewingEstimate.validTill)}</p>
                    <p><strong>Created:</strong> {formatDate(viewingEstimate.createdAt)}</p>
                  </div>
                </div>
                
                <div className="items-table">
                  <h4>Items</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingEstimate.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{getItemName(item.item)}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.rate?.toLocaleString()}</td>
                          <td>₹{item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="estimate-totals">
                  <div className="totals-row">
                    <span>Subtotal:</span>
                    <span>₹{viewingEstimate.subtotal?.toLocaleString()}</span>
                  </div>
                  {viewingEstimate.discount > 0 && (
                    <div className="totals-row">
                      <span>Discount:</span>
                      <span>-₹{viewingEstimate.discountAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  {viewingEstimate.loadingCharges > 0 && (
                    <div className="totals-row">
                      <span>Loading Charges:</span>
                      <span>₹{viewingEstimate.loadingCharges?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="totals-row total-row">
                    <span>Total:</span>
                    <span>₹{viewingEstimate.total?.toLocaleString()}</span>
                  </div>
                </div>

                {viewingEstimate.notes && (
                  <div className="estimate-notes">
                    <h4>Notes</h4>
                    <p>{viewingEstimate.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimates;
