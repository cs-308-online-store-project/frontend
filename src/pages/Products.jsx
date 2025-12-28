// src/pages/Products.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import { categoriesAPI, productsAPI,cartAPI } from "../services/api";

// ✅ Yardımcı: Listeyi sort değerine göre sıralar (UI-only)
function applySort(items, sortKey) {
  const list = [...items];
  switch (sortKey) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "name_asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return list.sort((a, b) => b.name.localeCompare(a.name));
    case "popular":
      return list;
    case "newest":
      return list.sort(
        (a, b) => Number(b.id || 0) - Number(a.id || 0)
      );
    default:
      return list;
  }
}

const getStock = (p = {}) => Number(p.stock ?? 0);

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState(null);
  const [sort, setSort] = useState("newest"); // ✅ yeni sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        // 🔥 Backend’e sort parametresi gönderiyoruz
        const res = await productsAPI.getAll(`?sort=${sort}`);

        const payload = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.products ?? [];

        if (mounted) {
          setProducts(list);
          setFilteredProducts(list);
          if (!list.length) setError("No products found");
        }
      } catch (err) {
        if (mounted) {
          console.error("Products could not be loaded from the API.", err);
          setError("Products could not be loaded from the API.");
          setProducts([]);
          setFilteredProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sort]); // 🔥 sort değişince tekrar API çağrılır

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoriesAPI.getAll();
        const payload = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.categories ?? [];
        const normalized = list
          .map((cat) => {
            const name =
              cat?.name ||
              cat?.title ||
              cat?.label ||
              cat?.category ||
              cat?.category_name ||
              cat?.slug ||
              cat?.id ||
              cat?._id;

            return {
              id:
                cat?.id ||
                cat?._id ||
                cat?.value ||
                cat?.slug ||
                cat?.category_id ||
                name,
              name,
            };
          })
          .filter((cat) => Boolean(cat.name));

        const unique = [];
        const seen = new Set();
        normalized.forEach((cat) => {
          const key = cat.name.toString().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(cat);
          }
        });

        if (mounted) setCategories(unique);
      } catch (err) {
        if (mounted) {
          console.error("Categories could not be loaded from the API.", err);
          setCategories([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSection = (section) =>
    setOpenFilter(openFilter === section ? null : section);

  useEffect(() => {
    let base = [...products];
    if (selectedCategory) {
      const targetId = selectedCategory.id?.toString();
      const targetName = selectedCategory.name?.toString().toLowerCase();

      base = base.filter((p) => {
        const productId =
          p.category?.id?.toString() ||
          p.category?._id?.toString() ||
          p.category_id?.toString() ||
          p.category?.value?.toString();

        const productName =
          (p.category?.name || p.category || p.category_name || p.category_id || "")
            .toString()
            .toLowerCase();

        if (targetId && productId) return productId === targetId;
        if (targetName) return productName === targetName;
        return false;
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
    
      base = base.filter((p) => {
        const name = p.name?.toLowerCase() || "";
        const cat = (p.category?.name || p.category || p.category_name || p.category_id || "")
          .toString()
          .toLowerCase();
    
        // Product Detail alanlarını dahil ediyoruz:
        const description = p.description?.toLowerCase() || "";
        const distributor = p.distributor?.toLowerCase() || "";
        const model = p.model?.toLowerCase() || "";
        const serial = p.serial_number?.toLowerCase() || "";
        const warranty = (p.warranty_status ? "warranty active" : "warranty inactive").toLowerCase();
        const stock = String(p.stock || "").toLowerCase();
    
        return (
          name.includes(q) ||
          cat.includes(q) ||
          description.includes(q) ||
          distributor.includes(q) ||
          model.includes(q) ||
          serial.includes(q) ||
          warranty.includes(q) ||
          stock.includes(q)
        );
      });
    }
    
    setFilteredProducts(applySort(base, sort));
  }, [products, searchTerm, sort, selectedCategory]);

  const handleSearch = (term) => setSearchTerm(term);

  const handleSortChange = (sortKey) => setSort(sortKey || "newest");

const handleAddToCart = async (product) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add items to cart");
      navigate("/login");  
      return;
    }

    const productId = product.id || product._id;

    // 1️⃣ BACKEND
    await cartAPI.addToCart(productId, 1);

    // 2️⃣ FRONTEND (Navbar badge source)
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));

    // 3️⃣ Notify Navbar
    window.dispatchEvent(new Event("cartUpdated"));

    // 4️⃣ Toast
    setNotification("Added to bag");
    setTimeout(() => setNotification(""), 2000);

  } catch (error) {
    console.error("Add to cart error:", error);
    alert(error.response?.data?.error || "Failed to add to cart");
  }
};



  if (loading) return <div style={{ padding: "4rem" }}>Loading...</div>;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>PREMIUM COLLECTION</h1>
        <p style={styles.subtitle}>
          Discover our curated selection of fashion essentials
        </p>
      </div>

      <div style={styles.layout}>
        {/* FILTER SIDEBAR */}
        <div style={styles.sidebar}>
          <h2 style={styles.filterTitle}>FİLTRELER</h2>

          {/* Gender */}
          <div style={styles.filterSection}>
            <div
              style={styles.filterHeader}
              onClick={() => toggleSection("gender")}
            >
              <span>Cinsiyet</span>
              <span style={styles.plus}>+</span>
            </div>
            {openFilter === "gender" && (
              <div style={styles.filterItems}>
                <div style={styles.filterItem}>Women</div>
                <div style={styles.filterItem}>Men</div>
                <div style={styles.filterItem}>Unisex</div>
              </div>
            )}
          </div>

          {/* Category */}
          <div style={styles.filterSection}>
            <div
              style={styles.filterHeader}
              onClick={() => toggleSection("category")}
            >
              <span>Kategoriler</span>
              <span style={styles.plus}>+</span>
            </div>
            {openFilter === "category" && (
              <div style={styles.filterItems}>
                <div
                  style={{
                    ...styles.filterItem,
                    ...(!selectedCategory ? styles.activeFilter : {}),
                  }}
                  onClick={() => setSelectedCategory(null)}
                >
                  Tümü
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat.id || cat.name}
                    style={{
                      ...styles.filterItem,
                      ...(selectedCategory?.name?.toString().toLowerCase() ===
                        cat.name.toString().toLowerCase()
                        ? styles.activeFilter
                        : {}),
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Size */}
          <div style={styles.filterSection}>
            <div
              style={styles.filterHeader}
              onClick={() => toggleSection("size")}
            >
              <span>Beden</span>
              <span style={styles.plus}>+</span>
                        </div>
            {openFilter === "size" && (
              <div style={styles.filterItems}>
                <div style={styles.filterItem}>XS</div>
                <div style={styles.filterItem}>S</div>
                <div style={styles.filterItem}>M</div>
                <div style={styles.filterItem}>L</div>
                <div style={styles.filterItem}>XL</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          <div style={styles.topBar}>
            <SearchBar onSearch={handleSearch} />
            {/* ✅ SortDropdown artık gerçekten sort ediyor */}
            <SortDropdown onSort={handleSortChange} />
          </div>

          <p style={styles.countText}>
            {filteredProducts.length} products found
          </p>

          {error && !loading && (
            <div style={{ margin: "1rem 0", color: "#b91c1c" }}>{error}</div>
          )}

          {/* PRODUCT GRID */}
          <div style={styles.grid}>
            {filteredProducts.map((product) => {
              const id = product.id;
              const image =
                product.image_url ||
                `https://picsum.photos/seed/${id || "product"}/800/800`;
                const productIdLabel = id ? `ID: #${id}` : "";
                const targetPath = id ? `/products/${id}` : "/products";
                

              return (
                <div
                  key={id}
                  style={styles.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 25px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 6px rgba(0,0,0,0.06)";
                  }}
                  onClick={() =>
                    navigate(targetPath, {
                      state: { p: product },
                    })
                  }
                >
                  <div style={styles.imageBox}>
                    {(product.stock ?? 0) === 0 && (
                      <div style={styles.outOfStockBadge}>OUT OF STOCK</div>
                    )}
                    <img
                      src={image}
                      alt={product.name}
                      style={styles.image}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.07)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    />
                  </div>

                  <div style={styles.info}>
                  <div style={styles.category}>{productIdLabel}</div>
                  <div style={styles.name}>{product.name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span style={styles.price}>${Number(product.price).toFixed(2)}</span>
                      <button
                          style={styles.addToCartButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          Add to Bag
                        </button>

                      </div>
                  </div>
                </div>
              );
            })}
          </div>
            {notification && (
              <div style={styles.toast}>
                <span style={styles.toastIcon}>✓</span>
                <span>{notification}</span>
              </div>
            )}



        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ */
/* STYLES                               */
/* ------------------------------------ */
const styles = {
  page: { background: "#fafafa", minHeight: "100vh", width: "100%" },

  header: {
    background: "#1a1a1a",
    padding: "3rem 1rem",
    color: "white",
    textAlign: "center",
  },

  title: {
    fontSize: "3rem",
    fontWeight: 800,
  },

  subtitle: {
    fontSize: "1.1rem",
    color: "#b5b5b5",
    marginTop: ".4rem",
  },

  layout: {
    display: "flex",
    gap: "2rem",
    padding: "2rem",
    width: "100%",
    boxSizing: "border-box",
  },

  /* FILTER SIDEBAR */
  sidebar: {
    width: "340px",
    background: "white",
    padding: "2.5rem",
    borderRadius: "16px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
    position: "sticky",
    top: "130px",
    height: "fit-content",
    transform: "scale(1.05)",
  },

  filterTitle: {
    fontSize: "2rem",
    fontWeight: 900,
    marginBottom: "2rem",
  },

  filterSection: {
    marginBottom: "2.2rem",
    borderBottom: "1px solid #ddd",
    paddingBottom: "1.2rem",
  },

  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1.3rem",
  },

  plus: {
    fontSize: "1.6rem",
    fontWeight: 700,
  },

  filterItems: {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: ".8rem",
  },

  filterItem: {
    fontSize: "1.2rem",
    cursor: "pointer",
    color: "#333",
  },

  activeFilter: {
    fontWeight: "800",
    color: "#111",
  },

  /* RIGHT SIDE */
  right: { flex: 1 },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    gap: "1rem",
  },

  countText: { marginBottom: "1rem", color: "#555" },

  /* PRODUCT GRID — FIXED 4 PER ROW */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
    gap: "2rem",
  },

  /* PRODUCT CARD */
  card: {
    background: "white",
    borderRadius: "14px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "0.25s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    border: "1px solid #eee",
  },

  imageBox: {
    height: "260px",
    position: "relative",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform .3s ease",
  },

  outOfStockBadge: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "#d9534f",
    padding: ".3rem .7rem",
    borderRadius: "4px",
    color: "white",
    fontSize: ".7rem",
    fontWeight: 700,
  },

  info: { padding: "1rem" },

  category: {
    fontSize: ".8rem",
    color: "#777",
    textTransform: "uppercase",
    marginBottom: ".2rem",
  },

  name: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: ".3rem",
  },

  price: {
    fontSize: "1.15rem",
    fontWeight: 800,
  },

  addToCartButton: {
    marginTop: "0.5rem",
    padding: "0.55rem 1rem",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "black",
    background: "white",
    border: "1px solid black",
    borderRadius: "4px",
    cursor: "pointer",
  },
  
  notification: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#d1e7dd",
    color: "#0f5132",
    borderRadius: "0.375rem",
    border: "1px solid #badbcc",
    fontSize: "1rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  toast: {
  position: "fixed",
  top: "50%",
  left: "50%",
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",

  backgroundColor: "#111",
  color: "white",

  padding: "0.75rem 1.2rem",
  borderRadius: "10px",

  fontSize: "0.95rem",
  fontWeight: 600,

  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  zIndex: 9999,
},

toastIcon: {
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  backgroundColor: "#22c55e", // ✅ green tick
  color: "white",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  fontSize: "0.85rem",
  fontWeight: 800,
},


};
