// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { productsAPI } from "../services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const { state } = useLocation();        // ProductCard'dan gelen p
  const [p, setP] = useState(state?.p || null);

  useEffect(() => {
    if (p) return;                        // state geldiyse fetch'e gerek yok
    (async () => {
      try {
        const res = await productsAPI.getById(id);
        setP(res.data);
      } catch {
        // API yoksa çok basit bir fallback
        setP({ id, name: "Product", price: 0, quantity: 0, image: "" });
      }
    })();
  }, [id, p]);

  if (!p) return null;

  const out = (p.quantity ?? 0) <= 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <p style={{ marginBottom: 16 }}>
        <Link to="/products">← Back to Products</Link>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
        <div style={{ background: "#f6f6f6", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <img
            src={p.image || `https://picsum.photos/seed/${p.id}/1200/1200`}
            alt={p.name || p.title}
            style={{ width: "100%", display: "block", objectFit: "cover" }}
          />
        </div>

        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {p.name || p.title}
          </h1>

          <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 20 }}>
              ${Number(p.price || 0).toFixed(2)}
            </span>
            {out ? (
              <span style={{ color: "#999" }}>Out of stock</span>
            ) : (
              <span style={{ color: "#117a2d" }}>In stock • {p.quantity}</span>
            )}
          </div>

          <p style={{ color: "#444", lineHeight: 1.6, marginBottom: 16 }}>
            Premium fabric, modern fit. Category: <b>{p.category || "-"}</b>.
            Perfect for daily wear.
          </p>

          <button disabled={out} style={{
            padding: "12px 16px", background: "#111", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700
          }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
