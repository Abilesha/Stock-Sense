/**
 * API client interacting with the Node.js + Express backend.
 * Provides meaningful error propagation.
 */

const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('stocksense_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data?.error?.code;
      err.details = data?.error?.details;
      throw err;
    }

    return data;
  } catch (err) {
    // If unauthorized and session expired, clear token
    if (err.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('stocksense_token');
      localStorage.removeItem('stocksense_user');
      window.dispatchEvent(new Event('auth_change'));
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  getMe: () => apiRequest('/auth/me'),

  // Dashboard
  getDashboard: (params = '') => apiRequest(`/dashboard/summary${params}`),

  // Products
  getProducts: (params = '') => apiRequest(`/products${params}`),
  getProduct: (id) => apiRequest(`/products/${id}`),
  createProduct: (data) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),

  // Operations
  getOperations: (params = '') => apiRequest(`/operations${params}`),
  getOperation: (id) => apiRequest(`/operations/${id}`),
  createOperation: (data) => apiRequest('/operations', { method: 'POST', body: JSON.stringify(data) }),
  updateOperation: (id, data) => apiRequest(`/operations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  validateOperation: (id) => apiRequest(`/operations/${id}/validate`, { method: 'POST' }),
  cancelOperation: (id) => apiRequest(`/operations/${id}/cancel`, { method: 'POST' }),

  // Move History / Stock Ledger
  getMoveHistory: (params = '') => apiRequest(`/move-history${params}`),

  // Warehouses & Locations
  getWarehouses: () => apiRequest('/settings/warehouses'),
  createWarehouse: (data) => apiRequest('/settings/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => apiRequest(`/settings/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLocations: (params = '') => apiRequest(`/settings/locations${params}`),
  createLocation: (data) => apiRequest('/settings/locations', { method: 'POST', body: JSON.stringify(data) }),
  updateLocation: (id, data) => apiRequest(`/settings/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users & Roles
  getUsers: () => apiRequest('/settings/users'),
  createUser: (data) => apiRequest('/settings/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserRole: (id, role) => apiRequest(`/settings/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Partners (Vendors/Customers)
  getPartners: (params = '') => apiRequest(`/partners${params}`),
  createPartner: (data) => apiRequest('/partners', { method: 'POST', body: JSON.stringify(data) }),
};
