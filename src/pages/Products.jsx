// src/pages/Products.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";

// UI için sabit (mock) ürünler
const MOCK = [
  { id: 1, name: "Denim Jacket",  description: "Classic denim jacket",  price: 89.9, quantity: 8,  category_name: "Jackets",     image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format" },
  { id: 2, name: "Wide Jeans",    description: "Relaxed-fit jeans",     price: 69.9, quantity: 0,  category_name: "Jeans",       image_url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=800&auto=format" },
  { id: 3, name: "Sweatshirt",    description: "Cozy cotton hoodie",    price: 49.9, quantity: 14, category_name: "Sweatshirts", image_url: "https://images.unsplash.com/photo-1520975940209-6c92867fd0f0?q=80&w=800&auto=format" },
  { id: 4, name: "T-Shirt",       description: "Premium basic tee",     price: 24.9, quantity: 30, category_name: "T-Shirts",    image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format" },
  { id: 5, name: "Chino Pants",   description: "Versatile chinos",      price: 59.9, quantity: 6,  category_name: "Pants",       image_url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=800&auto=format" },
  { id: 6, name: "Zip Hoodie",    description: "Lightweight zip hoodie",price: 54.9, quantity: 10, category_name: "Sweatshirts", image_url: "https://images.unsplash.com/photo-1520975940209-6c92867fd0f0?q=80&w=800&auto=format" },
];

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sadece UI: mock veriyi yükle
  useEffect(() => {
    const t = setTimeout(() => {
      setProducts(MOCK);
      setFilteredProducts(MOCK);
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q)
    );
    setFilteredProducts(filtered);
  };

  const handleSort = (sortType) => {
    if (!sortType) {
      setFilteredProducts(products);
      return;
    }
    let sorted = [...filteredProducts];
    switch (sortType) {
      case "price_asc":
        sorted.sort((a, b) => +a.price - +b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => +b.price - +a.price);
        break;
      case "name_asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        sorted.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        break;
      default:
        sorted = products;
    }
    setFilteredProducts(sorted);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading our premium collection...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>PREMIUM COLLECTION</h1>
          <p style={styles.subtitle}>
            Discover our curated selection of fashion essentials
          </p>
        </div>
      </div>

      {/* Main */}
      <div style={styles.container}>
        {/* Search & Sort */}
        <div style={styles.controlBar}>
          <div style={styles.searchWrapper}>
            <SearchBar onSearch={handleSearch} />
          </div>
          <div style={styles.sortWrapper}>
            <SortDropdown onSort={handleSort} />
          </div>
        </div>

        {/* Count */}
        <div style={styles.countBar}>
          <p style={styles.count}>
            <strong>{filteredProducts.length}</strong>{" "}
            {filteredProducts.length === 1 ? "product" : "products"} available
          </p>
        </div>

        {/* Grid */}
        {filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h2 style={styles.emptyTitle}>No Products Found</h2>
            <p style={styles.emptyText}>
              We couldn't find any products matching your search.
              <br />
              Try adjusting your filters or browse our full collection.
            </p>
            <button
              onClick={() => setFilteredProducts(products)}
              style={styles.resetButton}
            >
              View All Products
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={styles.card}
                onClick={() => navigate(`/products/${product.id}`, { state: { p: product } })}
 // ▶️ Detay sayfasına git
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.08)";
                }}
                role="button"
              >
                {/* Image */}
                <div style={styles.imageBox}>
                  {product.quantity === 0 && (
                    <div style={styles.outOfStockBadge}>OUT OF STOCK</div>
                  )}
                  <img
                    src={
                      product.image_url ||
                      `https://via.placeholder.com/400x500/1a1a1a/ffffff?text=${encodeURIComponent(
                        product.name
                      )}`
                    }
                    alt={product.name}
                    style={styles.image}
                  />
                  <div
                    style={styles.overlay}
                    onClick={(e) => e.stopPropagation()} // iç buton tıklaması kart navigasyonunu tetiklemesin
                  >
                    <button style={styles.quickViewBtn}>Quick View</button>
                  </div>
                </div>

                {/* Info */}
                <div style={styles.info}>
                  <div style={styles.category}>
                    {product.category_name || "Fashion"}
                  </div>
                  <h3 style={styles.productName}>{product.name}</h3>
                  {product.description && (
                    <p style={styles.description}>
                      {product.description.substring(0, 60)}
                      {product.description.length > 60 ? "..." : ""}
                    </p>
                  )}

                  <div style={styles.priceRow}>
                    <span style={styles.price}>
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <span style={styles.stock}>
                      {product.quantity > 0 ? (
                        <span style={styles.inStock}>
                          ● {product.quantity} in stock
                        </span>
                      ) : (
                        <span style={styles.outOfStock}>● Out of stock</span>
                      )}
                    </span>
                  </div>

                  <button
                    style={{
                      ...styles.addToCartBtn,
                      ...(product.quantity === 0 ? styles.disabledBtn : {}),
                    }}
                    disabled={product.quantity === 0}
                  >
                    {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#fafafa", width: "100%" },
  header: {
    backgroundColor: "#1a1a1a",
    color: "white",
    padding: "3rem 1rem",
    textAlign: "center",
    width: "100%",
    backgroundImage: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
  },
  headerContent: { maxWidth: "1200px", margin: "0 auto" },
  title: {
    fontSize: "3rem",
    fontWeight: "800",
    letterSpacing: "0.05em",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },
  subtitle: { fontSize: "1.1rem", color: "#b0b0b0", letterSpacing: "0.03em" },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "3rem 2rem",
    width: "100%",
  },
  controlBar: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "100%",
  },
  searchWrapper: { flex: "1", minWidth: "300px" },
  sortWrapper: { minWidth: "200px" },
  countBar: { marginBottom: "2rem", padding: "1rem 0", borderBottom: "2px solid #e0e0e0" },
  count: { fontSize: "0.95rem", color: "#666", letterSpacing: "0.02em" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem", width: "100%" },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  imageBox: { width: "100%", height: "350px", backgroundColor: "#f5f5f5", overflow: "hidden", position: "relative" },
  image: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
    alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.3s ease",
  },
  quickViewBtn: {
    padding: "0.75rem 1.5rem", backgroundColor: "white", color: "#1a1a1a",
    border: "none", borderRadius: "4px", fontSize: "0.9rem", fontWeight: "600",
    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
  },
  outOfStockBadge: {
    position: "absolute", top: "1rem", right: "1rem",
    backgroundColor: "#dc3545", color: "white", padding: "0.4rem 0.8rem",
    fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.05em", borderRadius: "4px", zIndex: 2,
  },
  info: { padding: "1.5rem" },
  category: {
    fontSize: "0.75rem", color: "#999", textTransform: "uppercase",
    letterSpacing: "0.1em", marginBottom: "0.5rem", fontWeight: "600",
  },
  productName: { fontSize: "1.2rem", fontWeight: "600", marginBottom: "0.5rem", color: "#1a1a1a", lineHeight: "1.4" },
  description: { fontSize: "0.85rem", color: "#666", marginBottom: "1rem", lineHeight: "1.5" },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  price: { fontSize: "1.5rem", fontWeight: "700", color: "#1a1a1a" },
  stock: { fontSize: "0.8rem" },
  inStock: { color: "#28a745", fontWeight: "600" },
  outOfStock: { color: "#dc3545", fontWeight: "600" },
  addToCartBtn: {
    width: "100%", padding: "0.9rem", backgroundColor: "#1a1a1a", color: "white",
    border: "none", borderRadius: "6px", fontSize: "0.9rem", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.3s ease",
  },
  disabledBtn: { backgroundColor: "#ccc", cursor: "not-allowed" },
  loadingContainer: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", backgroundColor: "#fafafa", width: "100%",
  },
  loader: {
    width: "50px", height: "50px", border: "4px solid #f3f3f3",
    borderTop: "4px solid #1a1a1a", borderRadius: "50%", animation: "spin 1s linear infinite",
  },
  loadingText: { marginTop: "1.5rem", fontSize: "1.1rem", color: "#666" },
  emptyState: {
    textAlign: "center", padding: "4rem 2rem", backgroundColor: "white",
    borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", margin: "0 auto", maxWidth: "600px",
  },
  emptyIcon: { fontSize: "4rem", marginBottom: "1rem" },
  emptyTitle: { fontSize: "1.8rem", fontWeight: "700", color: "#1a1a1a", marginBottom: "1rem" },
  emptyText: { fontSize: "1rem", color: "#666", lineHeight: "1.6", marginBottom: "2rem" },
  resetButton: {
    padding: "0.9rem 2rem", backgroundColor: "#1a1a1a", color: "white",
    border: "none", borderRadius: "6px", fontSize: "0.95rem", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer",
  },
};

// (İstersen spin animasyonunu App.css'e taşıyabilirsin)
const styleSheet = document.styleSheets?.[0];
try {
  if (styleSheet) {
    styleSheet.insertRule(
      `@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`,
      styleSheet.cssRules.length
    );
  }
} catch {}

export default Products;
