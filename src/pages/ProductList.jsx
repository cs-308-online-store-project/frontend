import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../services/api";

export default function ProductList() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await productsAPI.getAll();    // GET /products
        const payload = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.products ?? [];
        if (mounted) {
          setAll(list);
          if (!list.length) setError("No products found");
        }
      } catch (err) {
        if (mounted) {
          setError("Products could not be loaded from the API.");
          setAll([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const s = new Set(
      all
        .map((p) => p.category?.name || p.category || p.category_name || p.category_id)
        .filter(Boolean)
    );
    return ["All", ...Array.from(s)];
  }, [all]);

  const shown = useMemo(
    () =>
      activeCat === "All"
        ? all
        : all.filter(
            (p.category?.name || p.category || p.category_name || p.category_id) ===
            activeCat
          ),
    [all, activeCat]
  );

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

        {!loading && error && (
          <div className="empty">{error}</div>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="empty">No products found in <b>{activeCat}</b>.</div>
        )}

        {!loading && shown.length > 0 && (
          <div className="grid">
            {shown.map(p => <ProductCard key={p._id || p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}