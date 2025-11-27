import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const {
    id,
    _id,
    title,
    name,
    image,
    price,
    stock
  } = product;

  const outOfStock = (stock ?? 0) <= 0;
  const lowStock = !outOfStock && stock < 10; // low stock warning

  return (
    <div className="product-card">
      <Link to={`/products/${_id || id}`} className="product-link">
        <div className="product-image">
          <img
            src={image || `https://picsum.photos/seed/${id}/600/600`}
            alt={title || name}
            className={outOfStock ? "faded" : ""}
          />

          {outOfStock && (
            <span className="badge-out">Out of Stock</span>
          )}
        </div>

        <h3 className="product-title">{title || name}</h3>

        <div className="price-stock">
          <span className="price">${Number(price).toFixed(2)}</span>
          {!outOfStock && <span className="stock-ok">In Stock</span>}
        </div>

        {lowStock && (
          <p className="low-stock-text">Only {stock} left — hurry!</p>
        )}
      </Link>

      {/* Add to Cart */}
      <button
        className="btn-cart"
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}