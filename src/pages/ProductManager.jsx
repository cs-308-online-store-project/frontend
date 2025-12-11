import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';

export default function ProductManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('delivery');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Invalid user data in localStorage', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'product_manager') {
      navigate('/products');
      return;
    }

    fetchDeliveries();
  }, [user, navigate]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [orders, orderItems = []] = await Promise.all([
        orderService.getAllOrders(),
        orderService.getAllOrderItems().catch(() => []),
      ]);

      const orderList = orders || [];
      const orderMap = new Map(orderList.map((order) => [order.id, order]));

      const fallbackItems = orderList.flatMap((order) =>
        (order.items || []).map((item, idx) => ({
          ...item,
          orderId: item.orderId || order.id,
          orderItemId: item.id || `${order.id}-${idx}`,
          status: item.status || order.status,
        }))
      );

      const sourceItems = orderItems?.length ? orderItems : fallbackItems;

      const mappedDeliveries = sourceItems.map((item) => {
        const order = orderMap.get(item.orderId) || {};

        const statusValue = (order.status || item.status || 'processing')
          .replace(' ', '_')
          .toLowerCase();

        return {
          id: `${item.id || item.orderItemId || item.orderId}-${item.productId || 'item'}`,
          deliveryId: item.orderId || order.id || item.id,
          customerId: order.userId || order.customerId || 'N/A',
          productId: item.productId || 'N/A',
          quantity: item.quantity ?? 0,
          totalPrice: item.totalPrice ?? item.total ?? item.price ?? order.totalPrice,
          address: order.address || order.deliveryAddress || '—',
          status: statusValue,
        };
      });

      setDeliveries(mappedDeliveries);
      setError(null);
    } catch (err) {
      console.error('Failed to load deliveries', err);
      setError('Failed to load delivery list.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (deliveryId, newStatus) => {
    try {
      setUpdatingId(deliveryId);
      await orderService.updateOrderStatus(deliveryId, newStatus);

      setDeliveries((prev) =>
        prev.map((item) =>
          item.deliveryId === deliveryId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderDeliveryTab = () => {
    if (loading) {
      return <div style={styles.emptyState}>Loading deliveries...</div>;
    }

    if (error) {
      return (
        <div style={styles.emptyState}>
          <p>{error}</p>
          <button style={styles.primaryButton} onClick={fetchDeliveries}>
            Retry
          </button>
        </div>
      );
    }

    if (!deliveries.length) {
      return <div style={styles.emptyState}>No deliveries found.</div>;
    }

    return (
      <div style={styles.tableWrapper}>
        <div style={styles.tableHeader}>
          <span style={{ flex: 1 }}>Delivery ID</span>
          <span style={{ flex: 1 }}>Customer ID</span>
          <span style={{ flex: 1 }}>Product ID</span>
          <span style={{ flex: 1 }}>Quantity</span>
          <span style={{ flex: 1 }}>Total Price</span>
          <span style={{ flex: 2 }}>Delivery Address</span>
          <span style={{ flex: 1 }}>Status</span>
          <span style={{ width: '140px' }}></span>
        </div>
        {deliveries.map((item) => (
          <div key={item.id} style={styles.tableRow}>
            <span style={{ flex: 1 }}>#{item.deliveryId}</span>
            <span style={{ flex: 1 }}>{item.customerId}</span>
            <span style={{ flex: 1 }}>{item.productId}</span>
            <span style={{ flex: 1 }}>{item.quantity}</span>
            <span style={{ flex: 1 }}>${Number(item.totalPrice || 0).toFixed(2)}</span>
            <span style={{ flex: 2 }}>{item.address}</span>
            <span style={{ flex: 1 }}>
              <span style={styles.statusBadge(item.status)}>
                {item.status?.replace('_', ' ') || 'processing'}
              </span>
            </span>
            <span style={{ width: '140px', display: 'flex', gap: '0.5rem' }}>
              <button
                style={styles.secondaryButton}
                disabled={updatingId === item.deliveryId}
                onClick={() => handleStatusChange(item.deliveryId, 'in_transit')}
              >
                In Transit
              </button>
              <button
                style={styles.primaryButton}
                disabled={updatingId === item.deliveryId}
                onClick={() => handleStatusChange(item.deliveryId, 'delivered')}
              >
                Delivered
              </button>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Product Manager Portal</p>
          <h1 style={styles.title}>Operations</h1>
        </div>
        <button style={styles.textButton} onClick={() => navigate('/products')}>
          Exit →
        </button>
      </header>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'comments' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('comments')}
        >
          Pending Comments
        </button>
        <button
          style={activeTab === 'delivery' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('delivery')}
        >
          Delivery Management
        </button>
      </div>

      <div style={styles.card}>
        {activeTab === 'delivery' ? (
          renderDeliveryTab()
        ) : (
          <div style={styles.emptyState}>
            Comment moderation is coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: '#0f172a',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  eyebrow: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0.2rem 0 0',
    fontSize: '2rem',
    fontWeight: 800,
  },
  textButton: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    color: '#0f172a',
    fontWeight: 600,
  },
  tabs: {
    display: 'inline-flex',
    background: '#e2e8f0',
    borderRadius: '999px',
    padding: '0.3rem',
    gap: '0.2rem',
    marginBottom: '1rem',
  },
  tab: {
    border: 'none',
    background: 'transparent',
    padding: '0.7rem 1.2rem',
    borderRadius: '999px',
    cursor: 'pointer',
    color: '#475569',
    fontWeight: 600,
  },
  activeTab: {
    border: 'none',
    background: 'white',
    padding: '0.7rem 1.2rem',
    borderRadius: '999px',
    cursor: 'pointer',
    color: '#0f172a',
    fontWeight: 700,
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
  },
  card: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1rem',
    boxShadow: '0 10px 35px rgba(15, 23, 42, 0.08)',
  },
  tableWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    gap: '1rem',
    padding: '0.9rem 1rem',
    background: '#f8fafc',
    color: '#475569',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  tableRow: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    borderTop: '1px solid #e2e8f0',
    alignItems: 'center',
    fontSize: '0.95rem',
  },
  statusBadge: (status) => {
    const colors = {
      processing: '#f59e0b',
      in_transit: '#3b82f6',
      delivered: '#10b981',
    };

    const colorKey = (status || '').replace(' ', '_').toLowerCase();
    const background = colors[colorKey] || '#cbd5e1';

    return {
      display: 'inline-block',
      padding: '0.35rem 0.7rem',
      borderRadius: '999px',
      background,
      color: 'white',
      fontWeight: 700,
      fontSize: '0.85rem',
      textTransform: 'capitalize',
    };
  },
  primaryButton: {
    border: 'none',
    background: '#111827',
    color: 'white',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    background: 'white',
    color: '#0f172a',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: '#475569',
  },
};