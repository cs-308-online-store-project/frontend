import { useEffect, useState } from "react";
import { refundAPI } from "../../services/api";

const SalesRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refundları çek
  const fetchRefunds = async () => {
    try {
      const res = await refundAPI.getAll();
      setRefunds(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Approve / Reject
  const handleUpdateStatus = async (refundId, status) => {
    try {
      await refundAPI.updateStatus(refundId, status);
      fetchRefunds(); // listeyi yenile
    } catch (err) {

      setRefunds((prev) =>
      prev.map((r) =>
        r.id === refundId ? { ...r, status } : r
      )
    );
    }
  };

  if (loading) return <p>Loading refund requests...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "24px" }}>
      <h2>Refund Requests</h2>

      {refunds.length === 0 ? (
        <p>No refund requests found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "16px",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Customer</th>
              <th style={th}>Product ID</th>
              <th style={th}>Reason</th>
              <th style={th}>Quantity</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td style={td}>{refund.customer_email}</td>
                <td style={td}>{refund.product_id}</td>
                <td style={td}>{refund.reason}</td>
                <td style={td}>{refund.quantity ?? "-"}</td>
                <td style={td}>{refund.status}</td>
                <td style={td}>
                  {refund.status === "pending" ? (
                    <>
                      <button
                        style={{ ...btn, backgroundColor: "#4CAF50" }}
                        onClick={() =>
                          handleUpdateStatus(refund.id, "approved")
                        }
                      >
                        Approve
                      </button>
                      <button
                        style={{ ...btn, backgroundColor: "#f44336" }}
                        onClick={() =>
                          handleUpdateStatus(refund.id, "rejected")
                        }
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ---- styles ---- */

const th = {
  borderBottom: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

const td = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

const btn = {
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  marginRight: "6px",
  cursor: "pointer",
  borderRadius: "4px",
};

export default SalesRefunds;
