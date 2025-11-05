import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../services/api";

const MOCK = [
  { id: 1, name: "Denim Jacket", price: 89.90, quantity: 8,  category: "Jackets",   image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format" },
  { id: 2, name: "Wide Jeans",   price: 69.90, quantity: 0,  category: "Jeans",     image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=800&auto=format" },
  { id: 3, name: "Sweatshirt",   price: 49.90, quantity: 14, category: "Sweatshirts",image:"https://images.unsplash.com/photo-1520975940209-6c92867fd0f0?q=80&w=800&auto=format" },
  { id: 4, name: "T-Shirt",      price: 24.90, quantity: 30, category: "T-Shirts",  image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format" },
  { id: 5, name: "Pants",        price: 59.90, quantity: 6,  category: "Pants",     image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=800&auto=format" },
  { id: 6, name: "Hoodie",       price: 54.90, quantity: 10, category: "Sweatshirts",image:"https://images.unsplash.com/photo-1520975940209-6c92867fd0f0?q=80&w=800&auto=format" },
];

export default function ProductList() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getAll();    // GET /products
        const list = Array.isArray(res.data) ? res.data : [];
        setAll(list.length ? list : MOCK);         // API boşsa MOCK kullan
      } catch {
        setAll(MOCK);                              // API hata → MOCK
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set(all.map(p => p.category).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [all]);

  const shown = useMemo(() => (
    activeCat === "All" ? all : all.filter(p => p.category === activeCat)
  ), [all, activeCat]);

  return (
    <div className="page">
      <aside className="sidebar">
        <h2>Categories</h2>
        <ul>
          {categories.map(c => (
            <li key={c}>
              <button
                className={`cat-btn ${activeCat === c ? "active" : ""}`}
                onClick={() => setActiveCat(c)}
              >{c}</button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="content">
        <div className="header">
          <h1>Products</h1>
          <div className="muted">{activeCat} • {shown.length} item(s)</div>
        </div>

        {loading && <div className="center h48"><div className="spinner" /></div>}

        {!loading && shown.length === 0 && (
          <div className="empty">No products found in <b>{activeCat}</b>.</div>
        )}

        {!loading && shown.length > 0 && (
          <div className="grid">
            {shown.map(p => <ProductCard key={p._id || p.id} p={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
