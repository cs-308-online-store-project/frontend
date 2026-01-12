import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import { categoriesAPI, productsAPI, reviewsAPI } from '../services/api';
import ProductFormModal from '../components/ProductFormModal';
import { useToast } from '../context/ToastContext';

export default function ProductManager() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('delivery');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [updatingReviewId, setUpdatingReviewId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [productDeletingId, setProductDeletingId] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

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
  
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchReviews();
    }

    if (activeTab === 'categories') {
      fetchCategories();
    }

    if (activeTab === 'products' || activeTab === 'stock') {
      fetchProducts();
    }

    if (activeTab === 'products' && !categories.length) {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [orders, orderItems = []] = await Promise.all([
        orderService.getAllOrders(),
        orderService.getAllOrderItems().catch(() => []),
      ]);

      const normalizeList = (value) => {
        if (Array.isArray(value)) return value;
        const candidate =
          value?.data?.data ||
          value?.data?.orders ||
          value?.data?.items ||
          value?.orders ||
          value?.items ||
          value?.data ||
          [];
        return Array.isArray(candidate) ? candidate : [];
      };

      let orderList = normalizeList(orders);
      let orderMap = new Map(
        orderList.map((order) => [
          String(order.id ?? order.order_id ?? order.orderId),
          order,
        ])
      );

      const fallbackItems = orderList.flatMap((order) =>
        (order.items || []).map((item, idx) => ({
          ...item,
          orderId: item.orderId || order.id,
          orderItemId: item.id || `${order.id}-${idx}`,
          status: item.status || order.status,
        }))
      );

      const normalizedOrderItems = normalizeList(orderItems);
      const sourceItems = normalizedOrderItems.length ? normalizedOrderItems : fallbackItems;

      if (!orderList.length && sourceItems.length) {
        orderList = [];
        orderMap = new Map();
      }

      const formatAddress = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
          const parts = [
            value.name,
            value.addressLine1 || value.line1 || value.street,
            value.addressLine2 || value.line2,
            value.city,
            value.state,
            value.postalCode || value.postal_code || value.zip,
            value.country,
            value.phone,
          ].filter(Boolean);
          if (parts.length) return parts.join(', ');
        }
        return null;
      };

      const resolveCustomerId = (item, order) =>
        item.userId ||
        item.user_id ||
        item.customerId ||
        item.customer_id ||
        order.userId ||
        order.user_id ||
        order.customerId ||
        order.customer_id ||
        order.user?.id ||
        order.user?._id ||
        order.user?.userId ||
        order.customer?.id ||
        order.customer?._id ||
        'N/A';

      const resolveAddress = (item, order) =>
        formatAddress(item.address) ||
        formatAddress(item.shippingAddress) ||
        formatAddress(order.address) ||
        formatAddress(order.shippingAddress) ||
        formatAddress(order.shipping_address) ||
        formatAddress(order.deliveryAddress) ||
        formatAddress(order.delivery_address) ||
        formatAddress(order.shipping?.address) ||
        formatAddress(order.shipping?.fullAddress) ||
        formatAddress(order.fullAddress) ||
        '—';

      const mappedDeliveries = sourceItems.map((item) => {
        const resolvedOrderId =
          item.orderId ||
          item.order_id ||
          item.order?.id ||
          item.order?.order_id;
        const orderKey = String(resolvedOrderId ?? '');
        const order = orderMap.get(orderKey) || item.order || {};

        const statusValue = (order.status || item.status || 'processing')
          .replace(' ', '_')
          .toLowerCase();

        const quantity = item.quantity ?? 0;
        const unitPrice =
          item.unitPrice ??
          item.unit_price ??
          item.price ??
          0;
        const derivedTotal = quantity && unitPrice ? quantity * unitPrice : null;

        const customerId = resolveCustomerId(item, order);
        const address = resolveAddress(item, order);

        const productId = item.productId || item.product_id || 'N/A';

        return {
          id: `${item.id || item.orderItemId || resolvedOrderId}-${productId || 'item'}`,
          deliveryId: resolvedOrderId || order.id || item.id,
          customerId,
          productId,
          quantity,
          totalPrice:
            item.totalPrice ??
            item.total_price ??
            item.total ??
            derivedTotal ??
            order.totalPrice ??
            order.total_price ??
            0,
          address,
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

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);

      const res = await reviewsAPI.getAll();
      const payload = res?.data?.data ?? res?.data;
      const items = Array.isArray(payload) ? payload : payload?.reviews || [];

      setReviews(items);
    } catch (err) {
      console.error('Failed to load reviews', err);
      setReviews([]);
      setReviewsError('Yorum listesi yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const res = await categoriesAPI.getAll();
      const payload = res?.data?.data ?? res?.data;
      const list = Array.isArray(payload) ? payload : payload?.categories ?? [];
      const normalized = list.map((item) =>
        typeof item === 'string' || typeof item === 'number'
          ? { id: item, name: String(item), description: '' }
          : item
      );
      setCategories(normalized);
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategories([]);
      setCategoriesError('Kategori listesi yüklenemedi.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const res = await productsAPI.getAll();
      const payload = res?.data?.data ?? res?.data;
      const list = Array.isArray(payload) ? payload : payload?.products ?? [];
      setProducts(list);
      setStockDrafts(
        list.reduce((acc, item) => {
          const id = item.id ?? item._id;
          acc[id] = item.stock ?? item.quantity_in_stock ?? 0;
          return acc;
        }, {})
      );
    } catch (err) {
      console.error('Failed to load products', err);
      setProducts([]);
      setProductsError('Ürün listesi yüklenemedi.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Kategori adı gerekli.', 'error');
      return;
    }

    try {
      setCategorySubmitting(true);
      const res = await categoriesAPI.create({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });
      const created = res?.data?.data ?? res?.data ?? {
        id: Date.now(),
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      };
      setCategories((prev) => [...prev, created]);
      setCategoryForm({ name: '', description: '' });
      showToast('Kategori eklendi.', 'success');
    } catch (err) {
      console.error('Failed to create category', err);
      showToast('Kategori eklenemedi.', 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    try {
      await categoriesAPI.remove(categoryId);
      setCategories((prev) => prev.filter((item) => item.id !== categoryId));
      showToast('Kategori silindi.', 'success');
    } catch (err) {
      console.error('Failed to delete category', err);
      showToast('Kategori silinemedi.', 'error');
    }
  };

  const handleProductSave = async (payload) => {
    try {
      const res = await productsAPI.create(payload);
      const created = res?.data?.data ?? res?.data ?? { ...payload, id: Date.now() };
      setProducts((prev) => [...prev, created]);
      showToast('Ürün eklendi.', 'success');
    } catch (err) {
      console.error('Failed to create product', err);
      showToast('Ürün eklenemedi.', 'error');
    } finally {
      setProductModalOpen(false);
    }
  };

  const handleStockUpdate = async (productId) => {
    const nextStock = Number(stockDrafts[productId] ?? 0);
    try {
      setStockUpdatingId(productId);
      await productsAPI.update(productId, {
        stock: nextStock,
      });
      setProducts((prev) =>
        prev.map((item) =>
          (item.id ?? item._id) === productId
            ? { ...item, stock: nextStock, in_stock: nextStock > 0 }
            : item
        )
      );
      showToast('Stok güncellendi.', 'success');
    } catch (err) {
      console.error('Failed to update stock', err);
      showToast('Stok güncellenemedi.', 'error');
    } finally {
      setStockUpdatingId(null);
    }
  };

const handleProductDelete = async (productId, productName) => {
    const confirmed = window.confirm(
      `${productName || 'Bu ürün'} silinsin mi? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    try {
      setProductDeletingId(productId);
      await productsAPI.remove(productId);
      setProducts((prev) =>
        prev.filter((item) => (item.id ?? item._id) !== productId)
      );
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      showToast('Ürün silindi.', 'success');
    } catch (err) {
      console.error('Failed to delete product', err);
      showToast('Ürün silinemedi.', 'error');
    } finally {
      setProductDeletingId(null);
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

  const updateReviewStatus = async (reviewId, status) => {
    try {
      setUpdatingReviewId(reviewId);
      setReviewsError(null);
      
      const approved = status === 'approved';
      
      await reviewsAPI.updateStatus(reviewId, approved);
  
      // ✅ State'i güncelle
      setReviews((prev) =>
        prev.map((item) =>
          item.id === reviewId 
            ? { ...item, approved: approved, status: status } 
            : item
        )
      );
      
      alert(`✅ Review ${status}!`);
      
    } catch (err) {
      console.error('Failed to update review status', err);
      setReviewsError('Durum güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUpdatingReviewId(null);
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

  const renderCommentsTab = () => {
    if (reviewsLoading) {
      return <div style={styles.emptyState}>Yorumlar yükleniyor...</div>;
    }

    if (reviewsError) {
      return (
        <div style={styles.emptyState}>
          <p>{reviewsError}</p>
          <button style={styles.primaryButton} onClick={fetchReviews}>
            Tekrar Dene
          </button>
        </div>
      );
    }

        // ✅ YENİ EKLENEN - Sadece comment içeren review'ları filtrele
    const commentsOnly = reviews.filter(r => r.comment && r.comment.trim());

    const filteredReviews = (() => {
      if (statusFilter === 'all') return commentsOnly;
        return commentsOnly.filter((r) => {
          if (statusFilter === 'approved') return r.approved === true;
          if (statusFilter === 'rejected') return r.approved === false;
          if (statusFilter === 'pending') return r.approved !== true && r.approved !== false;
          return true;
        });
    })();

    if (!filteredReviews.length) {
      return <div style={styles.emptyState}>Henüz yorum bulunamadı.</div>;
    }

    const statusOptions = [
      { label: 'Tümü', value: 'all' },
      { label: 'Beklemede', value: 'pending' },
      { label: 'Onaylandı', value: 'approved' },
      { label: 'Reddedildi', value: 'rejected' },
    ];

    return (
      <div>
        <div style={styles.filtersRow}>
          <div>
            <p style={styles.eyebrow}>Toplam Yorum</p>
            <h3 style={{ margin: 0 }}>{reviews.length}</h3>
          </div>
          <div style={styles.filterControls}>
            <label htmlFor="statusFilter" style={styles.filterLabel}>
              Durum
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <div style={{ ...styles.tableHeader, alignItems: 'center' }}>
            <span style={{ flex: 0.5 }}>ID</span>
            <span style={{ flex: 0.8 }}>Product</span>
            <span style={{ flex: 1 }}>Kullanıcı</span>
            <span style={{ flex: 0.8 }}>Puan</span>
            <span style={{ flex: 2 }}>Yorum</span>
            <span style={{ flex: 0.8 }}>Durum</span>
            <span style={{ width: '180px' }}></span>
          </div>
          {filteredReviews.map((review) => {
            const reviewerName =
              review.user?.name ||
              review.user_name ||
              review.username ||
              review.user ||
              review.user_id ||
              'Anonymous';

            const statusValue = (review.status || 'pending').toLowerCase();

            return (
              <div key={review.id} style={{ ...styles.tableRow, alignItems: 'flex-start' }}>
                <span style={{ flex: 0.5 }}>#{review.id}</span>
                <span style={{ flex: 0.8 }}>#{review.product_id || review.productId}</span>
                <span style={{ flex: 1 }}>{reviewerName}</span>
                <span style={{ flex: 0.8 }}>
                  <span style={styles.ratingBadge}>{review.rating ?? '—'}/5</span>
                </span>
                <span style={{ flex: 2 }}>
                  <p style={styles.commentPreview}>{review.comment}</p>
                  <small style={styles.commentDate}>Eklenme: {review.created_at}</small>
                </span>
                <span style={{ flex: 0.8 }}>
                  <span style={styles.commentStatusBadge(statusValue)}>
                    {statusValue}
                  </span>
                </span>
                <span style={{ width: '180px', display: 'flex', gap: '0.5rem' }}>
                  {['pending', 'approved', 'rejected'].map((option) => (
                    <button
                      key={option}
                      style={
                        statusValue === option
                          ? styles.secondaryButton
                          : styles.lightButton
                      }
                      disabled={updatingReviewId === review.id}
                      onClick={() => updateReviewStatus(review.id, option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCategoriesTab = () => {
    if (categoriesLoading) {
      return <div style={styles.emptyState}>Kategoriler yükleniyor...</div>;
    }

    if (categoriesError) {
      return (
        <div style={styles.emptyState}>
          <p>{categoriesError}</p>
          <button style={styles.primaryButton} onClick={fetchCategories}>
            Tekrar Dene
          </button>
        </div>
      );
    }

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>Kategori Yönetimi</p>
            <h3 style={styles.sectionTitle}>Yeni Kategori</h3>
          </div>
        </div>

        <form onSubmit={handleCategorySubmit} style={styles.formRow}>
          <input
            type="text"
            placeholder="Kategori adı"
            value={categoryForm.name}
            onChange={(event) =>
              setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
            }
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Açıklama"
            value={categoryForm.description}
            onChange={(event) =>
              setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
            }
            style={styles.input}
          />
          <button
            type="submit"
            style={styles.primaryButton}
            disabled={categorySubmitting}
          >
            Kategori Ekle
          </button>
        </form>

        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 0.3 }}>ID</span>
            <span style={{ flex: 1 }}>Kategori Adı</span>
            <span style={{ flex: 2 }}>Açıklama</span>
            <span style={{ width: '140px' }}></span>
          </div>
          {categories.length ? (
            categories.map((category) => (
              <div key={category.id} style={styles.tableRow}>
                <span style={{ flex: 0.3 }}>#{category.id}</span>
                <span style={{ flex: 1 }}>{category.name}</span>
                <span style={{ flex: 2 }}>{category.description || '—'}</span>
                <span style={{ width: '140px' }}>
                  <button
                    style={styles.dangerButton}
                    onClick={() => handleCategoryDelete(category.id)}
                  >
                    Sil
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>Henüz kategori bulunmuyor.</div>
          )}
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {
    if (productsLoading) {
      return <div style={styles.emptyState}>Ürünler yükleniyor...</div>;
    }

    if (productsError) {
      return (
        <div style={styles.emptyState}>
          <p>{productsError}</p>
          <button style={styles.primaryButton} onClick={fetchProducts}>
            Tekrar Dene
          </button>
        </div>
      );
    }

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>Ürün Yönetimi</p>
            <h3 style={styles.sectionTitle}>Ürün Ekle</h3>
          </div>
          <button style={styles.primaryButton} onClick={() => setProductModalOpen(true)}>
            + Yeni Ürün
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 0.3 }}>ID</span>
            <span style={{ flex: 1 }}>Ürün</span>
            <span style={{ flex: 1 }}>Kategori</span>
            <span style={{ flex: 0.6 }}>Fiyat</span>
            <span style={{ flex: 0.6 }}>Stok</span>
            <span style={{ width: '140px' }}></span>
          </div>
          {products.length ? (
            products.map((item) => (
              <div key={item.id ?? item._id} style={styles.tableRow}>
                <span style={{ flex: 0.3 }}>#{item.id ?? item._id}</span>
                <span style={{ flex: 1 }}>{item.name}</span>
                <span style={{ flex: 1 }}>
                  {item.category?.name || item.category || item.category_name || item.category_id || '—'}
                </span>
                <span style={{ flex: 0.6 }}>${Number(item.price || 0).toFixed(2)}</span>
                <span style={{ flex: 0.6 }}>{item.stock ?? item.quantity_in_stock ?? 0}</span>
                <span style={{ width: '140px' }}>
                  <button
                    style={styles.dangerButton}
                    disabled={productDeletingId === (item.id ?? item._id)}
                    onClick={() =>
                      handleProductDelete(item.id ?? item._id, item.name)
                    }
                  >
                    Sil
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>Henüz ürün bulunmuyor.</div>
          )}
        </div>
      </div>
    );
  };

  const renderStockTab = () => {
    if (productsLoading) {
      return <div style={styles.emptyState}>Stok listesi yükleniyor...</div>;
    }

    if (productsError) {
      return (
        <div style={styles.emptyState}>
          <p>{productsError}</p>
          <button style={styles.primaryButton} onClick={fetchProducts}>
            Tekrar Dene
          </button>
        </div>
      );
    }

    return (
      <div>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.eyebrow}>Stok Yönetimi</p>
            <h3 style={styles.sectionTitle}>Ürün Stokları</h3>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 0.3 }}>ID</span>
            <span style={{ flex: 1.2 }}>Ürün</span>
            <span style={{ flex: 0.8 }}>Mevcut Stok</span>
            <span style={{ flex: 0.8 }}>Yeni Stok</span>
            <span style={{ width: '140px' }}></span>
          </div>
          {products.length ? (
            products.map((item) => {
              const id = item.id ?? item._id;
              const currentStock = item.stock ?? item.quantity_in_stock ?? 0;
              return (
                <div key={id} style={styles.tableRow}>
                  <span style={{ flex: 0.3 }}>#{id}</span>
                  <span style={{ flex: 1.2 }}>{item.name}</span>
                  <span style={{ flex: 0.8 }}>{currentStock}</span>
                  <span style={{ flex: 0.8 }}>
                    <input
                      type="number"
                      value={stockDrafts[id] ?? currentStock}
                      onChange={(event) =>
                        setStockDrafts((prev) => ({
                          ...prev,
                          [id]: event.target.value,
                        }))
                      }
                      style={styles.stockInput}
                    />
                  </span>
                  <span style={{ width: '140px' }}>
                    <button
                      style={styles.primaryButton}
                      disabled={stockUpdatingId === id}
                      onClick={() => handleStockUpdate(id)}
                    >
                      Güncelle
                    </button>
                  </span>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>Henüz stok bilgisi yok.</div>
          )}
        </div>
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
          style={activeTab === 'categories' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          style={activeTab === 'products' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          style={activeTab === 'stock' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('stock')}
        >
          Manage Stock
        </button>
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
        {activeTab === 'delivery' && renderDeliveryTab()}
        {activeTab === 'comments' && renderCommentsTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'stock' && renderStockTab()}
      </div>
      {productModalOpen && (
        <ProductFormModal
          categories={categories}
          onClose={() => setProductModalOpen(false)}
          onSave={handleProductSave}
        />
      )}
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
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    margin: '0.2rem 0 0',
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '0.8rem',
    marginBottom: '1.5rem',
  },
  input: {
    padding: '0.65rem 0.8rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: 'white',
    fontWeight: 600,
  },
  filtersRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '1rem',
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterLabel: { fontSize: '0.9rem', color: '#475569', fontWeight: 600 },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: 'white',
    fontWeight: 600,
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
  commentStatusBadge: (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
    };

    const background = colors[status] || '#cbd5e1';

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
  lightButton: {
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '0.5rem 0.6rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  dangerButton: {
    border: 'none',
    background: '#ef4444',
    color: 'white',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  stockInput: {
    width: '100%',
    padding: '0.5rem 0.6rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontWeight: 600,
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: '#475569',
  },
  ratingBadge: {
    display: 'inline-block',
    padding: '0.35rem 0.55rem',
    borderRadius: '8px',
    background: '#111827',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  commentPreview: {
    margin: 0,
    color: '#0f172a',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  commentDate: { color: '#94a3b8' },
};