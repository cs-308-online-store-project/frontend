// src/components/ProductFormModal.jsx
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function ProductFormModal({
  product,
  onClose,
  onSave,
  categories = [],
}) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: product?.name || "",
    model: product?.model || "",
    serial_number: product?.serial_number || "",
    description: product?.description || "",
    price: product?.price || "",
    quantity_in_stock: product?.quantity_in_stock ?? "",
    warranty_status: Boolean(product?.warranty_status) || false,
    distributor: product?.distributor || "",
    category_id: product?.category_id || product?.category?.id || "",
    image_url: product?.image_url || "",
  });

  const [imagePreview, setImagePreview] = useState(
    product?.image_url || ""
  );
  const [error, setError] = useState("");
  const normalizedCategories = categories.map((cat) => {
    if (typeof cat === "string" || typeof cat === "number") {
      return { value: cat, label: String(cat) };
    }

    return {
      value: cat.id ?? cat.value ?? cat.name,
      label: cat.name ?? cat.label ?? String(cat.id ?? ""),
    };
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setImagePreview(src);
      updateField("image_url", src);
    }
  }

  function handleSubmit() {
    if (
      !form.name ||
      !form.price ||
      !form.image_url
    ) {
      setError("Please fill all required fields marked with *.");
      showToast("Please fill all required fields.", "error");
      return;
    }
    if (form.price <= 0) {
      setError("Price must be greater than 0.");
      showToast("Price must be more than 0!", "error");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock) || 0,
      category_id: form.category_id || null,
      warranty_status: Boolean(form.warranty_status),
    };

    onSave(payload);
    showToast(product ? "Product updated!" : "Product added!", "success");
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h2 style={S.title}>{product ? "Edit Product" : "Add Product"}</h2>

        {error && <p style={S.error}>{error}</p>}

        <div style={S.formGrid}>
          <input
            placeholder="Name *"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            style={S.input}
          />

          <input
            placeholder="Price *"
            type="number"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            style={S.input}
          />

          <input
            placeholder="Quantity in Stock"
            type="number"
            value={form.quantity_in_stock}
            onChange={(e) => updateField("quantity_in_stock", e.target.value)}
            style={S.input}
          />

          <input
            placeholder="Model"
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
            style={S.input}
          />

          <input
            placeholder="Serial Number"
            value={form.serial_number}
            onChange={(e) => updateField("serial_number", e.target.value)}
            style={S.input}
          />

          <input
            placeholder="Distributor"
            value={form.distributor}
            onChange={(e) => updateField("distributor", e.target.value)}
            style={S.input}
          />

          {/* ⭐ Dynamic category dropdown */}
          <select
            value={form.category_id}
            onChange={(e) => updateField("category_id", e.target.value)}
            style={S.input}
          >
            <option value="">Select Category</option>
            {normalizedCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            style={S.textarea}
          />

          <label style={S.checkboxRow}>
            <input
              type="checkbox"
              checked={form.warranty_status}
              onChange={(e) => updateField("warranty_status", e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Warranty Active
          </label>

          <div>
            <p>Product Image</p>
            <input type="file" onChange={handleImage} />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: 120, marginTop: 10, borderRadius: 8 }}
              />
            )}
          </div>
        </div>

        <div style={S.actions}>
          <button style={S.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={S.saveBtn} onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// Styles
// ===========================
const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  modal: {
    background: "#222",
    padding: "2rem",
    borderRadius: "12px",
    width: "600px",
    color: "white",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  input: {
    padding: "0.8rem",
    borderRadius: "6px",
    border: "1px solid #555",
    background: "#111",
    color: "white",
  },
  checkboxRow: {
    gridColumn: "1 / 3",
    display: "flex",
    alignItems: "center",
    color: "white",
  },
  textarea: {
    gridColumn: "1 / 3",
    padding: "0.8rem",
    borderRadius: "6px",
    border: "1px solid #555",
    background: "#111",
    color: "white",
    minHeight: "90px",
  },
  error: {
    color: "#ff5c5c",
    marginBottom: "0.5rem",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
    gap: "1rem",
  },
  cancelBtn: {
    background: "#555",
    padding: "0.8rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#4dd0e1",
    color: "black",
    padding: "0.8rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
  },
};
