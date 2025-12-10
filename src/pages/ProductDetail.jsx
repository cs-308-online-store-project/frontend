// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { productsAPI, cartAPI } from "../services/api";

import ProductReviews from "../components/ProductReviews";


export default function ProductDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(state?.p || null);
  const [loading, setLoading] = useState(!state?.p);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [wish, setWish] = useState(false);
  const [hero, setHero] = useState("");

  const stock = product?.quantity_in_stock ?? product?.stock ?? product?.quantity ?? 0;
  const out = stock <= 0;

  const sizes = useMemo(
    () => (product?.sizes?.length ? product.sizes : ["XS", "S", "M", "L", "XL"]),
    [product]
  );

  const gallery = useMemo(() => {
    const base =
      product?.image_url ||
      product?.image ||
      `https://picsum.photos/seed/${id}/1400/1400`;
    const extra = Array.isArray(product?.images) ? product.images : [];
    return [base, ...extra].filter(Boolean);
  }, [product, id]);

  useEffect(() => {
    let ok = true;
    (async () => {
      if (state?.p) {
        hydrate(state.p);
        return;
      }
      try {
        setLoading(true);
        const { data } = await productsAPI.getById(id);
        if (!ok) return;
        hydrate(data);
      } catch {
        if (!ok) return;
        // Fallback ver
        hydrate({
          id,
          name: `Product #${id}`,
          description:
            "Premium fabric. Modern fit. Everyday comfort with clean aesthetics.",
          price: 69.9,
          quantity: 0,
          category_name: "Apparel",
        });
        setError("Live API bulunamadı, örnek veri gösteriliyor.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function hydrate(p) {
    setProduct(p);
    setSize(p?.sizes?.[0] || "M");
    setHero(p?.image_url || p?.image || `https://picsum.photos/seed/${p?.id}/1400/1400`);
  }

  // ✅ DEBUG: Backend'e bağlı addToCart fonksiyonu
  async function addToCart() {
    if (out) return;
    
    // Debug: ne gönderiyoruz bakalım
    console.log('🛒 Adding to cart:', {
      productId: product.id,
      quantity: qty,
      productIdType: typeof product.id,
      quantityType: typeof qty,
      product: product
    });
    
    try {
      // Backend'e gönder - Number'a çevir
      const response = await cartAPI.addToCart(Number(product.id), Number(qty));
      
      console.log('✅ Cart response:', response.data);
      
      // Başarılı olursa kullanıcıya bildir
      alert("✅ Added to bag 🛍️");
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        alert("⚠️ Please login first");
        navigate('/login');
      } else if (error.response?.status === 400) {
        alert("❌ " + (error.response?.data?.message || "Invalid product or quantity"));
      } else {
        alert("❌ Failed to add to cart. Please try again.");
      }
    }
  }

  if (loading) return <PageShell><div style={S.skelHero} /><div style={S.skelCard} /></PageShell>;
  if (!product) return <PageShell><h2>Product not found</h2></PageShell>;

  return (
    <div style={S.container}>
      {/* Breadcrumb */}
      <div style={S.breadcrumb}>
        <Link to="/products" style={S.link}>Store</Link>
        <span style={S.crumbSep}>/</span>
        <span style={S.muted}>{product.category_name || "Category"}</span>
        <span style={S.crumbSep}>/</span>
        <span>{product.name}</span>
      </div>

      {/* Top Grid */}
      <div style={S.topGrid}>
        {/* LEFT: Gallery */}
        <div style={S.leftCol}>
          <div style={S.heroBox}>
            <img src={hero || gallery[0]} alt={product.name} style={S.heroImg} />
            {out && <div style={S.ribbon}>OUT OF STOCK</div>}
          </div>

          {gallery.length > 1 && (
            <div style={S.thumbRow}>
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setHero(src)}
                  style={{ ...S.thumbBtn, ...(src === hero ? S.thumbActive : {}) }}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} style={S.thumbImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Buy panel */}
        <div style={S.rightCol}>
          <div style={S.brand}>{product.brand || product.category_name || "Brand"}</div>
          <h1 style={S.title}>{product.name}</h1>
          <div style={S.price}>{currency(product.price)}</div>

          {/* NEW: Stock info */}
          <div style={S.stockRow}>
            {out ? (
              <span style={S.stockOut}>Out of stock</span>
            ) : (
              <span style={S.stockOk}>
                {stock} in stock
                {stock <= 5 && " — almost gone!"}
              </span>
            )}
          </div>
                    

          <div style={S.row}>
            <div style={S.selectWrap}>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={out}
                style={S.select}
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={S.chev}>▾</span>
            </div>
            <button onClick={() => alert("Size guide to be implemented")} style={S.sizeGuide}>
              Size guide
            </button>
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <div style={S.qtyBox}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={out} style={S.qtyBtn}>−</button>
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
                }
                disabled={out}
                style={S.qtyInput}
              />
              <button onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={out} style={S.qtyBtn}>+</button>
            </div>
          </div>

          <div style={S.actions}>
            <button
              onClick={addToCart}
              disabled={out}
              style={{ ...S.primaryBtn, ...(out ? S.btnDisabled : {}) }}
            >
              {out ? "Out of stock" : "Add To Bag"}
            </button>
            <button
              onClick={() => setWish((v) => !v)}
              style={S.ghostBtn}
              aria-pressed={wish}
            >
              Wishlist {wish ? "♥" : "♡"}
            </button>
          </div>

          <div style={S.etaBox}>
            <div style={S.muted}>Estimated delivery</div>
            <div>Nov 18 – Nov 21</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={S.muted}>Also available in</div>
            <div style={S.alsoRow}>
              <button onClick={() => setHero(gallery[0])} style={S.alsoBtn}>
                <img src={gallery[0]} alt="variant" style={S.alsoImg} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div style={S.detailsGrid}>
        <div>
          <div style={S.kicker}>THE DETAILS</div>
          <div style={S.detailsName}>
            {product.brand || "Brand"} <br /> {product.name}
          </div>

          <div style={S.subTitle}>Highlights</div>
          <ul style={S.bullets}>
            <li>black</li>
            <li>quilted design</li>
            <li>zip fastening</li>
            <li>high neck</li>
            <li>sleeveless</li>
            <li>logo patch</li>
          </ul>
        </div>

        <div>
          <div style={S.subTitle}>Composition</div>
          <p style={S.muted}>Outer: Polyamide 100%</p>
          <p style={S.muted}>Lining: Polyester 100%</p>
          <p style={S.muted}>Filling: Duck Down 90%, Duck Feathers 10%</p>

          <div style={S.subTitle}>Washing instructions</div>
          <p style={S.muted}>Machine Wash</p>

          <div style={S.subTitle}>SKU</div>
          <p style={S.muted}>{product.sku || `FF-${product.id}`}</p>
        </div>
      </div>

            {/* COMMENTS & RATINGS (UI only) */}
            <ProductReviews product={product} />

{/* ACCORDION */}
<Accordion
  items={[
    { title: "SIZE & FIT", content: "True to size. Model is 185 cm and wears M." },
    {
      title: "DELIVERY, RETURNS & SELLER",
      content: "Free returns within 14 days. Ships with trusted couriers.",
    },
  ]}
/>



      {/* ACCORDION */}
      <Accordion
        items={[
          { title: "SIZE & FIT", content: "True to size. Model is 185 cm and wears M." },
          {
            title: "DELIVERY, RETURNS & SELLER",
            content: "Free returns within 14 days. Ships with trusted couriers.",
          },
        ]}
      />

      {/* Back link */}
      <div style={{ marginTop: 28 }}>
        <Link to="/products" style={S.link}>&larr; Back to Products</Link>
      </div>

      {/* Optional error note */}
      {error && <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>{error}</div>}
    </div>
  );
}

/* ---------- helpers ---------- */

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={S.accWrap}>
      {items.map((it, i) => (
        <div key={i} style={S.accItem}>
          <button
            style={S.accHead}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span>{it.title}</span>
            <span style={S.accIcon}>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <div style={S.accBody}>{it.content}</div>}
        </div>
      ))}
    </div>
  );
}

