import { useAuth } from "../context/AuthContext";

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 560, margin: "0 auto", padding: 48 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
  row: { padding: "12px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#666" },
  value: { fontWeight: 500 },
};

export default function Settings() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Settings</h1>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Account</h2>
        <div style={styles.row}>
          <span style={styles.label}>Email</span>
          <span style={styles.value}>{user?.email ?? "—"}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Name</span>
          <span style={styles.value}>{user?.first_name ?? "—"}</span>
        </div>
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Preferences</h2>
        <p style={{ color: "#666", fontSize: 14 }}>Theme, notifications, and other preferences will appear here.</p>
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Broker connection</h2>
        <p style={{ color: "#666", fontSize: 14 }}>Connect your broker account (Alpaca) for real trading. Coming in Phase 4.</p>
      </div>
    </div>
  );
}
