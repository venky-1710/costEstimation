import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import { FiFileText, FiUsers, FiPackage, FiTrendingUp, FiDollarSign, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes, topCustomersRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentEstimates(),
        dashboardAPI.getTopCustomers()
      ]);

      setStats(statsRes.data);
      setRecentEstimates(recentRes.data);
      setTopCustomers(topCustomersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome back, {user.name}!
        </h1>
        <p className="dashboard-subtitle">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <FiFileText style={{ color: '#1976d2' }} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalEstimates || 0}</h3>
            <p>Total Estimates</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e8' }}>
            <FiTrendingUp style={{ color: '#4caf50' }} />
          </div>
          <div className="stat-content">
            <h3>{stats.thisMonthEstimates || 0}</h3>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <FiDollarSign style={{ color: '#ff9800' }} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.thisMonthValue || 0)}</h3>
            <p>Month Value</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <FiUsers style={{ color: '#9c27b0' }} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalCustomers || 0}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2f1' }}>
            <FiPackage style={{ color: '#009688' }} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalItems || 0}</h3>
            <p>Total Items</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ffebee' }}>
            <FiClock style={{ color: '#f44336' }} />
          </div>
          <div className="stat-content">
            <h3>{stats.conversionRate || 0}%</h3>
            <p>Conversion Rate</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Recent Estimates */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Estimates</h3>
            <Link to="/estimates" className="btn btn-outline-primary btn-sm">
              View All
            </Link>
          </div>
          <div className="card-body">
            {recentEstimates.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estimate #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEstimates && recentEstimates.map((estimate) => (
                      <tr key={estimate._id}>
                        <td>
                          <Link 
                            to={`/estimates/view/${estimate._id}`}
                            style={{ textDecoration: 'none', color: '#1976d2' }}
                          >
                            {estimate.estimateNumber}
                          </Link>
                        </td>
                        <td>{estimate.customer?.name || 'Unknown Customer'}</td>
                        <td>{formatCurrency(estimate.total)}</td>
                        <td>
                          <span 
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: 
                                estimate.status === 'converted' ? '#e8f5e8' :
                                estimate.status === 'sent' ? '#fff3e0' :
                                estimate.status === 'viewed' ? '#e3f2fd' : '#f5f5f5',
                              color:
                                estimate.status === 'converted' ? '#4caf50' :
                                estimate.status === 'sent' ? '#ff9800' :
                                estimate.status === 'viewed' ? '#1976d2' : '#666'
                            }}
                          >
                            {estimate.status}
                          </span>
                        </td>
                        <td>{formatDate(estimate.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No estimates found</p>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Customers</h3>
          </div>
          <div className="card-body">
            {topCustomers && topCustomers.length > 0 ? (
              <div>
                {topCustomers.map((customer, index) => (
                  <div 
                    key={customer._id || index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < topCustomers.length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>{customer?.name || 'Unknown Customer'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {customer.estimateCount} estimates
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {formatCurrency(customer.totalValue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No customer data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(user.role === 'trader' || user.role === 'admin') && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/estimates/new" className="btn btn-primary">
                Create New Estimate
              </Link>
              <Link to="/customers" className="btn btn-outline-primary">
                Manage Customers
              </Link>
              <Link to="/items" className="btn btn-outline-primary">
                Manage Items
              </Link>
              <Link to="/brands" className="btn btn-outline-primary">
                Manage Brands
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