function PageShell({ children }) {
  return <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px" }}>{children}</div>;
}

function currency(v) {
  if (typeof v !== "number") return v;
  return `${v.toFixed(2)} €`;
}

/* ---------- inline style system ---------- */
const S = {
  container: { maxWidth: 1240, margin: "0 auto", padding: 24 },
  link: { color: "#111", textDecoration: "none" },
  muted: { color: "#6b7280" },
  breadcrumb: { display: "flex", gap: 8, alignItems: "center", color: "#6b7280", marginBottom: 18 },
  crumbSep: { color: "#9ca3af" },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 40,
  },
  leftCol: {},
  rightCol: {},

  heroBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
    position: "relative",
  },
  heroImg: { width: "100%", display: "block", objectFit: "cover" },
  ribbon: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "#111",
    color: "#fff",
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: "0.08em",
    padding: "6px 10px",
  },

  thumbRow: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  thumbBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: 2,
    cursor: "pointer",
  },
  thumbActive: { outline: "2px solid #111" },
  thumbImg: { width: 84, height: 100, objectFit: "cover", display: "block", borderRadius: 8 },

  brand: { fontSize: 14, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: 700, margin: "0 0 6px" },
  price: { fontSize: 22, fontWeight: 700, margin: "8px 0 16px" },

  row: { display: "flex", alignItems: "center", gap: 12 },
  selectWrap: { position: "relative", flex: 1 },
  select: {
    width: "100%",
    appearance: "none",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
  },
  chev: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" },
  sizeGuide: { background: "none", border: "none", color: "#111", cursor: "pointer" },

  qtyBox: { display: "flex", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 38, height: 38, border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, cursor: "pointer",
  },
  qtyInput: {
    width: 64, height: 38, textAlign: "center", border: "1px solid #d1d5db", borderRadius: 10,
  },

  actions: { display: "flex", gap: 12, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostBtn: {
    background: "#fff",
    color: "#111",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
    minWidth: 160,
  },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },

  etaBox: { marginTop: 16 },

  alsoRow: { display: "flex", gap: 8, marginTop: 8 },
  alsoBtn: { border: "1px solid #e5e7eb", padding: 2, borderRadius: 8, background: "#fff" },
  alsoImg: { width: 52, height: 66, objectFit: "cover", display: "block" },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 60,
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid #e5e7eb",
  },
  kicker: { fontSize: 12, letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 },
  detailsName: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  subTitle: { fontSize: 14, fontWeight: 700, marginTop: 8, marginBottom: 6 },
  bullets: { margin: "8px 0 0 16px", padding: 0, listStyle: "disc" },

  accWrap: { marginTop: 24, borderTop: "1px solid #e5e7eb" },
  accItem: { borderBottom: "1px solid #e5e7eb" },
  accHead: {
    width: "100%", textAlign: "left", background: "#fff", border: "none", padding: "18px 0",
    display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, cursor: "pointer",
  },
  accIcon: { color: "#6b7280" },
  accBody: { padding: "0 0 18px", color: "#374151" },

  // skeletons
  skelHero: { height: 520, background: "#eef2f7", borderRadius: 10, marginBottom: 24 },
  skelCard: { height: 320, background: "#eef2f7", borderRadius: 10 },
};