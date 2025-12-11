// src/pages/OrderHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import '../styles/OrderHistory.css';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const data = await orderService.getAllOrders(); 
      // backend returns: { id, createdAt, totalPrice, items[], status }

      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders(sorted);
      setError(null);
    } catch (err) {
      setError('Failed to load orders.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing':
        return 'status-badge status-processing';
      case 'in_transit':
      case 'in transit':
        return 'status-badge status-in-transit';
      case 'delivered':
        return 'status-badge status-delivered';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (str) => {
    if (!str) return '-';
    const date = new Date(str);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading">Loading your orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="empty-state">
          <h2>No Orders Yet</h2>
          <p>You haven’t placed any orders yet.</p>
          <button onClick={() => navigate('/products')} className="shop-button">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Order History</h1>
        <p className="subtitle">View all your orders</p>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card"
            onClick={() => handleOrderClick(order.id)}
          >
            <div className="order-card-header">
              <div className="order-info">
                <h3 className="order-number">Order #{order.id}</h3>
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>

              <span className={getStatusBadgeClass(order.status)}>
                {order.status || 'Processing'}
              </span>
            </div>

            <div className="order-card-body">
              <div className="order-items-preview">
                <p className="items-count">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>

                <div className="item-names">
                  {order.items.map((item, index) => (
                    <span key={item.id || index}>
                      Product #{item.productId}
                      {index < order.items.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>

              <div className="order-total">
                <span className="total-label">Total:</span>
                <span className="total-amount">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>

            <div className="order-card-footer">
              <button className="view-details-button">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
