import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut, FiHome, FiUsers, FiPackage, FiFileText, FiTool, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    if (user.role === 'customer') {
      return [
        { path: '/customer-dashboard', label: 'My Estimates', icon: FiFileText },
        { path: '/profile', label: 'Profile', icon: FiUser }
      ];
    }

    const commonItems = [
      { path: '/dashboard', label: 'Dashboard', icon: FiHome },
      { path: '/estimates', label: 'Estimates', icon: FiFileText },
      { path: '/profile', label: 'Profile', icon: FiUser }
    ];

    if (user.role === 'admin') {
      return [
        { path: '/admin', label: 'Admin Dashboard', icon: FiSettings },
        { path: '/users', label: 'Users', icon: FiUsers },
        ...commonItems
      ];
    }

    if (user.role === 'trader') {
      return [
        ...commonItems,
        { path: '/customers', label: 'Customers', icon: FiUsers },
        { path: '/brands', label: 'Brands', icon: FiTool },
        { path: '/items', label: 'Items', icon: FiPackage }
      ];
    }

    return commonItems;
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to={user.role === 'customer' ? '/customer-dashboard' : '/dashboard'} className="navbar-brand">
          Cost Estimation
        </Link>
        
        <ul className="navbar-nav">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button 
            onClick={logout} 
            className="btn btn-secondary btn-sm"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
