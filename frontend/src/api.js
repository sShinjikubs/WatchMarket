// Centralized API fetch helper
const BASE = '';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res;
}

export const api = {
  // Auth
  login: (role, username, password) =>
    request('POST', '/api/auth/login', { role, username, password }),
  register: (data) => request('POST', '/api/auth/register', data),
  getProfile: (username) => request('GET', `/api/auth/profile/${username}`),
  saveProfile: (username, data) =>
    request('POST', `/api/auth/profile/${username}`, data),

  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/api/products${q ? `?${q}` : ''}`);
  },
  addProduct: (data) => request('POST', '/api/products', data),
  updateProduct: (id, data) => request('PUT', `/api/products/${id}`, data),
  deleteProduct: (id) => request('DELETE', `/api/products/${id}`),

  // Orders
  getOrders: () => request('GET', '/api/orders'),
  createOrder: (data) => request('POST', '/api/orders', data),
  cancelOrder: (id) => request('POST', `/api/orders/${id}/cancel`),
  shipOrder: (id) => request('POST', `/api/orders/${id}/ship`),

  // Pending Watches
  getPendingWatches: () => request('GET', '/api/pending-watches'),
  registerSeller: (data) =>
    request('POST', '/api/pending-watches/register-seller', data),
  proposWatch: (data) => request('POST', '/api/pending-watches', data),
  inspectWatch: (id, result) =>
    request('POST', '/api/pending-watches/inspect', { id, result }),
  importWatch: (id) =>
    request('POST', '/api/pending-watches/import', { id }),

  // Blacklist & Logs
  getBlacklist: () => request('GET', '/api/blacklist'),
  getLogs: () => request('GET', '/api/logs'),
  addLog: (message) => request('POST', '/api/logs', { message }),

  // Reviews
  getReviews: (productId) => request('GET', `/api/reviews/${productId}`),
  addReview: (data) => request('POST', '/api/reviews', data),

  // Admin User Management
  getUsers: () => request('GET', '/api/admin/users'),
  updateUser: (username, data) => request('PUT', `/api/admin/users/${username}`, data),
  deleteUser: (username) => request('DELETE', `/api/admin/users/${username}`),
};
