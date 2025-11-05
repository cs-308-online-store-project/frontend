
// src/components/ProductCard.jsx
import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  const outOfStock = (p.quantity ?? 0) <= 0;

  return (
    <Link
      to={`/products/${p._id || p.id}`}
      state={{ p }}                 // ← detay sayfasına ürünü taşı
      className="product-card"
    >
      <div className="product-image">
        <img src={p.image || `https://picsum.photos/seed/${p.id}/600/600`} alt={p.name || p.title} />
        {outOfStock && <span className="badge danger">Out of Stock</span>}
      </div>
      <h3 className="product-title">{p.name || p.title}</h3>
      <div className="product-meta">
        <span className="price">${Number(p.price).toFixed(2)}</span>
        {!outOfStock && <span className="instock">In stock</span>}
      </div>
    </Link>
  );
}
