import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerRegister from './pages/CustomerRegister';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Customers from './pages/Customers';
import Brands from './pages/Brands';
import Items from './pages/Items';
import Estimates from './pages/Estimates';
import EstimateForm from './pages/EstimateForm';
import EstimateView from './pages/EstimateView';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import UserApprovals from './pages/UserApprovals';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'customer') {
      return <Navigate to="/customer-dashboard" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (user) {
    // Redirect based on user role
    if (user.role === 'customer') {
      return <Navigate to="/customer-dashboard" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  
  const redirectPath = user?.role === 'customer' ? '/customer-dashboard' :
                      user?.role === 'admin' ? '/admin' : '/dashboard';
  
  return <Navigate to={redirectPath} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register-customer" 
                element={
                  <PublicRoute>
                    <CustomerRegister />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user-approvals" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserApprovals />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute allowedRoles={['trader', 'admin']}>
                    <Customers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/brands" 
                element={
                  <ProtectedRoute allowedRoles={['trader', 'admin']}>
                    <Brands />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/items" 
                element={
                  <ProtectedRoute allowedRoles={['trader', 'admin']}>
                    <Items />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estimates" 
                element={
                  <ProtectedRoute>
                    <Estimates />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estimates/new" 
                element={
                  <ProtectedRoute allowedRoles={['trader', 'admin']}>
                    <EstimateForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estimates/edit/:id" 
                element={
                  <ProtectedRoute allowedRoles={['trader', 'admin']}>
                    <EstimateForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estimates/view/:id" 
                element={
                  <ProtectedRoute>
                    <EstimateView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={
                <ProtectedRoute>
                  <HomeRedirect />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
