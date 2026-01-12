import { useEffect, useMemo, useState } from "react";
import { orderAPI, reportsAPI } from "../../services/api";

const toInputDate = (date) => date.toISOString().split("T")[0];

const startOfDay = (value) =>
  value ? new Date(`${value}T00:00:00`) : null;

const endOfDay = (value) => (value ? new Date(`${value}T23:59:59`) : null);

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const pickNumber = (...values) => {
  for (const value of values) {
    const num = safeNumber(value);
    if (num !== null) return num;
  }
  return null;
};

const formatCurrency = (value) => {
  const num = safeNumber(value) ?? 0;
  return `$${num.toFixed(2)}`;
};

const normalizeOrders = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const getOrderDate = (order) =>
  order?.createdAt || order?.created_at || order?.date;

const buildSeriesFromOrders = (orders) => {
  const totals = new Map();
  orders.forEach((order) => {
    const dateValue = getOrderDate(order);
    if (!dateValue) return;
    const label = new Date(dateValue).toISOString().slice(0, 10);
    const current = totals.get(label) || 0;
    totals.set(label, current + (safeNumber(order.totalPrice) ?? 0));
  });

  return Array.from(totals.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([label, revenue]) => ({
      label,
      revenue,
      profit: revenue,
    }));
};

const formatInvoiceDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
};


