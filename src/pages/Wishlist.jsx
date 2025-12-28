import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../services/api';

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setWishlist(response.data.items || []);
    } catch (err) {
      console.error('Wishlist error:', err);
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      window.dispatchEvent(new Event("wishlistUpdated"));
      setWishlist(wishlist.filter(item => item.id !== productId));
    } catch (err) {
      console.error('Remove error:', err);
      alert('Failed to remove from wishlist');
    }
  };

  const addToCart = async (productId) => {
    try {
      // Add to cart
      await cartAPI.addToCart(productId, 1);
      
      // Remove from wishlist
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist(wishlist.filter(item => item.id !== productId));
      
      alert('✅ Added to cart and removed from wishlist!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>My Wishlist</h1>
          <p style={styles.subtitle}>
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate('/products')}>
          ← Back to Products
        </button>
      </header>

      {wishlist.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Your wishlist is empty</p>
          <button style={styles.shopBtn} onClick={() => navigate('/products')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {wishlist.map((product) => (
            <div key={product.id} style={styles.card}>
            <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <img
                src={product.image_url || 'https://placehold.co/400x400?text=No+Image'}
                alt={product.name}
                style={styles.image}
              />
              <div style={styles.content}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.price}>${Number(product.price).toFixed(2)}</p>
              </div>
            </Link>
            
            <div style={styles.content}>
              <div style={styles.stock}>
                {(product.quantity_in_stock || product.stock) > 0 ? (
                  <span style={styles.inStock}>In Stock ({product.quantity_in_stock || product.stock})</span>
                ) : (
                  <span style={styles.outOfStock}>Out of Stock</span>
                )}
              </div>
          
              <div style={styles.actions}>
                <button
                  style={styles.addToCartBtn}
                  onClick={() => addToCart(product.id)}
                  disabled={(product.quantity_in_stock || product.stock || 0) <= 0}
                >
                  Add to Cart
                </button>
                <button
                  style={styles.removeBtn}
                  onClick={() => removeFromWishlist(product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: '0.5rem 0 0',
  },
  backBtn: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#0f172a',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
  },
  error: {
    textAlign: 'center',
    padding: '3rem',
    color: '#ef4444',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyText: {
    fontSize: '1.2rem',
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  shopBtn: {
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
  },
  image: {
    width: '100%',
    height: '280px',
    objectFit: 'cover',
  },
  content: {
    padding: '1rem',
  },
  productName: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
    marginBottom: '0.5rem',
    color: '#0f172a',
  },
  price: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#111827',
    margin: '0.5rem 0',
  },
  stock: {
    marginBottom: '1rem',
  },
  inStock: {
    fontSize: '0.85rem',
    color: '#10b981',
    fontWeight: 600,
  },
  outOfStock: {
    fontSize: '0.85rem',
    color: '#ef4444',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  addToCartBtn: {
    flex: 1,
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.7rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  removeBtn: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.7rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#ef4444',
  },
};