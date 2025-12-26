import { useEffect, useState } from "react";
import { reportsAPI } from "../../services/api";

export default function SalesReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await reportsAPI.getSalesReport();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading sales report...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Sales Report</h2>
      <pre style={{ background: "#111", color: "#0f0", padding: 16 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}