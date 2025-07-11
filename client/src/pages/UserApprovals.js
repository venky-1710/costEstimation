import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const { token } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, action) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      let endpoint, data = {};
      
      if (action === 'approve') {
        endpoint = `${API_BASE_URL}/auth/approve-user/${userId}`;
      } else {
        endpoint = `${API_BASE_URL}/auth/reject-user/${userId}`;
        data = { rejectionReason: rejectionReasons[userId] || 'No reason provided' };
      }

      await axios.put(endpoint, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove the user from the pending list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      
      // Clear rejection reason
      setRejectionReasons(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      alert(`User ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Error ${action}ing user: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const handleRejectionReasonChange = (userId, reason) => {
    setRejectionReasons(prev => ({
      ...prev,
      [userId]: reason
    }));
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="card">
          <div className="card-body">
            <p>Loading pending approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Approvals</h2>
          <p className="card-subtitle">Manage pending trader and admin registrations</p>
        </div>
        <div className="card-body">
          {pendingUsers.length === 0 ? (
            <p>No pending approvals at this time.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Business Info</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {user.role === 'trader' && user.traderProfile ? (
                          <div>
                            <strong>{user.traderProfile.businessName}</strong>
                            {user.traderProfile.businessAddress && (
                              <div className="small text-muted">
                                {user.traderProfile.businessAddress}
                              </div>
                            )}
                            {user.traderProfile.gstNumber && (
                              <div className="small">GST: {user.traderProfile.gstNumber}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="approval-actions">
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleApproval(user._id, 'approve')}
                            disabled={actionLoading[user._id]}
                          >
                            {actionLoading[user._id] ? 'Processing...' : 'Approve'}
                          </button>
                          
                          <div className="rejection-section">
                            <input
                              type="text"
                              placeholder="Rejection reason (optional)"
                              value={rejectionReasons[user._id] || ''}
                              onChange={(e) => handleRejectionReasonChange(user._id, e.target.value)}
                              className="form-control form-control-sm mb-1"
                              style={{ minWidth: '200px' }}
                            />
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleApproval(user._id, 'reject')}
                              disabled={actionLoading[user._id]}
                            >
                              {actionLoading[user._id] ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserApprovals;
