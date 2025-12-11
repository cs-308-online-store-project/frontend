import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { cartAPI, productsAPI } from "../services/api";
import ProductReviews from "../components/ProductReviews";

export default function ProductDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const initialProduct = state?.p || state?.product || null;
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [hero, setHero] = useState(initialProduct?.image_url || "");

  const stock = Math.max(0, Number(product?.stock ?? 0));
  const out = stock === 0;

  const gallery = useMemo(() => {
    const base =
      product?.image_url ||
      `https://picsum.photos/seed/${product?.id || id || "product"}/1200/1200`;
    const extra = Array.isArray(product?.images) ? product.images : [];
    return [base, ...extra].filter(Boolean);
  }, [product, id]);

  useEffect(() => {
    let active = true;

    (async () => {
      const fromState = state?.p || state?.product;
      if (fromState) {
        hydrate(fromState);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await productsAPI.getById(id);
        const data = res?.data?.data ?? res?.data;
        if (!active) return;
        hydrate(data);
      } catch (err) {
        if (!active) return;
        setError("Ürün yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function hydrate(p) {
    if (!p) return;
    setProduct(p);
    setHero(
      p.image_url || `https://picsum.photos/seed/${p?.id || "product"}/1200/1200`
    );
    setQty(1);
  }

  async function addToCart() {
    if (out) return;
    
    console.log('🛒 Adding to cart:', {
      productId: product.id,
      quantity: qty,
      productIdType: typeof product.id,
      quantityType: typeof qty,
      product: product
    });
    
    try {
      // Backend'e ekle
      const response = await cartAPI.addToCart(Number(product.id), Number(qty));
      console.log('✅ Cart response:', response.data);
      
      // ✅ Cart'ı yeniden çek ve localStorage'a kaydet
      const cartResponse = await cartAPI.getCart();
      const cartItems = Array.isArray(cartResponse.data.items) ? cartResponse.data.items : [];
      localStorage.setItem("cart", JSON.stringify(cartItems));
      
      // ✅ Navbar'a haber ver
      window.dispatchEvent(new Event("cartUpdated"));
      
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

  if (loading)
    return (
      <PageShell>
        <div style={S.skelHero} />
        <div style={S.skelCard} />
      </PageShell>
    );
  if (!product)
    return (
      <PageShell>
        <h2>Product not found</h2>
      </PageShell>
    );

  const availabilityText = out ? "Sold Out" : "In Stock";
  const availabilityStyle = out ? S.availabilityDanger : S.availabilityOk;
  const totalPrice = (Number(product.price) || 0) * qty;
  const categoryLabel =
    product.category?.name ||
    product.category ||
    product.category_name ||
    product.category_id ||
    "Category";
  const description = product.description || "Bu ürün için açıklama bulunmuyor.";

  const detailFields = [
    { label: "Kategori", value: categoryLabel },
    { label: "Model", value: product.model },
    { label: "Seri Numarası", value: product.serial_number },
    { label: "Distribütör", value: product.distributor },
    { label: "Garanti", value: product.warranty_status ? "Aktif" : "Pasif" },
    { label: "Stok", value: product.stock },
    { label: "Oluşturulma", value: product.created_at },
  ].filter((item) => item.value !== undefined && item.value !== null && item.value !== "");

  return (
    <div style={S.container}>
      <div style={S.breadcrumb}>
        <Link to="/products" style={S.link}>
          Store
        </Link>
        <span style={S.crumbSep}>/</span>
        <span style={S.muted}>{categoryLabel}</span>
        <span style={S.crumbSep}>/</span>
        <span>{product.name}</span>
      </div>

      <div style={S.topGrid}>
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

        <div style={S.rightCol}>
          <div style={S.brand}>{product.distributor || categoryLabel}</div>
          <h1 style={S.title}>{product.name}</h1>
          <div style={S.price}>{currency(product.price)}</div>
          <div style={{ ...S.availability, ...availabilityStyle }}>
            {availabilityText}
            {!out && stock ? ` • ${stock} adet stokta` : ""}
          </div>

          <p style={S.description}>{description}</p>

          <div style={{ ...S.row, marginTop: 12 }}>
            <div style={S.qtyBox}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={out || qty <= 1}
                style={S.qtyBtn}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(1, stock || 1)}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      1,
                      Math.min(Number(e.target.value) || 1, Math.max(1, stock || 1))
                    )
                  )
                }
                disabled={out}
                style={S.qtyInput}
              />
              <button
                onClick={() => setQty((q) => Math.min(Math.max(1, stock || 1), q + 1))}
                disabled={out || qty >= Math.max(1, stock || 1)}
                style={S.qtyBtn}
              >
                +
              </button>
            </div>
          </div>

          <div style={S.totalRow}>
            <span>Toplam ({qty} adet)</span>
            <span style={S.totalPrice}>{currency(totalPrice)}</span>
          </div>

          <div style={S.actions}>
            <button
              onClick={addToCart}
              disabled={out}
              style={{ ...S.primaryBtn, ...(out ? S.btnDisabled : {}) }}
            >
              {out ? "Out of stock" : "Add To Bag"}
            </button>
          </div>

          <div style={S.etaBox}>
            <div style={S.muted}>Estimated delivery</div>
            <div>Nov 18 – Nov 21</div>
          </div>
        </div>
      </div>

      <div style={S.detailsGrid}>
        <div>
          <div style={S.kicker}>THE DETAILS</div>
          <div style={S.detailsName}>
            {product.distributor || categoryLabel} <br /> {product.name}
          </div>

          {detailFields.length > 0 && (
            <div style={S.detailTable}>
              {detailFields.map((item) => (
                <div key={item.label} style={S.detailRow}>
                  <span style={S.detailLabel}>{item.label}</span>
                  <span style={S.detailValue}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div style={S.subTitle}>Description</div>
          <p style={S.muted}>{description}</p>
        </div>

        <div>
          <div style={S.subTitle}>Availability</div>
          <p style={S.muted}>
            {availabilityText}
            {!out && stock ? ` (${stock} adet stokta)` : ""}
          </p>

          <div style={S.subTitle}>Category</div>
          <p style={S.muted}>{categoryLabel}</p>
        </div>
      </div>

      <ProductReviews product={product} />

      <Accordion
        items={[
          { title: "SIZE & FIT", content: "True to size. Model is 185 cm and wears M." },
          {
            title: "DELIVERY, RETURNS & SELLER",
            content: "Free returns within 14 days. Ships with trusted couriers.",
          },
        ]}
      />

      <div style={{ marginTop: 28 }}>
        <Link to="/products" style={S.link}>
          &larr; Back to Products
        </Link>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>{error}</div>
      )}
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={S.accWrap}>
      {items.map((it, i) => (
        <div key={i} style={S.accItem}>
          <button style={S.accHead} onClick={() => setOpen(open === i ? -1 : i)}>
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
  const num = Number(v);
  if (!Number.isFinite(num)) return v;
  return `${num.toFixed(2)} €`;
}

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
  description: { color: "#374151", margin: "8px 0 12px", lineHeight: 1.5 },

  row: { display: "flex", alignItems: "center", gap: 12 },

  qtyBox: { display: "flex", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 38,
    height: 38,
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 10,
    cursor: "pointer",
  },
  qtyInput: {
    width: 64,
    height: 38,
    textAlign: "center",
    border: "1px solid #d1d5db",
    borderRadius: 10,
  },

  totalRow: { display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 600 },
  totalPrice: { fontSize: 18 },

  availability: { margin: "4px 0 12px", fontWeight: 700 },
  availabilityOk: { color: "#15803d" },
  availabilityDanger: { color: "#b91c1c" },

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
  detailTable: { display: "flex", flexDirection: "column", gap: 6, margin: "10px 0 18px" },
  detailRow: { display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #e5e7eb", padding: "6px 0" },
  detailLabel: { color: "#6b7280", fontSize: 13 },
  detailValue: { fontWeight: 700 },
  subTitle: { fontSize: 14, fontWeight: 700, marginTop: 8, marginBottom: 6 },
  accWrap: { marginTop: 24, borderTop: "1px solid #e5e7eb" },
  accItem: { borderBottom: "1px solid #e5e7eb" },
  accHead: {
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border: "none",
    padding: "18px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    cursor: "pointer",
  },
  accIcon: { color: "#6b7280" },
  accBody: { padding: "0 0 18px", color: "#374151" },

  skelHero: { height: 520, background: "#eef2f7", borderRadius: 10, marginBottom: 24 },
  skelCard: { height: 320, background: "#eef2f7", borderRadius: 10 },
};