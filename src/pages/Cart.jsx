// src/pages/Cart.jsx
import { useState, useEffect } from "react";
import { cartAPI } from "../services/api";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartAPI.getCart();
      setCart(response.data);
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
      await fetchCart(); // Refresh cart
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Failed to update quantity");
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await fetchCart(); // Refresh cart
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

  return (
    <div style={S.page}>
      <h1 style={S.title}>Shopping Cart</h1>

      {cart.items.length === 0 && (
        <div style={S.empty}>
          <p>Your cart is empty 🛍️</p>
          <a href="/products" style={S.browseLink}>Browse Products</a>
        </div>
      )}

      {cart.items.length > 0 && (
        <div style={S.container}>
          <div style={S.items}>
            {cart.items.map((item) => (
              <div key={item.id} style={S.card}>
                <div style={S.imagePlaceholder}>
                  {/* TODO: Add product image when available */}
                  📦
                </div>

                <div style={S.info}>
                  <h3 style={S.name}>{item.name}</h3>
                  <p style={S.price}>${item.unitPrice.toFixed(2)} each</p>
                  <p style={S.totalPrice}>
                    Total: ${item.totalPrice.toFixed(2)}
                  </p>

                  {/* Quantity controls */}
                  <div style={S.qtyBox}>
                    <button 
                      style={S.qtyBtn} 
                      onClick={() => updateQty(item.id, item.quantity - 1)}
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
            <h2>Order Summary</h2>

            <div style={S.row}>
              <span>Subtotal:</span>
              <span>${cart.total_price.toFixed(2)}</span>
            </div>

            <div style={S.row}>
              <span>Shipping:</span>
              <span>Calculated at checkout</span>
            </div>

            <hr style={S.divider} />

            <div style={{...S.row, fontWeight: 'bold', fontSize: '1.1rem'}}>
              <span>Total:</span>
              <span>${cart.total_price.toFixed(2)}</span>
            </div>

            <button style={S.checkout}>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const S = {
  page: { padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto" },
  title: { fontSize: "2.2rem", marginBottom: "2rem", fontWeight: 700 },

  loading: { textAlign: "center", fontSize: "1.1rem", padding: "3rem 0", color: "#666" },
  
  error: { 
    textAlign: "center", 
    padding: "3rem 2rem", 
    background: "#fee", 
    borderRadius: "8px",
    color: "#c33"
  },
  
  retryBtn: {
    marginTop: "1rem",
    padding: "0.8rem 1.5rem",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem"
  },

  empty: { 
    textAlign: "center", 
    fontSize: "1.2rem", 
    padding: "4rem 0" 
  },
  
  browseLink: {
    display: "inline-block",
    marginTop: "1.5rem",
    padding: "0.8rem 2rem",
    background: "#111",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px"
  },

  container: { display: "flex", gap: "3rem", alignItems: "flex-start" },

  items: { flex: 2 },

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
    borderRadius: 8,
    fontSize: "3rem"
  },

  info: { flex: 1 },

  name: { fontSize: "1.2rem", fontWeight: "600", marginBottom: ".5rem" },
  price: { fontSize: ".9rem", color: "#666", marginBottom: ".3rem" },
  totalPrice: { fontSize: "1rem", marginTop: "0.3rem", fontWeight: "600" },

  qtyBox: { display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "1rem" },
  qtyBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
  qty: { minWidth: "30px", textAlign: "center", fontWeight: "600" },

  remove: {
    marginTop: "1rem",
    background: "none",
    border: "none",
    color: "#d11",
    cursor: "pointer",
    fontSize: ".9rem",
    textDecoration: "underline"
  },

  summary: {
    flex: 1,
    padding: "1.5rem",
    border: "1px solid #eee",
    borderRadius: "10px",
    backgroundColor: "#fafafa",
    position: "sticky",
    top: "2rem"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    margin: "1rem 0",
    fontSize: "1rem",
  },
  
  divider: {
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "1rem 0"
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
    fontWeight: "600"
  },
};