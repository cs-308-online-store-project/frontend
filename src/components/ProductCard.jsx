// src/components/ProductCard.jsx
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const p = product || {};
  const stock = p.quantity ?? p.stock ?? 0;
  const outOfStock = stock <= 0;

  return (
    <div className={`product-card ${outOfStock ? "out-of-stock" : ""}`}>
      <Link
        to={`/products/${p._id || p.id}`}
        state={{ product: p }}
        className="product-link"
      >
        <div className="product-image-wrapper">
          <img
            className="product-image"
            src={p.image || `https://picsum.photos/seed/${p.id}/600/600`}
            alt={p.name || p.title}
          />
          {outOfStock && <span className="badge-out">OUT OF STOCK</span>}
        </div>

        <h3 className="product-title">{p.name || p.title}</h3>

        <div className="product-meta">
          <span className="price">${Number(p.price).toFixed(2)}</span>
          {!outOfStock && (
            <span className="in-stock">In Stock ({stock})</span>
          )}
        </div>
      </Link>

      {/* OPTIONAL — Add to cart UI hazır kalsın */}
      <button
        className="add-cart-btn"
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}