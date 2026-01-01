// src/pages/OrderDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { refundAPI } from '../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [refunds, setRefunds] = useState([]);

  /* ================= FIX: FUNCTION FIRST ================= */
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(id);
      setOrder(response.data.data);
      setError(null);
    } catch (err) {
      setError('Order not found or failed to load.');
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  useEffect(() => {
    const fetchMyRefunds = async () => {
      try {
        const res = await refundAPI.getMyRefunds(); // GET /api/refunds/my
        setRefunds(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch refunds", err);
      }
    };

    fetchMyRefunds();
  }, []);

  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      await orderAPI.generateInvoice(id);
      alert('Invoice has been sent to your email! 📧');
    } catch (err) {
      alert('Failed to send invoice: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitRefund = async (item) => {
  try {
    const res = await refundAPI.create({
      orderId: order.id,
      orderItemId: item.id,
      reason: 'Damaged item',
      quantity: item.quantity
    });

    // Backend refund oluşturduysa
    setRefunds((prev) => [res.data.data, ...prev]);
    alert('Refund request submitted successfully!');
  } catch (err) {
    const message = err.response?.data?.error;

    // 🔑 Refund zaten varsa → UI’ı pending’e çek
    if (message?.includes('already exists')) {
      setRefunds((prev) => [
        {
          order_item_id: item.id, // JSX bunu arıyor
          status: 'pending'
        },
        ...prev
      ]);
      return;
    }

    alert(message || 'Refund request failed');
  }
};


  const isRefundWindowValid = (createdAt) => {
    const orderDate = new Date(createdAt);
    const now = new Date();

    const diffInDays =
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    return diffInDays <= 30;
  };

  const canRefund =
    order?.status === 'delivered' &&
    order?.createdAt &&
    isRefundWindowValid(order.createdAt);

 const getRefundForItem = (orderItemId) =>
  refunds.find(
    (r) =>
      r.order_item_id === orderItemId ||
      r.orderItemId === orderItemId
  );

  const getStatusBadge = (status) => {
    const colors = {
      processing: '#f59e0b',
      in_transit: '#3b82f6',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#6b7280'
    };
    return {
      background: colors[status] || '#6b7280',
      color: 'white',
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      fontWeight: '600'
    };
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

  if (loading) {
    return (
      <div style={S.page}>
        <p style={S.loading}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={S.page}>
        <div style={S.error}>
          <p>{error}</p>
          <button onClick={() => navigate('/orders')} style={S.button}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <button onClick={() => navigate('/orders')} style={S.backLink}>
        ← Back to Orders
      </button>

      <div style={S.header}>
        <div style={S.headerTop}>
          <h1 style={S.title}>Order #{order.id}</h1>
          <span style={getStatusBadge(order.status)}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <p style={S.date}>Placed on {formatDate(order.createdAt)}</p>
      </div>

      <div style={S.content}>
        {/* Order Items */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Order Items</h2>
          <div style={S.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} style={S.item}>
                <div style={S.itemPlaceholder}>📦</div>
                <div style={S.itemInfo}>
                  <h3 style={S.itemName}>Product ID: {item.productId}</h3>
                  <p style={S.itemQty}>Quantity: {item.quantity}</p>
                  <p style={S.itemPrice}>${item.unitPrice.toFixed(2)} each</p>

                  {/* REFUND SECTION */}
                  {order.status === 'delivered' && (() => {
                    const existingRefund = getRefundForItem(item.id);

                    if (existingRefund) {
                      if (existingRefund.status === "pending") {
                        return (
                          <button
                            disabled
                            style={{
                              marginTop: '0.6rem',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid #999',
                              background: '#f3f4f6',
                              color: '#111',
                              fontSize: '0.85rem',
                              cursor: 'not-allowed'
                            }}
                          >
                            Pending sales manager approval
                          </button>
                        );
                      }

                      return (
                        <p style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          Refund {existingRefund.status}.
                        </p>
                      );
                    }

                    if (canRefund) {
                      return (
                        <button
                          onClick={() => handleSubmitRefund(item)}
                          style={{
                            marginTop: '0.6rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            background: 'white',
                            color: '#ef4444',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          Submit Refund Request
                        </button>
                      );
                    }

                    return (
                      <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        ⛔ No longer eligible for refund (30-day period expired)
                      </p>
                    );
                  })()}
                </div>

                <div style={S.itemTotal}>
                  ${item.totalPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Shipping Address</h2>
          <div style={S.addressBox}>
            <p>{order.address}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Order Summary</h2>
          <div style={S.summaryBox}>
            <div style={S.summaryRow}>
              <span>Total</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                ${order.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={S.invoiceButtons}>
            <button
              onClick={handleGenerateInvoice}
              disabled={generating}
              style={{
                ...S.generateBtn,
                opacity: generating ? 0.6 : 1,
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              {generating ? '⏳ Generating...' : '📄 Generate Invoice'}
            </button>
          </div>
        </div>

        {/* Order Status */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Order Status Timeline</h2>
          <div style={S.timeline}>
            <div style={S.timelineItem}>
              <div style={S.timelineDot(true)}></div>
              <div>
                <h4 style={S.timelineTitle}>Order Placed</h4>
                <p style={S.timelineDesc}>Your order has been received</p>
              </div>
            </div>
            <div style={S.timelineItem}>
              <div style={S.timelineDot(order.status === 'processing' || order.status === 'in_transit' || order.status === 'delivered')}></div>
              <div>
                <h4 style={S.timelineTitle}>Processing</h4>
                <p style={S.timelineDesc}>Your order is being prepared</p>
              </div>
            </div>
            <div style={S.timelineItem}>
              <div style={S.timelineDot(order.status === 'in_transit' || order.status === 'delivered')}></div>
              <div>
                <h4 style={S.timelineTitle}>In Transit</h4>
                <p style={S.timelineDesc}>Your order is on the way</p>
              </div>
            </div>
            <div style={S.timelineItem}>
              <div style={S.timelineDot(order.status === 'delivered')}></div>
              <div>
                <h4 style={S.timelineTitle}>Delivered</h4>
                <p style={S.timelineDesc}>Your order has been delivered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const S = {
  page: { padding: "3rem 2rem", maxWidth: "1000px", margin: "0 auto" },
  loading: { textAlign: "center", fontSize: "1.1rem", padding: "3rem 0", color: "#666" },
  error: { textAlign: "center", padding: "3rem 2rem", background: "#fee", borderRadius: "8px", color: "#c33" },
  button: { marginTop: "1rem", padding: "0.8rem 1.5rem", background: "#111", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  backLink: { background: "none", border: "none", color: "#111", fontSize: "1rem", cursor: "pointer", marginBottom: "1.5rem", textDecoration: "underline" },
  header: { marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "2px solid #eee" },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" },
  title: { fontSize: "2rem", fontWeight: "700", margin: 0 },
  date: { color: "#666", fontSize: "0.95rem" },
  content: {},
  section: { marginBottom: "2.5rem" },
  sectionTitle: { fontSize: "1.3rem", fontWeight: "600", marginBottom: "1rem" },
  itemsList: {},
  item: { display: "flex", alignItems: "center", gap: "1.5rem", padding: "1rem", borderBottom: "1px solid #eee" },
  itemPlaceholder: { fontSize: "2.5rem", width: "80px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: "8px" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.3rem 0" },
  itemQty: { fontSize: "0.9rem", color: "#666", margin: "0.2rem 0" },
  itemPrice: { fontSize: "0.9rem", color: "#666", margin: "0.2rem 0" },
  itemTotal: { fontSize: "1.1rem", fontWeight: "600" },
  addressBox: { padding: "1rem", background: "#f9f9f9", borderRadius: "8px", lineHeight: "1.6" },
  summaryBox: { padding: "1rem", background: "#f9f9f9", borderRadius: "8px" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "0.5rem 0" },
  invoiceButtons: { marginTop: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' },
  generateBtn: { padding: '1rem', background: '#111', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' },
  timeline: {},
  timelineItem: { display: "flex", gap: "1rem", marginBottom: "1.5rem" },
  timelineDot: (active) => ({ width: "16px", height: "16px", borderRadius: "50%", background: active ? "#10b981" : "#ddd", marginTop: "4px", flexShrink: 0 }),
  timelineTitle: { fontSize: "1rem", fontWeight: "600", margin: "0 0 0.2rem 0" },
  timelineDesc: { fontSize: "0.9rem", color: "#666", margin: 0 }
};
