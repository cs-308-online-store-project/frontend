// src/pages/Cart.jsx
import { useState, useEffect } from "react";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);
  }, []);

  const updateQty = (index, delta) => {
    const items = [...cart];
    const newQty = items[index].qty + delta;
    if (newQty < 1) return;

    items[index].qty = newQty;
    setCart(items);
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const removeItem = (index) => {
    const items = cart.filter((_, i) => i !== index);
    setCart(items);
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div style={S.page}>
      <h1 style={S.title}>Shopping Bag</h1>

      {cart.length === 0 && (
        <div style={S.empty}>
          <p>Your cart is empty 🛍️</p>
        </div>
      )}

      {cart.length > 0 && (
        <div style={S.container}>
          <div style={S.items}>
            {cart.map((item, index) => (
              <div key={index} style={S.card}>
                <img src={item.image_url} style={S.image} />

                <div style={S.info}>
                  <h3 style={S.name}>{item.name}</h3>
                  <p style={S.size}>Size: {item.size}</p>
                  <p style={S.price}>${item.price.toFixed(2)}</p>

                  {/* Quantity controls */}
                  <div style={S.qtyBox}>
                    <button style={S.qtyBtn} onClick={() => updateQty(index, -1)}>
                      −
                    </button>
                    <span style={S.qty}>{item.qty}</span>
                    <button style={S.qtyBtn} onClick={() => updateQty(index, 1)}>
                      +
                    </button>
                  </div>

                  <button style={S.remove} onClick={() => removeItem(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <div style={S.summary}>
            <h2>Order Summary</h2>

            <div style={S.row}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
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

  empty: { textAlign: "center", fontSize: "1.2rem", padding: "4rem 0" },

  container: { display: "flex", gap: "3rem", alignItems: "flex-start" },

  items: { flex: 2 },

  card: {
    display: "flex",
    gap: "1.5rem",
    padding: "1.5rem",
    borderBottom: "1px solid #e5e5e5",
  },

  image: { width: "140px", height: "180px", objectFit: "cover", borderRadius: 8 },

  info: { flex: 1 },

  name: { fontSize: "1.2rem", fontWeight: "600", marginBottom: ".3rem" },
  size: { fontSize: ".9rem", color: "#777" },
  price: { fontSize: "1rem", marginTop: "0.5rem", fontWeight: "600" },

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
  qty: { minWidth: "20px", textAlign: "center", fontWeight: "600" },

  remove: {
    marginTop: "1rem",
    background: "none",
    border: "none",
    color: "#d11",
    cursor: "pointer",
    fontSize: ".9rem",
  },

  summary: {
    flex: 1,
    padding: "1.5rem",
    border: "1px solid #eee",
    borderRadius: "10px",
    backgroundColor: "#fafafa",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    margin: "1rem 0",
    fontSize: "1rem",
  },

  checkout: {
    marginTop: "1rem",
    width: "100%",
    background: "#111",
    color: "white",
    padding: "1rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};
