
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: "0 auto", padding: 48 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 32 },
  placeholder: {
    padding: 48,
    textAlign: "center",
    background: "#f8f8f8",
    borderRadius: 12,
    border: "1px dashed #ddd",
  },
};

export default function Analytics() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Analytics</h1>
      <p style={styles.subtitle}>Your trading performance and strategy insights.</p>
      <div style={styles.placeholder}>
        <p style={{ color: "#666", marginBottom: 8 }}>P&L over time, win rate, and drawdown will appear here.</p>
        <p style={{ fontSize: 13, color: "#999" }}>Requires trade history from Phase 4 execution.</p>
      </div>
    </div>
  );
}
