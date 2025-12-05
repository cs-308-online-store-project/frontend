export default function DeleteConfirm({ name, onClose, onDelete }) {
  return (
    <div style={S.overlay}>
      <div style={S.box}>
        <h2>Delete {name}?</h2>
        <p>This action cannot be undone.</p>

        <div style={S.actions}>
          <button style={S.cancel} onClick={onClose}>Cancel</button>
          <button style={S.delete} onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  box: {
    background: "#1a1a1a",
    padding: "2rem",
    borderRadius: "12px",
    width: "420px",
    color: "white",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    marginTop: "1.2rem",
    gap: "1rem",
  },
  cancel: {
    background: "#666",
    padding: "0.8rem 1.4rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  delete: {
    background: "#ff5c5c",
    padding: "0.8rem 1.4rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
  },
};
