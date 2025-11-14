// src/pages/OrderDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import '../styles/OrderDetail.css';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(id);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError('Order not found or failed to load.');
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/orders')} className="back-button">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <button onClick={() => navigate('/orders')} className="back-link">
        ← Back to Orders
      </button>

      <div className="order-detail-header">
        <div className="header-content">
          <h1>Order Details</h1>
          <span className={getStatusBadgeClass(order.status)}>
            {order.status}
          </span>
        </div>
        <div className="order-meta">
          <p className="order-number">Order #{order.orderNumber}</p>
          <p className="order-date">Placed on {formatDate(order.date)}</p>
        </div>
      </div>

      <div className="order-detail-content">
        {/* Order Items */}
        <div className="detail-section">
          <h2>Order Items</h2>
          <div className="items-list">
            {order.items.map((item) => (
              <div key={item.id} className="order-item">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="item-image"
                />
                <div className="item-info">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-quantity">Quantity: {item.quantity}</p>
                </div>
                <div className="item-price">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="detail-section">
          <h2>Shipping Address</h2>
          <div className="address-box">
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="detail-section">
          <h2>Order Summary</h2>
          <div className="summary-box">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="detail-section">
          <h2>Order Status</h2>
          <div className="status-timeline">
            <div className={`timeline-item ${order.status === 'Processing' || order.status === 'In Transit' || order.status === 'Delivered' ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Order Placed</h4>
                <p>Your order has been received</p>
              </div>
            </div>
            <div className={`timeline-item ${order.status === 'In Transit' || order.status === 'Delivered' ? 'completed' : order.status === 'Processing' ? 'active' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Processing</h4>
                <p>Your order is being prepared</p>
              </div>
            </div>
            <div className={`timeline-item ${order.status === 'Delivered' ? 'completed' : order.status === 'In Transit' ? 'active' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>In Transit</h4>
                <p>Your order is on the way</p>
              </div>
            </div>
            <div className={`timeline-item ${order.status === 'Delivered' ? 'completed active' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Delivered</h4>
                <p>Your order has been delivered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}