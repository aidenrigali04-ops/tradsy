/**
 * Overtrading warning UI: probability of loss, balance, and "Apply risk-management" CTA.
 */
const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    maxWidth: 520,
  },
  header: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#111" },
  message: { fontSize: 15, lineHeight: 1.5, color: "#333", marginBottom: 16 },
  riskHighlight: { color: "#c2410c", fontWeight: 600 },
  applyBtn: {
    padding: "12px 24px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};

type Props = {
  symbol: string;
  probabilityLossPct: number;
  balance: number;
  message: string;
  onApplyRiskManagement: () => void;
};

export default function RiskWarningCard({
  probabilityLossPct,
  balance,
  onApplyRiskManagement,
}: Props) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>Tradsy</div>
      <p style={styles.message}>
        It appears that you are overtrading; your current entry point on this stock has a{" "}
        <span style={styles.riskHighlight}>{probabilityLossPct}% chance of resulting in a loss.</span>{" "}
        With your current balance at ${balance}, I would advise implementing risk management strategies
        or reconsidering this trade altogether.
      </p>
      <button type="button" style={styles.applyBtn} onClick={onApplyRiskManagement}>
        Apply risk-management
      </button>
    </div>
  );
}