export default function SalesReports() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(toInputDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyInvoice, setBusyInvoice] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    const params = { startDate, endDate };
    const [ordersResult, reportResult] = await Promise.allSettled([
      orderAPI.getOrders(),
      reportsAPI.getSalesReport(params),
    ]);

    if (ordersResult.status === "fulfilled") {
      setOrders(normalizeOrders(ordersResult.value));
    } else {
      setOrders([]);
      setError("Failed to load invoices");
    }

    if (reportResult.status === "fulfilled") {
      setReport(reportResult.value?.data ?? null);
    } else {
      setReport(null);
      setError((prev) =>
        prev ? `${prev}. Failed to load sales report` : "Failed to load sales report"
      );
    }

    setLoading(false);
  };
  useEffect(() => {
    loadReports();
  }, []);

  const filteredOrders = useMemo(() => {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    return orders.filter((order) => {
      const dateValue = getOrderDate(order);
      if (!dateValue) return false;
      const date = new Date(dateValue);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const summary = useMemo(() => {
    const revenueFallback = filteredOrders.reduce(
      (sum, order) => sum + (safeNumber(order.totalPrice) ?? 0),
      0
    );

    const revenue =
      pickNumber(
        report?.revenue,
        report?.totalRevenue,
        report?.summary?.revenue
      ) ?? revenueFallback;

    const loss = pickNumber(
      report?.loss,
      report?.totalLoss,
      report?.summary?.loss
    );

    const profit =
      pickNumber(
        report?.profit,
        report?.netProfit,
        report?.summary?.profit
      ) ?? (loss !== null ? revenue - loss : revenue);

    return {
      revenue,
      profit,
      loss: loss ?? Math.max(0, revenue - profit),
    };
  }, [filteredOrders, report]);
  const chartSeries = useMemo(() => {
    const series =
      report?.chart ||
      report?.series ||
      report?.data ||
      report?.summary?.series;
    if (Array.isArray(series)) {
      return series.map((item) => ({
        label: item.label || item.date || item.period || "-",
        revenue: safeNumber(item.revenue) ?? 0,
        profit: safeNumber(item.profit) ?? safeNumber(item.netProfit) ?? 0,
      }));
    }

    return buildSeriesFromOrders(filteredOrders);
  }, [filteredOrders, report]);

  const maxValue = useMemo(() => {
    const values = chartSeries.flatMap((item) => [
      safeNumber(item.revenue) ?? 0,
      safeNumber(item.profit) ?? 0,
    ]);
    return Math.max(...values, 1);
  }, [chartSeries]);

  const handleInvoiceAction = async (orderId, action) => {
    setBusyInvoice(orderId);
    setNotice("");

    try {
      await orderAPI.generateInvoice(orderId).catch(() => {});
      const res = await orderAPI.downloadInvoice(orderId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        link.click();
      } else {
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => printWindow.print();
        }
      }

      setNotice("✅ Invoice ready.");
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setNotice("❌ Failed to generate invoice PDF.");
    } finally {
      setBusyInvoice(null);
    }
  };

  return (
   <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 8 }}>Sales Reports</h2>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Review revenue, profit/loss, and download invoices for a date range.
      </p>

      <div style={S.filters}>
        <label style={S.label}>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={S.input}
          />
        </label>
        <label style={S.label}>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            style={S.input}
          />
        </label>
        <button onClick={loadReports} style={S.primaryButton}>
          Refresh Report
        </button>
      </div>

      {loading ? (
        <p>Loading sales report...</p>
      ) : (
        <>
          {error && <p style={{ color: "#ffb4b4" }}>{error}</p>}
          {notice && <p style={{ opacity: 0.9 }}>{notice}</p>}

          <div style={S.summaryGrid}>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Revenue</div>
              <div style={S.summaryValue}>{formatCurrency(summary.revenue)}</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Profit</div>
              <div style={S.summaryValue}>{formatCurrency(summary.profit)}</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Loss</div>
              <div style={S.summaryValue}>{formatCurrency(summary.loss)}</div>
            </div>
          </div>

          <div style={S.chartWrapper}>
            <div style={S.chartHeader}>
              <h3 style={{ margin: 0 }}>Revenue & Profit Chart</h3>
              <div style={S.legend}>
                <span style={{ ...S.legendItem, background: "#4dd0e1" }} />
                <span>Revenue</span>
                <span style={{ ...S.legendItem, background: "#81c784" }} />
                <span>Profit</span>
              </div>
            </div>

            {chartSeries.length === 0 ? (
              <p style={{ opacity: 0.8 }}>No chart data available.</p>
            ) : (
              <div style={S.chart}>
                {chartSeries.map((item) => {
                  const revenueHeight =
                    ((safeNumber(item.revenue) ?? 0) / maxValue) * 100;
                  const profitHeight =
                    ((safeNumber(item.profit) ?? 0) / maxValue) * 100;

                  return (
                    <div key={item.label} style={S.chartColumn}>
                      <div style={S.barGroup}>
                        <div
                          style={{
                            ...S.bar,
                            height: `${revenueHeight}%`,
                            background: "#4dd0e1",
                          }}
                          title={`Revenue: ${formatCurrency(item.revenue)}`}
                        />
                        <div
                          style={{
                            ...S.bar,
                            height: `${profitHeight}%`,
                            background: "#81c784",
                          }}
                          title={`Profit: ${formatCurrency(item.profit)}`}
                        />
                      </div>
                      <div style={S.chartLabel}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={S.invoicesSection}>
            <h3 style={{ marginBottom: 12 }}>Invoices</h3>
            {filteredOrders.length === 0 ? (
              <p style={{ opacity: 0.8 }}>
                No invoices found for the selected date range.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Invoice</th>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Customer</th>
                      <th style={S.th}>Total</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={S.td}>#{order.id}</td>
                        <td style={S.td}>{formatInvoiceDate(getOrderDate(order))}</td>
                        <td style={S.td}>
                          {order.customerEmail ||
                            order.user?.email ||
                            order.customer?.email ||
                            "-"}
                        </td>
                        <td style={S.td}>{formatCurrency(order.totalPrice)}</td>
                        <td style={S.td}>{order.status || "processing"}</td>
                        <td style={S.td}>
                          <div style={S.actionGroup}>
                            <button
                              onClick={() =>
                                handleInvoiceAction(order.id, "download")
                              }
                              disabled={busyInvoice === order.id}
                              style={S.secondaryButton}
                            >
                              Download PDF
                            </button>
                            <button
                              onClick={() =>
                                handleInvoiceAction(order.id, "print")
                              }
                              disabled={busyInvoice === order.id}
                              style={S.secondaryButton}
                            >
                              Print PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const S = {
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-end",
    marginBottom: 24,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
    opacity: 0.9,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "rgba(0,0,0,0.35)",
    color: "white",
  },
  primaryButton: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#4dd0e1",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    opacity: 0.7,
    letterSpacing: "0.08em",
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 800,
  },
  chartWrapper: {
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: 28,
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    opacity: 0.8,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  chart: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(48px, 1fr)",
    alignItems: "flex-end",
    gap: 12,
    height: 240,
    paddingBottom: 12,
  },
  chartColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  barGroup: {
    display: "flex",
    gap: 6,
    alignItems: "flex-end",
    height: "100%",
  },
  bar: {
    width: 18,
    borderRadius: 6,
    transition: "height 0.3s ease",
  },
  chartLabel: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.75,
    maxWidth: 80,
    wordBreak: "break-word",
  },
  invoicesSection: {
    marginTop: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontSize: 12,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: 14,
  },
  actionGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
};