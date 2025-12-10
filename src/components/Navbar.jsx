// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HeartIcon from "./icons/HeartIcon";
import { authAPI } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Cart state'i oluştur
  const [cart, setCart] = useState([]);

  // localStorage'dan cart'ı oku ve değişiklikleri dinle
  useEffect(() => {
    const updateCart = () => {
      const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(cartData);
    };

    // İlk yüklemede oku
    updateCart();

    // localStorage değişikliklerini dinle (farklı tab'ler arası)
    window.addEventListener("storage", updateCart);
    
    // Custom event dinle (aynı tab içindeki değişiklikler için)
    window.addEventListener("cartUpdated", updateCart);

    // Cleanup
    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  const menuItems = [
    { label: "NEW", to: "/products" },
    { label: "WOMEN", to: "/products?cat=women" },
    { label: "MEN", to: "/products?cat=men" },
    { label: "KIDS", to: "/products?cat=kids" },
    { label: "SALE", to: "/products?cat=sale" },
  ];

  const params = new URLSearchParams(location.search);
  const cat = params.get("cat");

  return (
    <nav style={S.nav}>
      {/* BRAND */}
      <div style={S.brand} onClick={() => navigate("/products")}>
        URBAN THREADS
      </div>

      {/* CENTER MENU */}
      <div style={S.centerMenu}>
        {menuItems.map((item) => {
          const active =
            (!cat && item.label === "NEW") || (cat && item.to.includes(cat));

          return (
            <Link
              key={item.label}
              to={item.to}
              style={{ ...S.link, ...(active ? S.activeLink : {}) }}
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
          <HeartIcon active={false} size={26} />
        </Link>

        {/* USER DROPDOWN */}
        {isLoggedIn ? (
          <div style={S.userWrapper}>
            <button style={S.userButton} onClick={() => setOpen((o) => !o)}>
              <span style={S.userNameText}>
                {user?.name || user?.email || "Account"}
              </span>
              <span style={S.chevron}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div style={S.dropdown}>
                <button
                  style={S.dropdownItem}
                  onClick={() => {
                    navigate("/orders");
                    setOpen(false);
                  }}
                >
                  My Orders
                </button>

                <button
                  style={S.dropdownItemDanger}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={S.linkSmall}>Login</Link>
        )}

        {/* CART */}
        <Link to="/cart" style={S.cartWrapper}>
          <span style={S.cartIcon}>🛒</span>
          {cart.length > 0 && <span style={S.badge}>{cart.length}</span>}
        </Link>
      </div>
    </nav>
  );
}

/* -------- STYLES -------- */

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
    letterSpacing: "0.1em",
  },

  // ----- DROPDOWN -----
  userWrapper: { position: "relative" },
  userButton: {
    background: "transparent",
    border: "1px solid #111",
    color: "#111",
    padding: "8px 12px",
    fontSize: "0.9rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  userNameText: {
    maxWidth: "140px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  chevron: { fontSize: "0.7rem" },

  dropdown: {
    position: "absolute",
    top: "110%",
    right: 0,
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    borderRadius: "6px",
    minWidth: "180px",
    padding: "6px 0",
    zIndex: 1100,
  },
  dropdownItem: {
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    textAlign: "left",
    letterSpacing: "0.05em",
  },
  dropdownItemDanger: {
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#b00020",
    fontSize: "0.9rem",
    textAlign: "left",
    letterSpacing: "0.05em",
  },

  // CART
  iconWrapper: { cursor: "pointer" },
  cartWrapper: { position: "relative", cursor: "pointer" },
  cartIcon: { fontSize: "1.45rem" },
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