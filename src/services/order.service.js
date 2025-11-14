// src/services/order.service.js
import api from './api';

export const orderService = {
  // Tüm siparişleri getir
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data.data;  // response.data yerine response.data.data
  },

  // Tek bir siparişin detayını getir
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;  // response.data yerine response.data.data
  }
};