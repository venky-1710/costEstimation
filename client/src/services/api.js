import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Auth API
export const authAPI = {
  login: (credentials) => axios.post(`${API_BASE_URL}/auth/login`, credentials),
  register: (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData),
  registerCustomer: (customerData) => axios.post(`${API_BASE_URL}/auth/register-customer`, customerData),
  getMe: () => axios.get(`${API_BASE_URL}/auth/me`),
  updateProfile: (data) => axios.put(`${API_BASE_URL}/auth/profile`, data),
  updateTags: (tags) => axios.put(`${API_BASE_URL}/auth/tags`, { tags }),
  changePassword: (data) => axios.put(`${API_BASE_URL}/auth/change-password`, data)
};

// Users API
export const usersAPI = {
  getAll: (params) => axios.get(`${API_BASE_URL}/users`, { params }),
  getTraders: () => axios.get(`${API_BASE_URL}/users/traders`),
  update: (id, data) => axios.put(`${API_BASE_URL}/users/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/users/${id}`)
};

// Customers API
export const customersAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/customers`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/customers`, { params }),
  getForEstimate: (params) => axios.get(`${API_BASE_URL}/customers/for-estimate`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/customers/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/customers/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/customers/${id}`),
  searchByPhone: (phone) => axios.get(`${API_BASE_URL}/customers/search/phone/${phone}`)
};

// Brands API
export const brandsAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/brands`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/brands`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/brands/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/brands/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/brands/${id}`)
};

// Items API
export const itemsAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/items`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/items`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/items/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/items/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/items/${id}`),
  getCategories: () => axios.get(`${API_BASE_URL}/items/categories`)
};

// Estimates API
export const estimatesAPI = {
  create: (data) => axios.post(`${API_BASE_URL}/estimates`, data),
  getAll: (params) => axios.get(`${API_BASE_URL}/estimates`, { params }),
  getMyEstimates: (params) => axios.get(`${API_BASE_URL}/estimates/my-estimates`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/estimates/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/estimates/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/estimates/${id}`),
  getByCustomer: (customerId, params) => 
    axios.get(`${API_BASE_URL}/estimates/customer/${customerId}`, { params }),
  searchByItem: (itemId) => 
    axios.get(`${API_BASE_URL}/estimates/search/item/${itemId}`),
  markAsSent: (id, sentVia) => 
    axios.put(`${API_BASE_URL}/estimates/${id}/send`, { sentVia })
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => axios.get(`${API_BASE_URL}/dashboard/stats`),
  getRecentEstimates: () => axios.get(`${API_BASE_URL}/dashboard/recent-estimates`),
  getTopCustomers: () => axios.get(`${API_BASE_URL}/dashboard/top-customers`),
  getMonthlyStats: () => axios.get(`${API_BASE_URL}/dashboard/monthly-stats`),
  getAdminStats: () => axios.get(`${API_BASE_URL}/dashboard/admin-stats`)
};
