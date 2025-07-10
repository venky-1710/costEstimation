import React, { useState, useEffect, useCallback } from 'react';
import { estimatesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    try {
      // Create a temporary div to render the PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '20px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      
      // Generate PDF content HTML
      pdfContent.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">Cost Estimation</h1>
            <p style="margin: 5px 0; color: #666; font-size: 16px;">Professional Service Quote</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">Estimate Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 30%;">Estimate ID:</td>
                <td style="padding: 8px 0;">#${estimate._id.slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Project Title:</td>
                <td style="padding: 8px 0;">${estimate.title || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Description:</td>
                <td style="padding: 8px 0;">${estimate.description || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${estimate.status}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Created Date:</td>
                <td style="padding: 8px 0;">${formatDate(estimate.createdAt)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">Cost Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${estimate.items && estimate.items.length > 0 ? 
                  estimate.items.map(item => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.total ? item.total.toFixed(2) : '0.00'}</td>
                    </tr>
                  `).join('') :
                  '<tr><td colspan="4" style="padding: 20px; text-align: center; border: 1px solid #ddd; color: #666;">No items available</td></tr>'
                }
              </tbody>
            </table>
          </div>

          <div style="text-align: right; margin-top: 25px; padding-top: 20px; border-top: 2px solid #333;">
            <div style="display: inline-block; text-align: left;">
              <p style="margin: 5px 0; font-size: 16px;"><strong>Subtotal: $${estimate.subtotal ? estimate.subtotal.toFixed(2) : '0.00'}</strong></p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>Tax: $${estimate.tax ? estimate.tax.toFixed(2) : '0.00'}</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 20px; color: #333;"><strong>Total Amount: $${estimate.total ? estimate.total.toFixed(2) : '0.00'}</strong></p>
            </div>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
            <p>This is a computer-generated estimate. Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      `;
      
      // Append to body temporarily
      document.body.appendChild(pdfContent);
      
      // Convert to canvas and then PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary element
      document.body.removeChild(pdfContent);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      const fileName = `estimate-${estimate._id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
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
