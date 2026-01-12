import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await fetchNotifications();
      setItems(data.items || []);
    } catch (e) {
      setErr("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true, isRead: true, read: true }
            : n
        )
      );
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      // no-op
    }
  };

  const onReadAll = async () => {
    try {
      try {
        await markAllNotificationsRead();
      } catch (err) {
        const unread = items.filter(
          (n) => !(n.is_read ?? n.isRead ?? n.read)
        );
        await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      }
      setItems((prev) =>
        prev.map((n) => ({ ...n, is_read: true, isRead: true, read: true }))
      );
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      // no-op
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err) return <div style={{ padding: 24, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        <button onClick={onReadAll} style={{ marginLeft: "auto" }}>
          Mark all as read
        </button>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {items.length === 0 ? (
          <div>No notifications yet.</div>
        ) : (
          items.map((n) => {
            const isRead = n.is_read ?? n.isRead ?? n.read;
            return (
            <div
              key={n.id}
              onClick={() => onRead(n.id)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                cursor: "pointer",
                opacity: isRead ? 0.6 : 1,
                background: isRead ? "#fafafa" : "white",
              }}
            >
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div style={{ marginTop: 6 }}>{n.message}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}