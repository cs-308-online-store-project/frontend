// src/layout/AdminLayout.jsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div style={S.container}>
      {/* SIDEBAR */}
      <aside style={{ 
        ...S.sidebar, 
        width: open ? "300px" : "80px" 
      }}>
        {/* TOP */}
        <div style={S.topSection}>
          <h2 style={{ 
            ...S.logo, 
            opacity: open ? 1 : 0, 
            pointerEvents: open ? "auto" : "none" 
          }}>
            ADMIN
          </h2>

          <button 
            onClick={() => setOpen(!open)} 
            style={S.toggleBtn}
          >
            {open ? "←" : "→"}
          </button>
        </div>

        {/* MENU LINKS */}
        <nav style={S.menu}>
          <NavLink to="/admin" style={S.link} end>
            <span style={{ ...S.linkText, opacity: open ? 1 : 0 }}>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/products" style={S.link}>
            <span style={{ ...S.linkText, opacity: open ? 1 : 0 }}>Products</span>
          </NavLink>

          <NavLink to="/admin/orders" style={S.link}>
            <span style={{ ...S.linkText, opacity: open ? 1 : 0 }}>Orders</span>
          </NavLink>

          <NavLink to="/admin/users" style={S.link}>
            <span style={{ ...S.linkText, opacity: open ? 1 : 0 }}>Users</span>
          </NavLink>
        </nav>
      </aside>

      {/* PAGE CONTENT */}
      <main style={S.content}>
        <Outlet />
      </main>
    </div>
  );
}

const S = {
container: {
  display: "flex",
  minHeight: "100vh",
  background: "rgba(0,0,0,0.85)",   // SAME as dashboard
  color: "white",
  fontFamily: "Inter, sans-serif",
},


 sidebar: {
  width: "400px",                               // ⭐ MUCH BIGGER
  background: "rgba(40, 40, 40, 0.95)",         // stronger grey
  backdropFilter: "blur(14px)",
  borderRight: "1px solid rgba(255,255,255,0.12)",
  padding: "3rem 2.5rem",                       // more padding
  display: "flex",
  flexDirection: "column",
  gap: "3rem",                                  // more spacing
  height: "100vh",
  position: "fixed",
  top: 0,
  left: 0,
  color: "white",
},



 topSection: {
  display: "flex",
  alignItems: "center",      // ⭐ centers arrow with ADMIN text
  justifyContent: "space-between",
  width: "100%",
  marginBottom: "2rem",
}
,

 logo: {
  fontSize: "2.2rem",
  fontWeight: 900,
  color: "white",
  margin: 0,                 // ⭐ prevents vertical misalignment
  letterSpacing: "1.5px",
},



toggleBtn: {
  background: "transparent",
  border: "none",
  color: "white",          // ⭐ arrow becomes white
  fontSize: "1.8rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",    // centers vertically
  justifyContent: "center",
  padding: 0,
  margin: 0,
}

,

  menu: {
  display: "flex",
  flexDirection: "column",
  gap: "1.4rem",           // ⭐ bigger spacing
},


link: ({ isActive }) => ({
  padding: "1.4rem 1.6rem",                      // BIG clickable area
  fontSize: "1.3rem",                            // ⭐ larger text
  fontWeight: 700,
  borderRadius: "14px",
  textDecoration: "none",
  color: isActive ? "#111" : "#eee",
  background: isActive
    ? "#4dd0e1"
    : "rgba(255,255,255,0.08)",                  // nicer grey
  transition: "0.25s ease",
  display: "block",
  cursor: "pointer",
  letterSpacing: "0.5px",
  boxShadow: isActive
    ? "0px 0px 20px rgba(77,208,225,0.4)"
    : "none",                                     // glow on active
}),



  linkText: {
    marginLeft: "0.5rem",
    whiteSpace: "nowrap",
    transition: "opacity 0.3s",
  },

content: {
  flex: 1,
  marginLeft: "260px",
  padding: "2rem",
  background: "transparent", // REMOVE WHITE
  color: "white",
},


};
