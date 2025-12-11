// src/pages/Cart.jsx
import { useState, useEffect } from "react";
import { cartAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.getCart();
      
      // ✅ DÜZELTME 1: Valid items'ı filtrele ve cart'a set et
      const cartItems = Array.isArray(response.data.items) ? response.data.items : [];
      const validItems = cartItems.filter(
        item => item && item.id && item.productId && item.quantity > 0
      );
      
      // Cart'ı valid items ile güncelle
      setCart({
        items: validItems,
        total_price: response.data.total_price || 0
      });
    
      localStorage.setItem("cart", JSON.stringify(validItems));
      window.dispatchEvent(new Event("cartUpdated"));
    
      console.log('🛒 Cart updated:', validItems.length, 'items');
    
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const updateQty = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await cartAPI.updateQuantity(itemId, newQuantity);
      await fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Failed to update quantity");
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={S.page}>
        <h1 style={S.title}>Shopping Cart</h1>
        <p style={S.loading}>Loading your cart...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={S.page}>
        <h1 style={S.title}>Shopping Cart</h1>
        <div style={S.error}>
          <p>⚠️ {error}</p>
          <button onClick={fetchCart} style={S.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  // ✅ DÜZELTME 2: Daha robust empty check
  const isCartEmpty = !cart.items || cart.items.length === 0;

  if (isCartEmpty) {
    return (
      <div style={S.page}>
        <h1 style={S.title}>Shopping Cart</h1>
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🛒</div>
          <h2 style={S.emptyTitle}>Your Cart is Empty</h2>
          <p style={S.emptyText}>
            Looks like you haven't added anything to your cart yet.
          </p>
          <button 
            style={S.continueShoppingBtn}
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Cart with items
  return (
    <div style={S.page}>
      <h1 style={S.title}>Shopping Cart</h1>

      <div style={S.container}>
        {/* CART ITEMS */}
        <div style={S.items}>
          {cart.items.map((item) => (
            <div key={item.id} style={S.card}>
              <div style={S.imagePlaceholder}>
                📦
              </div>

              <div style={S.info}>
                <h3 style={S.name}>{item.name}</h3>
                <p style={S.price}>${item.unitPrice?.toFixed(2) || '0.00'} each</p>
                <p style={S.totalPrice}>
                  Total: ${item.totalPrice?.toFixed(2) || '0.00'}
                </p>

                {/* Quantity controls */}
                <div style={S.qtyBox}>
                  <button 
                    style={S.qtyBtn} 
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span style={S.qty}>{item.quantity}</span>
                  <button 
                    style={S.qtyBtn} 
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button 
                  style={S.remove} 
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY */}
        <div style={S.summary}>
          <h2 style={S.summaryTitle}>Order Summary</h2>

          <div style={S.row}>
            <span>Subtotal:</span>
            <span>${cart.total_price?.toFixed(2) || '0.00'}</span>
          </div>

          <div style={S.row}>
            <span>Shipping:</span>
            <span>Calculated at checkout</span>
          </div>

          <hr style={S.divider} />

          <div style={{...S.row, fontWeight: 'bold', fontSize: '1.1rem'}}>
            <span>Total:</span>
            <span>${cart.total_price?.toFixed(2) || '0.00'}</span>
          </div>

          <button
            style={S.checkout}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const S = {
  page: { 
    padding: "3rem 2rem", 
    maxWidth: "1200px", 
    margin: "0 auto",
    minHeight: "70vh"
  },
  
  title: { 
    fontSize: "2.2rem", 
    marginBottom: "2rem", 
    fontWeight: 700 
  },

  loading: { 
    textAlign: "center", 
    fontSize: "1.1rem", 
    padding: "3rem 0", 
    color: "#666" 
  },
  
  error: { 
    textAlign: "center", 
    padding: "3rem 2rem", 
    background: "#fee", 
    borderRadius: "8px",
    color: "#c33",
    maxWidth: "500px",
    margin: "0 auto"
  },
  
  retryBtn: {
    marginTop: "1rem",
    padding: "0.8rem 1.5rem",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600"
  },

  // ✨ EMPTY STATE
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    textAlign: "center",
    padding: "40px 20px"
  },

  emptyIcon: {
    fontSize: "80px",
    marginBottom: "24px",
    opacity: 0.6
  },

  emptyTitle: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#111"
  },

  emptyText: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px",
    maxWidth: "400px"
  },

  continueShoppingBtn: {
    padding: "14px 32px",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.3s ease"
  },

  container: { 
    display: "flex", 
    gap: "3rem", 
    alignItems: "flex-start",
    flexWrap: "wrap"
  },

  items: { 
    flex: 2,
    minWidth: "300px"
  },

  card: {
    display: "flex",
    gap: "1.5rem",
    padding: "1.5rem",
    borderBottom: "1px solid #e5e5e5",
  },

  imagePlaceholder: { 
    width: "140px", 
    height: "180px", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    borderRadius: "8px",
    fontSize: "3rem",
    flexShrink: 0
  },

  info: { flex: 1 },

  name: { 
    fontSize: "1.2rem", 
    fontWeight: "600", 
    marginBottom: ".5rem",
    color: "#111"
  },
  
  price: { 
    fontSize: ".9rem", 
    color: "#666", 
    marginBottom: ".3rem" 
  },
  
  totalPrice: { 
    fontSize: "1rem", 
    marginTop: "0.3rem", 
    fontWeight: "600",
    color: "#111"
  },

  qtyBox: { 
    display: "flex", 
    alignItems: "center", 
    gap: "0.8rem", 
    marginTop: "1rem" 
  },
  
  qtyBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "600",
    transition: "all 0.2s ease"
  },
  
  qty: { 
    minWidth: "30px", 
    textAlign: "center", 
    fontWeight: "600",
    fontSize: "1rem"
  },

  remove: {
    marginTop: "1rem",
    background: "none",
    border: "none",
    color: "#d11",
    cursor: "pointer",
    fontSize: ".9rem",
    textDecoration: "underline",
    fontWeight: "500",
    padding: "4px 0"
  },

  summary: {
    flex: 1,
    minWidth: "300px",
    padding: "1.5rem",
    border: "1px solid #eee",
    borderRadius: "10px",
    backgroundColor: "#fafafa",
    position: "sticky",
    top: "2rem",
    height: "fit-content"
  },

  summaryTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#111"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    margin: "1rem 0",
    fontSize: "1rem",
    color: "#333"
  },
  
  divider: {
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "1.5rem 0"
  },

  checkout: {
    marginTop: "1.5rem",
    width: "100%",
    background: "#111",
    color: "white",
    padding: "1rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.3s ease"
  }
};