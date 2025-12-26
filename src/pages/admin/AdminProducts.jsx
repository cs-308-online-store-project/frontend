// src/pages/admin/AdminProducts.jsx
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import ProductFormModal from "../../components/ProductFormModal";
import DeleteConfirm from "../../components/DeleteConfirm";
import { productsAPI } from "../../services/api";

// ⭐ Ürünlerden kategori çıkartan fonksiyon
function extractCategories(list) {
  return Array.from(
    new Set(
      list
        .map((p) => p.category?.name || p.category || p.category_name || p.category_id)
        .filter(Boolean)
    )
  );
}

export default function AdminProducts() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // ===========================
  // LOAD PRODUCTS FROM API
  // ===========================
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await productsAPI.getAll();
        const payload = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.products ?? [];
        if (mounted) setProducts(list);
        if (mounted && !list.length) setError("No products found");
      } catch (err) {
        if (mounted) {
          setError("Products could not be loaded from the API.");
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ⭐ CATEGORY DROPDOWN → API verisinden
  const categories = extractCategories(products);

  // ===========================
  // MODALS
  // ===========================
  const openAdd = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setSelectedProduct(p);
    setModalOpen(true);
  };

  const openDelete = (p) => {
    setSelectedProduct(p);
    setDeleteOpen(true);
  };

  // ===========================
  // CRUD ACTIONS
  // ===========================
  async function handleSave(newProd) {
    try {
      if (selectedProduct) {
        const id = selectedProduct.id || selectedProduct._id;
        const res = await productsAPI.update(id, newProd);
        const updated = res?.data?.data ?? res?.data ?? { ...newProd, id };
        setProducts((prev) =>
          prev.map((p) => (p.id === id || p._id === id ? updated : p))
        );
        showToast("Product updated!", "success");
      } else {
        const res = await productsAPI.create(newProd);
        const created = res?.data?.data ?? res?.data ?? { ...newProd, id: Date.now() };
        setProducts((prev) => [...prev, created]);
        showToast("Product added!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Product could not be saved", "error");
    } finally {
      setModalOpen(false);
    }
  }

  async function handleDelete() {
    try {
      const id = selectedProduct.id || selectedProduct._id;
      await productsAPI.remove(id);
      setProducts((prev) =>
        prev.filter((p) => (p.id || p._id) !== id)
      );
      showToast(`Deleted ${selectedProduct.name}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Product could not be deleted", "error");
    } finally {
      setDeleteOpen(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Product Management</h1>
        <button style={S.addBtn} onClick={openAdd}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <p style={{ opacity: 0.7, fontSize: "1.4rem" }}>Loading products…</p>
      ) : error ? (
        <p style={{ color: "#ffb3b3" }}>{error}</p>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>ID</th>
              <th style={S.th}>Image</th>
              <th style={S.th}>Name</th>
              <th style={S.th}>Price</th>
              <th style={S.th}>Quantity</th>
              <th style={S.th}>Category</th>
              <th style={S.th}>Model</th>
              <th style={S.th}>Serial #</th>
              <th style={S.th}>Distributor</th>
              <th style={S.th}>Warranty</th>
              <th style={S.th}></th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id || p._id} style={S.row}>
                <td style={S.idCol}>{p.id || p._id}</td>
                <td>
                  <img src={p.image_url || "https://via.placeholder.com/150"} alt="" style={S.image} />
                </td>
                <td style={S.bigText}>{p.name}</td>
                <td style={S.bigText}>${p.price}</td>
                <td style={S.bigText}>{p.stock ?? p.quantity_in_stock ?? 0}</td>
                <td style={S.bigText}>{p.category?.name || p.category || p.category_name || p.category_id}</td>
                <td style={S.bigText}>{p.model || "-"}</td>
                <td style={S.bigText}>{p.serial_number || "-"}</td>
                <td style={S.bigText}>{p.distributor_info || p.distributor || "-"}</td>
                <td style={S.bigText}>{p.warranty_bool ?? p.warranty_status ? "Active" : "Inactive"}</td>
                <td style={S.actionCol}>
                  <button style={S.editBtn} onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button style={S.deleteBtn} onClick={() => openDelete(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <ProductFormModal
          product={selectedProduct}
          categories={categories}  // ⭐ ProductList'ten gelen kategori listesi
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteOpen && (
        <DeleteConfirm
          name={selectedProduct?.name}
          onClose={() => setDeleteOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ===========================
// STYLES
// ===========================
const S = {
  page: {
    padding: "2.5rem",
    color: "white",
    fontFamily: "Inter",
    background: "rgba(0,0,0,0.85)",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2rem",
    alignItems: "center",
  },
  title: { fontSize: "2.8rem", fontWeight: 800 },

  addBtn: {
    padding: "1rem 1.6rem",
    background: "#4dd0e1",
    color: "black",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "1.2rem",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    overflow: "hidden",
  },

  th: {
    textAlign: "left",
    padding: "1.4rem",
    fontSize: "1.25rem",
    fontWeight: 700,
    background: "rgba(255,255,255,0.12)",
  },

  row: {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    height: "90px",
  },

  image: {
    width: "75px",
    height: "75px",
    objectFit: "cover",
    borderRadius: "10px",
  },

  idCol: {
    paddingLeft: "1.4rem",
    fontSize: "1.2rem",
    color: "#ccc",
  },

  bigText: {
    fontSize: "1.4rem",
    fontWeight: 600,
  },

  actionCol: {
    paddingRight: "1.4rem",
  },

  editBtn: {
    padding: "0.7rem 1.2rem",
    fontSize: "1.1rem",
    background: "#4dd0e1",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontWeight: 600,
  },

  deleteBtn: {
    padding: "0.7rem 1.2rem",
    fontSize: "1.1rem",
    background: "#ff5c5c",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "white",
    fontWeight: 600,
  },
};
