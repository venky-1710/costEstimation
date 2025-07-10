import React, { useState, useEffect, useCallback } from 'react';
import { estimatesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingEstimate, setViewingEstimate] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const itemsPerPage = 10;

  const fetchMyEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter
      };

      const response = await estimatesAPI.getMyEstimates(params);
      setEstimates(response.data.estimates || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      toast.error('Failed to fetch estimates');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchMyEstimates();
  }, [fetchMyEstimates]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-secondary';
      case 'sent': return 'badge-primary';
      case 'viewed': return 'badge-info';
      case 'converted': return 'badge-success';
      case 'expired': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const handleViewEstimate = (estimate) => {
    setViewingEstimate(estimate);
    setShowViewModal(true);
  };

  const downloadEstimatePDF = async (estimate) => {
    // Implementation similar to the one in Estimates.js
    toast.success('PDF download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="spinner"></div>
              <p>Loading your estimates...</p>
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
          <h2 className="card-title">My Estimates & Invoices</h2>
          <div className="header-actions">
            <p className="user-welcome">Welcome, {user?.name}</p>
          </div>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="filters-section">
            <div className="form-group">
              <label>Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="converted">Converted</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{estimates.length}</h3>
              <p>Total Estimates</p>
            </div>
            <div className="stat-card">
              <h3>{estimates.filter(e => e.status === 'sent').length}</h3>
              <p>Pending Review</p>
            </div>
            <div className="stat-card">
              <h3>{estimates.filter(e => e.status === 'converted').length}</h3>
              <p>Converted</p>
            </div>
            <div className="stat-card">
              <h3>₹{estimates.reduce((sum, e) => sum + (e.total || 0), 0).toLocaleString()}</h3>
              <p>Total Value</p>
            </div>
          </div>

          {/* Estimates Table */}
          <div className="table-container">
            {estimates.length === 0 ? (
              <div className="no-data">
                <p>No estimates found.</p>
                <p>Contact your vendor to get started with estimates.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Estimate #</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Valid Till</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate) => (
                    <tr key={estimate._id}>
                      <td>
                        <strong>{estimate.estimateNumber}</strong>
                      </td>
                      <td>
                        <div className="vendor-info">
                          <div className="vendor-name">
                            {estimate.traderId?.traderProfile?.businessName || estimate.traderId?.name}
                          </div>
                          {estimate.traderId?.phone && (
                            <div className="vendor-contact">{estimate.traderId.phone}</div>
                          )}
                        </div>
                      </td>
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
                            className="btn btn-outline-primary btn-sm"
                            title="View Details"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => downloadEstimatePDF(estimate)}
                            className="btn btn-outline-secondary btn-sm"
                            title="Download PDF"
                          >
                            📄 PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline-primary"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-outline-primary"
              >
                Next
              </button>
            </div>
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
                    <p><strong>Vendor:</strong> {viewingEstimate.traderId?.traderProfile?.businessName || viewingEstimate.traderId?.name}</p>
                    <p><strong>Contact:</strong> {viewingEstimate.traderId?.phone} | {viewingEstimate.traderId?.email}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${getStatusBadgeClass(viewingEstimate.status)}`}>
                        {viewingEstimate.status?.toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Valid Till:</strong> {formatDate(viewingEstimate.validTill)}</p>
                    <p><strong>Created:</strong> {formatDate(viewingEstimate.createdAt)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="items-section">
                  <h4>Items</h4>
                  <table className="items-table">
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
                          <td>{item.item?.name || 'Unknown Item'}</td>
                          <td>{item.quantity} {item.item?.uom}</td>
                          <td>₹{item.rate?.toLocaleString()}</td>
                          <td>₹{item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="totals-section">
                  <div className="totals-row">
                    <span>Subtotal:</span>
                    <span>₹{viewingEstimate.subtotal?.toLocaleString()}</span>
                  </div>
                  {viewingEstimate.discount > 0 && (
                    <div className="totals-row">
                      <span>Discount:</span>
                      <span>-₹{((viewingEstimate.subtotal * viewingEstimate.discount) / 100).toLocaleString()}</span>
                    </div>
                  )}
                  {viewingEstimate.loadingCharges > 0 && (
                    <div className="totals-row">
                      <span>Loading Charges:</span>
                      <span>₹{viewingEstimate.loadingCharges?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="totals-row total-row">
                    <span><strong>Total:</strong></span>
                    <span><strong>₹{viewingEstimate.total?.toLocaleString()}</strong></span>
                  </div>
                </div>

                {viewingEstimate.notes && (
                  <div className="notes-section">
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

export default CustomerDashboard;
