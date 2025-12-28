// src/components/ProductCard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { wishlistAPI } from "../services/api";
import HeartIcon from "./icons/HeartIcon";

export default function ProductCard({ product }) {
  const p = product || {};
  
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log("PRODUCT:", p);

  const stock = Number(p.stock ?? 0);
  const outOfStock = stock <= 0;
  const image =
    p.image_url ||
    `https://picsum.photos/seed/${p.id || p._id || "product"}/600/600`;
  const price = Number(p.price ?? 0).toFixed(2);

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsInWishlist(false);
          return;
        }

        const response = await wishlistAPI.getWishlist();
        const wishlistItems = response.data.items || [];
        const exists = wishlistItems.some(
          (item) => item.id === (p.id || p._id)
        );
        setIsInWishlist(exists);
      } catch (error) {
        console.error("Check wishlist error:", error);
      }
    };

    checkWishlist();

    // Listen for wishlist updates
    window.addEventListener("wishlistUpdated", checkWishlist);
    return () => {
      window.removeEventListener("wishlistUpdated", checkWishlist);
    };
  }, [p.id, p._id]);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add to wishlist");
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(p.id || p._id);
        setIsInWishlist(false);
      } else {
        await wishlistAPI.addToWishlist(p.id || p._id);
        setIsInWishlist(true);
      }

      // Trigger wishlist update event
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("Wishlist error:", error);
      alert(error.response?.data?.error || "Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`product-card ${outOfStock ? "out-of-stock" : ""}`}>
      <Link
        to={`/products/${p.id || p._id}`}
        state={{ product: p }}
        className="product-link"
      >
        <div className="product-image-wrapper" style={{ position: "relative" }}>
          <img
            className="product-image"
            src={image}
            alt={p.name || p.title}
          />
          {outOfStock && <span className="badge-out">OUT OF STOCK</span>}
          
          {/* ✅ Wishlist Button */}
          <button
            onClick={toggleWishlist}
            disabled={loading}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              transition: "transform 0.2s",
              zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <HeartIcon active={isInWishlist} size={22} />
          </button>
        </div>

        <h3 className="product-title">{p.name || p.title}</h3>
        
        <div className="product-meta">
          <span className="price">${price}</span>
          {!outOfStock && (
            <span className="in-stock">In Stock ({stock})</span>
          )}
        </div>
      </Link>

      {/* OPTIONAL — Add to cart UI */}
      <button
        className="add-cart-btn"
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}