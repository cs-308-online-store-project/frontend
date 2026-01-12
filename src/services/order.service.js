// src/services/order.service.js
import api from './api';

export const orderService = {
  // Tüm siparişleri getir
  getAllOrders: async () => {
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const isManager =
      user?.role === 'product_manager' || user?.role === 'sales_manager';
    const endpoints = isManager
      ? ['/orders/all', '/admin/orders', '/orders']
      : ['/orders', '/orders/all', '/admin/orders'];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        const payload = response.data?.data ?? response.data;
        const list =
          payload?.orders ||
          payload?.items ||
          payload?.data ||
          (Array.isArray(payload) ? payload : []);

        if (Array.isArray(list) && list.length) {
          return list;
        }

        if (endpoint === endpoints[endpoints.length - 1]) {
          return Array.isArray(list) ? list : [];
        }
      } catch (error) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    return [];
  },

  // Sipariş kalemlerini getir
  getAllOrderItems: async () => {
    const response = await api.get('/order_items');
    return response.data.data ?? response.data?.data ?? response.data;
  },

  // Tek bir siparişin detayını getir
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;  // response.data yerine response.data.data
  },

  // Sipariş durumunu güncelle
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }
};