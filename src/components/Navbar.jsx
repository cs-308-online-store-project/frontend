import { Link, useNavigate, useLocation } from "react-router-dom";
import HeartIcon from "./icons/HeartIcon";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const menuItems = [
    { label: "NEW", to: "/products" },
    { label: "WOMEN", to: "/products?cat=women" },
    { label: "MEN", to: "/products?cat=men" },
    { label: "KIDS", to: "/products?cat=kids" },
    { label: "SALE", to: "/products?cat=sale" },
  ];

  return (
    <nav style={S.nav}>
      {/* BRAND */}
      <div style={S.brand} onClick={() => navigate("/products")}>
        URBAN THREADS
      </div>

      {/* CENTER MENU */}
      <div style={S.centerMenu}>
        {menuItems.map((item) => {
          const params = new URLSearchParams(location.search);
          const cat = params.get("cat");

          const isActive =
            (!cat && item.label === "NEW") ||
            (cat && item.to.includes(cat));

          return (
            <Link
              key={item.label}
              to={item.to}
              style={{
                ...S.link,
                ...(isActive ? S.activeLink : {}),
              }}
              className="navlink"
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* RIGHT SECTION */}
      <div style={S.right}>
        {/* FAVORITES */}
        <Link to="/favorites" style={S.iconWrapper}>
          <HeartIcon active={false} size={28} />
        </Link>

        {/* MY ORDERS */}
        <Link to="/orders" style={S.linkSmall}>
          My Orders
        </Link>

        {/* CART */}
        <Link to="/cart" style={S.cartWrapper}>
          <span style={S.cartIcon}>🛒</span>
          {cart.length > 0 && <span style={S.badge}>{cart.length}</span>}
        </Link>
      </div>
    </nav>
  );
}

/* ------- STYLES -------- */
const S = {
  nav: {
    width: "100%",
    height: "110px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 1000,

    background: "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(150,150,150,0.25)",
  },

  brand: {
    position: "absolute",
    left: "40px",
    fontSize: "1.9rem",
    fontWeight: "800",
    letterSpacing: "0.22em",
    cursor: "pointer",
  },

  centerMenu: {
    display: "flex",
    gap: "3rem",
    alignItems: "center",
  },

  link: {
    textDecoration: "none",
    color: "#111",
    fontWeight: 600,
    fontSize: "1.05rem",
    letterSpacing: "0.15em",
    paddingBottom: "5px",
    transition: "all 0.25s ease",

    // Hover animation
    transform: "scale(1)",
  },

  activeLink: {
    fontWeight: 800,
    borderBottom: "2px solid #000",
  },

  right: {
    position: "absolute",
    right: "40px",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },

  linkSmall: {
    textDecoration: "none",
    color: "#000",
    fontWeight: 600,
    fontSize: "0.95rem",
    letterSpacing: "0.10em",
  },

  iconWrapper: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.25s ease",
  },

  cartWrapper: {
    position: "relative",
    color: "#111",
    cursor: "pointer",
    transition: "transform 0.25s ease",
  },

  cartIcon: {
    fontSize: "1.45rem",
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
