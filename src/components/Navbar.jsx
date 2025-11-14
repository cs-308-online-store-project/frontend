import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  return (
    <nav style={S.nav}>
      {/* LEFT – BRAND */}
      <div style={S.brand} onClick={() => navigate("/products")}>
        URBAN THREADS
      </div>

      {/* CENTER – MENU (ZARA STYLE CENTERED) */}
      <div style={S.centerMenu}>
        <Link to="/products" style={S.link}>NEW</Link>
        <Link to="/products" style={S.link}>WOMEN</Link>
        <Link to="/products" style={S.link}>MEN</Link>
        <Link to="/products" style={S.link}>KIDS</Link>
        <Link to="/products" style={S.link}>SALE</Link>
      </div>

      {/* RIGHT – CART */}
      <div style={S.right}>
        <Link to="/cart" style={S.cartWrapper}>
          <span style={S.cartIcon}>🛒</span>
          {cart.length > 0 && <span style={S.badge}>{cart.length}</span>}
        </Link>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    width: "100%",
    height: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",        // MENU ORTADA
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "white",
    borderBottom: "1px solid #eee",
  },

  brand: {
    position: "absolute",
    left: "40px",                     // ZARA STYLE: sol üst ama bağımsız
    fontSize: "1.8rem",
    fontWeight: "700",
    letterSpacing: "0.20em",
    cursor: "pointer",
  },

  centerMenu: {
    display: "flex",
    gap: "3rem",
    justifyContent: "center",
    alignItems: "center",
  },

  link: {
    textDecoration: "none",
    color: "#111",
    fontWeight: 500,
    letterSpacing: "0.15em",
    fontSize: "0.9rem",
  },

  right: {
    position: "absolute",
    right: "40px",
    display: "flex",
    alignItems: "center",
  },

  cartWrapper: {
    position: "relative",
    textDecoration: "none",
    color: "#111",
  },

  cartIcon: {
    fontSize: "1.4rem",
  },

  badge: {
    position: "absolute",
    top: "-6px",
    right: "-10px",
    background: "#111",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "0.7rem",
    padding: "2px 6px",
  },
};
