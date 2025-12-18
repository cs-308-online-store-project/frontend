import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Products API
export const productsAPI = {
  // ⬇⬇⬇ **DÜZENLENEN TEK SATIR** ⬇⬇⬇
  getAll: (query = "") => api.get(`/products${query}`),

  getById: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateQuantity: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
};

// Order API
export const orderAPI = {
  createOrder: (userId, address) => api.post('/orders', { userId, address }),
  getOrders: () => api.get('/orders'),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),

  // Invoice endpoints
  generateInvoice: (orderId) => api.post(`/invoices/${orderId}/generate`),
  downloadInvoice: (orderId) => api.get(`/invoices/${orderId}/download`, { responseType: 'blob' }),
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId) => api.get('/reviews', { params: { productId } }),
  create: (payload) => api.post('/reviews', payload),
  getAll: () => api.get('/reviews'),
  updateStatus: (reviewId, approved) => api.put(`/reviews/${reviewId}/status`, { approved }),
};
// Wishlist API
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  getCount: () => api.get('/wishlist/count'),
  addToWishlist: (productId) => api.post('/wishlist/add', { product_id: productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`),
};
export default api;
