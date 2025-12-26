import { useEffect, useMemo, useState } from "react";
import { productsAPI, salesManagerAPI } from "../../services/api";

function normalizeProducts(data) {
  // backend farklı formatlarda dönebilir diye hepsini toparlıyoruz
  // 1) Direkt array
  if (Array.isArray(data)) return data;

  // 2) { products: [...] }
  if (Array.isArray(data?.products)) return data.products;

  // 3) { rows: [...] }
  if (Array.isArray(data?.rows)) return data.rows;

  // 4) { data: [...] }
  if (Array.isArray(data?.data)) return data.data;

  // 5) Hiçbiri değilse boş array
  return [];
}

export default function SalesPricing() {
  const [products, setProducts] = useState([]); // ✅ always array
  const [selected, setSelected] = useState(() => new Set());
  const [discountRate, setDiscountRate] = useState("");
  const [priceEdits, setPriceEdits] = useState({}); // { [id]: "123" }

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const fetchProducts = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await productsAPI.getAll();

      const list = normalizeProducts(res?.data);
      setProducts(list);

      // seçili id'ler artık listede yoksa temizle (opsiyonel ama iyi)
      setSelected((prev) => {
        const next = new Set();
        const ids = new Set(list.map((p) => p.id));
        prev.forEach((id) => {
          if (ids.has(id)) next.add(id);
        });
        return next;
      });
    } catch (e) {
      setProducts([]);
      setMsg(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setEditPrice = (id, value) => {
    setPriceEdits((prev) => ({ ...prev, [id]: value }));
  };

  const savePrice = async (id) => {
    const raw = priceEdits[id];
    const price = Number(raw);

    if (!Number.isFinite(price) || price < 0) {
      setMsg("❌ Invalid price (must be >= 0)");
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      await salesManagerAPI.updatePrice(id, price);

      setMsg("✅ Price updated");
      // input'u temizle
      setPriceEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      await fetchProducts();
    } catch (e) {
      setMsg(e?.response?.data?.message || "❌ Price update failed");
    } finally {
      setBusy(false);
    }
  };

  const applyDiscountToSelected = async () => {
    const rate = Number(discountRate);

    if (selectedIds.length === 0) {
      setMsg("❌ Select at least 1 product");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setMsg("❌ Discount rate must be between 0 and 100");
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      // burada backend endpointin product bazlı ise promise.all doğru
      await Promise.all(
        selectedIds.map((id) => salesManagerAPI.applyDiscount(id, rate))
      );

      setMsg(`✅ Discount applied to ${selectedIds.length} products`);
      setSelected(new Set());
      setDiscountRate("");

      await fetchProducts();
    } catch (e) {
      setMsg(e?.response?.data?.message || "❌ Discount apply failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ color: "white" }}>Loading products...</p>;

  return (
    <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 12 }}>Pricing & Discounts</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          type="number"
          placeholder="Discount rate (%)"
          value={discountRate}
          onChange={(e) => setDiscountRate(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #444",
            width: 200,
            background: "rgba(0,0,0,0.2)",
            color: "white",
          }}
        />

        <button
          onClick={applyDiscountToSelected}
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          Apply Discount to Selected
        </button>

        <button
          onClick={fetchProducts}
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #666",
            background: "transparent",
            color: "white",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          Refresh
        </button>

        <span style={{ opacity: 0.85 }}>
          Selected: <b>{selectedIds.length}</b>
        </span>
      </div>

      {msg && <p style={{ marginBottom: 12 }}>{msg}</p>}

      {products.length === 0 ? (
        <p style={{ opacity: 0.85 }}>No products found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <th style={{ padding: 10 }}>Select</th>
                <th style={{ padding: 10 }}>Product</th>
                <th style={{ padding: 10 }}>Current Price</th>
                <th style={{ padding: 10 }}>New Price</th>
                <th style={{ padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(products) ? products : []).map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <td style={{ padding: 10 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  </td>

                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      ID: {p.id}
                    </div>
                  </td>

                  <td style={{ padding: 10 }}>{p.price}</td>

                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      value={priceEdits[p.id] ?? ""}
                      onChange={(e) => setEditPrice(p.id, e.target.value)}
                      placeholder="Enter new price"
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #444",
                        width: 160,
                        background: "rgba(0,0,0,0.2)",
                        color: "white",
                      }}
                    />
                  </td>

                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => savePrice(p.id)}
                      disabled={busy}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "none",
                        cursor: busy ? "not-allowed" : "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Save Price
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
