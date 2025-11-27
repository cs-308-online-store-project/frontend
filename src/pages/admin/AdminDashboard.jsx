import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    weeklyRevenue: 4820,
    totalProducts: 120,
    totalStock: 859,
    pendingOrders: 3,
    totalUsers: 4200,
    registeredUsers: 210,
  });

  const dailyOrders = [4, 7, 6, 12, 10, 15, 19];
  const orderDates = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const yMarks = [30, 25, 20, 15, 10, 5];

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  return (
    <div style={S.page}>
      <div style={S.wrapper}>

        {/* HEADER */}
        <div style={S.header}>
          <h1 style={S.title}>Welcome back, TEAM! 🚀</h1>
          <p style={S.subtitle}>
            Crushing goals, boosting sales, making customers happy — you're unstoppable. 💪🔥
          </p>
        </div>

        {/* KPI CARDS */}
        {loading ? (
          <div style={S.loading}>Loading dashboard…</div>
        ) : (
          <div style={S.cardGrid}>
            
            {/* Revenue */}
            <div
              style={{ ...S.card, ...S.neonBlue }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonBlue })
              }
            >
              <p style={S.cardLabel}>Revenue (This Week)</p>
              <p style={S.cardValue}>${stats.weeklyRevenue}</p>
              <p style={S.cardNote}>Amazing growth! 📈</p>
            </div>

            {/* Total Products */}
            <div
              style={{ ...S.card, ...S.neonPurple }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonPurple })
              }
            >
              <p style={S.cardLabel}>Total Products</p>
              <p style={S.cardValue}>{stats.totalProducts}</p>
            </div>

            {/* Total Stock */}
            <div
              style={{ ...S.card, ...S.neonGreen }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonGreen })
              }
            >
              <p style={S.cardLabel}>Total Stock</p>
              <p style={S.cardValue}>{stats.totalStock}</p>
            </div>

            {/* Pending Orders */}
            <div
              style={{ ...S.card, ...S.neonOrange }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonOrange })
              }
            >
              <p style={S.cardLabel}>Pending Orders</p>
              <p style={S.cardValue}>{stats.pendingOrders}</p>
            </div>

            {/* Total Users */}
            <div
              style={{ ...S.card, ...S.neonPink }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonPink })
              }
            >
              <p style={S.cardLabel}>Total Users</p>
              <p style={S.cardValue}>{stats.totalUsers}</p>
            </div>

            {/* Registered Users */}
            <div
              style={{ ...S.card, ...S.neonCyan }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, { ...S.card, ...S.neonCyan })
              }
            >
              <p style={S.cardLabel}>Registered Users (This Week)</p>
              <p style={S.cardValue}>{stats.registeredUsers}</p>
            </div>

          </div>
        )}

        {/* DAILY ORDERS GRAPH */}
        <div style={S.chartBox}>
          <h2 style={S.chartTitle}>Daily Orders</h2>

          <div style={S.chartWrapper}>
            <div style={S.yAxis}>
              {yMarks.map((m, i) => (
                <span key={i} style={S.yMark}>{m}</span>
              ))}
            </div>

            <div style={S.chartArea}>
              <svg width="100%" height="120" style={S.gridSvg}>
                {yMarks.map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 20}
                    x2="100%"
                    y2={i * 20}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                ))}
              </svg>

              <svg width="100%" height="120" style={S.chartSvg}>
                <polyline
                  fill="none"
                  stroke="#4dd0e1"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={dailyOrders
                    .map((v, i) => `${i * 45}, ${120 - v * 3}`)
                    .join(" ")}
                  style={{ filter: "drop-shadow(0px 0px 6px #4dd0e1)" }}
                />
              </svg>
            </div>
          </div>

          <div style={S.xAxis}>
            {orderDates.map((d, i) => (
              <span key={i} style={S.xMark}>{d}</span>
            ))}
          </div>
        </div>

        {/* LATEST PRODUCTS */}
        <div style={S.latestBox}>
          <h2 style={S.latestTitle}>Latest Products</h2>
          <p style={S.latestText}>Coming soon… (API integration next)</p>
        </div>

      </div>
    </div>
  );
}

//
// DARK MODE + GLASS UI + NEON + GRAPH STYLES
//
const S = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(10px)",
    padding: "3rem 2rem",
    color: "white",
    fontFamily: "'Inter', sans-serif",
  },

  wrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "3rem",
  },

  // BIGGER HEADER
  header: { marginBottom: "1rem" },

  title: {
    fontSize: "4rem",
    fontWeight: 900,
    marginBottom: "1rem",
    letterSpacing: "-1px",
  },

  subtitle: {
    fontSize: "1.4rem",
    opacity: 0.9,
    maxWidth: "900px",
    lineHeight: "1.6",
  },

  loading: { fontSize: "1.3rem", opacity: 0.8 },

  // Bigger KPI Grid
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "2.5rem",
  },

  // Bigger KPI Cards
  card: {
    padding: "2.8rem 2.4rem",
    minHeight: "170px",
    borderRadius: "18px",
    color: "white",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "0.3s",
    animation: "pulseGlow 2.5s infinite",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  cardHover: {
    transform: "translateY(-10px)",
    boxShadow: "0 0 40px rgba(255,255,255,0.35)",
  },

  neonBlue: { background: "linear-gradient(135deg,#1a73e8,#0d47a1)" },
  neonPurple: { background: "linear-gradient(135deg,#9b4dff,#5e35b1)" },
  neonGreen: { background: "linear-gradient(135deg,#00c853,#009624)" },
  neonOrange: { background: "linear-gradient(135deg,#ff8f00,#e65100)" },
  neonPink: { background: "linear-gradient(135deg,#ff4eb8,#c2185b)" },
  neonCyan: { background: "linear-gradient(135deg,#26c6da,#006064)" },

  // Bigger KPI Typography
  cardLabel: {
    fontSize: "1.3rem",
    opacity: 0.95,
    fontWeight: 600,
  },

  cardValue: {
    fontSize: "4.2rem",
    fontWeight: 900,
    marginTop: "0.6rem",
    letterSpacing: "-1px",
  },

  cardNote: {
    fontSize: "1.1rem",
    opacity: 0.85,
    marginTop: "0.5rem",
  },

  chartBox: {
    width: "100%",
    padding: "2.5rem",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },

  chartTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },

  chartWrapper: {
    display: "flex",
    gap: "1.2rem",
  },

  yAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  yMark: {
    fontSize: "1rem",
    color: "#bbb",
  },

  chartArea: {
    position: "relative",
    width: "100%",
    height: "140px",
  },

  gridSvg: { position: "absolute" },
  chartSvg: { position: "absolute" },

  xAxis: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
  },

  xMark: {
    color: "#ddd",
    fontSize: "1rem",
  },

  latestBox: {
    padding: "2.2rem",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
  },

  latestTitle: {
    fontSize: "1.9rem",
    fontWeight: 700,
    marginBottom: "0.8rem",
  },

  latestText: {
    color: "#ccc",
    fontSize: "1.1rem",
  },
};

const styleSheet = document.styleSheets?.[0];
try {
  styleSheet.insertRule(`
    @keyframes pulseGlow {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
  `, styleSheet.cssRules.length);
} catch {}
