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

  // ==============================
  // GET ORDERS + SORT BY NEWEST
  // ==============================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();

     
      const sorted = [...data].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setOrders(sorted);
      setError(null);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // STYLING HELPERS
  // ==============================
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Processing':
        return 'status-badge status-processing';
      case 'In Transit':
        return 'status-badge status-in-transit';
      case 'Delivered':
        return 'status-badge status-delivered';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => `$${price.toFixed(2)}`;

  // ==============================
  // NAVIGATE TO ORDER DETAILS
  // ==============================
  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // ==============================
  // UI STATES
  // ==============================
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
          <button onClick={fetchOrders} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="empty-state">
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate('/products')} className="shop-button">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // MAIN RENDER
  // ==============================
  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Order History</h1>
        <p className="subtitle">View and track your orders</p>
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
                <h3 className="order-number">{order.orderNumber}</h3>
                <p className="order-date">{formatDate(order.date)}</p>
              </div>

              <span className={getStatusBadgeClass(order.status)}>
                {order.status}
              </span>
            </div>

            <div className="order-card-body">
              <div className="order-items-preview">
                <p className="items-count">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
                <div className="item-names">
                  {order.items.map((item, index) => (
                    <span key={item.id}>
                      {item.name}
                      {index < order.items.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>

              <div className="order-total">
                <span className="total-label">Total:</span>
                <span className="total-amount">{formatPrice(order.total)}</span>
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
