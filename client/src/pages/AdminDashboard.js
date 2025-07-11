import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Admin Dashboard</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="dashboard-card">
                <h5>User Management</h5>
                <p>Approve pending trader and admin registrations</p>
                <Link to="/user-approvals" className="btn btn-primary">
                  Manage User Approvals
                </Link>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="dashboard-card">
                <h5>System Overview</h5>
                <p>View system statistics and reports</p>
                <button className="btn btn-secondary" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
