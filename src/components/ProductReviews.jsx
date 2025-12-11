// src/components/ProductReviews.jsx
import { useEffect, useMemo, useState } from "react";
import { reviewsAPI } from "../services/api";

export default function ProductReviews({ product }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const productId = product?.id ?? product?.product_id ?? product?.productId;

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      if (!productId) {
        setReviews([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await reviewsAPI.getByProduct(productId);
        if (!active) return;

        const payload = res?.data?.data ?? res?.data;
        const items = Array.isArray(payload) ? payload : payload?.reviews || [];

        const toKey = (value) =>
          value === undefined || value === null ? null : String(value).trim();
        const currentKey = toKey(productId);

        const filtered = currentKey
          ? items.filter((item) => {
              const candidate =
                item.product_id ||
                item.productId ||
                item.product?.id ||
                item.product;
              return toKey(candidate) === currentKey;
            })
          : items;

        setReviews(filtered);
      } catch (err) {
        if (!active) return;
        console.error("Reviews could not be loaded", err);
        setError("Yorumlar yüklenemedi. Lütfen tekrar deneyin.");
        setReviews([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReviews();

    return () => {
      active = false;
    };
  }, [productId]);

  const formatDate = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;

    const newReview = {
      id: Date.now(),
      user: "You", // UI-only, gerçek kullanıcı yok
      rating,
      comment: comment.trim(),
      created_at: "just now",
    };

    // En üste ekleyelim
    setReviews((prev) => [newReview, ...prev]);
    setComment("");
    setRating(5);
  };

  return (
    <section style={R.wrap}>
      <div style={R.headerRow}>
        <div>
          <h2 style={R.title}>Comments & Ratings</h2>
          <p style={R.sub}>
            Share your experience with this product. Ratings are from 1 to 5 stars.
          </p>
        </div>

        <div style={R.ratingBox}>
          <div style={R.avgBig}>
            {avgRating ? avgRating.toFixed(1) : "—"}
          </div>
          <div style={R.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={i < Math.round(avgRating) ? R.starFilled : R.starEmpty}>
                ★
              </span>
            ))}
          </div>
          <div style={R.countText}>
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>

      {/* Yeni yorum formu */}
      <form onSubmit={handleSubmit} style={R.form}>
        <div style={R.formRow}>
          <label style={R.label}>Your rating</label>
          <div style={R.starsInput}>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  style={active ? R.starBtnActive : R.starBtn}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>

        <div style={R.formRow}>
          <label style={R.label}>Your comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about the fit, material and overall experience..."
            rows={3}
            style={R.textarea}
          />
        </div>

        <div style={R.formFooter}>
          <p style={R.helperText}>Yeni yorumlar henüz sunucuya kaydedilmiyor.</p>
          <button type="submit" style={R.submitBtn} disabled={!comment.trim()}>
            Submit review
          </button>
        </div>
      </form>

      {/* Yorum listesi */}
      <div style={R.list}>
        {loading && <p style={R.helperText}>Yorumlar yükleniyor...</p>}
        {error && <p style={R.errorText}>{error}</p>}
        {!loading && !error && !reviews.length && (
          <p style={R.helperText}>Bu ürün için henüz yorum yok.</p>
        )}

        {reviews.map((r) => {
          const reviewerName =
            r.user?.name ||
            r.user_name ||
            r.username ||
            r.user ||
            r.user_id ||
            "Anonymous";
          const ratingValue = Number(r.rating) || 0;

          return (
            <div key={r.id} style={R.reviewCard}>
              <div style={R.reviewHead}>
                <div>
                  <div style={R.userName}>{reviewerName}</div>
                  <div style={R.dateText}>{formatDate(r.created_at || r.createdAt)}</div>
                </div>
                <div style={R.reviewStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={i < ratingValue ? R.starFilledSmall : R.starEmptySmall}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p style={R.commentText}>{r.comment}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const R = {
  wrap: {
    marginTop: 40,
    paddingTop: 24,
    borderTop: "1px solid #e5e7eb",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 32,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 420 },

  ratingBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    minWidth: 140,
    textAlign: "right",
  },
  avgBig: { fontSize: 26, fontWeight: 700 },
  starsRow: { marginTop: 4 },
  starFilled: { color: "#f59e0b", fontSize: 16 },
  starEmpty: { color: "#d1d5db", fontSize: 16 },
  countText: { marginTop: 4, fontSize: 12, color: "#6b7280" },

  form: {
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 16,
    background: "#f9fafb",
    marginBottom: 20,
  },
  formRow: { marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 },
  starsInput: { display: "flex", gap: 4 },
  starBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 16,
    cursor: "pointer",
    color: "#9ca3af",
  },
  starBtnActive: {
    border: "1px solid #f59e0b",
    background: "#fffbeb",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 16,
    cursor: "pointer",
    color: "#f59e0b",
  },
  textarea: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 14,
    resize: "vertical",
    outline: "none",
  },
  formFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  helperText: { fontSize: 11, color: "#9ca3af", margin: 0 },
  errorText: { fontSize: 12, color: "#dc2626", margin: 0 },
  submitBtn: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  list: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 },
  reviewCard: {
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 12,
    background: "#fff",
  },
  reviewHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  userName: { fontSize: 14, fontWeight: 600 },
  dateText: { fontSize: 11, color: "#9ca3af" },
  reviewStars: {},
  starFilledSmall: { color: "#f59e0b", fontSize: 14 },
  starEmptySmall: { color: "#e5e7eb", fontSize: 14 },
  commentText: { fontSize: 13, color: "#374151", margin: 0 },
};
