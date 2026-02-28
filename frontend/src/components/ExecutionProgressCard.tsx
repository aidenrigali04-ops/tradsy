/**
 * Risk-managed execution progress: 3-step vertical timeline + 3-dots loading below.
 * Steps: Analyzing market data → Chart analysis completed → Applying execution on Trading View.
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
  header: { fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#111" },
  subheader: { fontSize: 14, color: "#555", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 },
  timeline: { display: "flex", flexDirection: "column", gap: 0 },
  stepRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  connector: { width: 2, minHeight: 24, background: "#ddd", marginLeft: 13 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  dotCompleted: { background: "#111", color: "#fff" },
  dotPending: { background: "#fff", border: "2px solid #ccc", color: "#999" },
  stepLabel: { paddingTop: 4, fontSize: 14, color: "#333" },
  stepLabelPending: { color: "#999" },
  loadingWrap: { marginTop: 16, display: "flex", alignItems: "center", gap: 6 },
  loadingDots: { display: "flex", alignItems: "center", gap: 5 },
};

type Step = { id: string; label: string; status: string };

type Props = {
  symbol: string;
  steps: Step[];
  allCompleted?: boolean;
  showLoadingDots?: boolean;
  /** Override subheader (e.g. "Generating analysis for AAPL") */
  subtitle?: string;
};

export default function ExecutionProgressCard({
  symbol,
  steps,
  allCompleted = false,
  showLoadingDots = true,
  subtitle,
}: Props) {
  const subheaderText = subtitle ?? `Executing a Risk-Managed Scalp Trade on ${symbol}`;
  return (
    <div style={styles.card}>
      <div style={styles.header}>Tradsy</div>
      <div style={styles.subheader}>
        {subheaderText}
        <span style={{ fontSize: 18 }} title={symbol}>🍎</span>
      </div>
      <div style={styles.timeline}>
        {steps.map((step, i) => (
          <div key={step.id}>
            <div style={styles.stepRow}>
              <div
                style={{
                  ...styles.dot,
                  ...(step.status === "completed" ? styles.dotCompleted : styles.dotPending),
                }}
              >
                {step.status === "completed" ? "✓" : ""}
              </div>
              <span
                style={{
                  ...styles.stepLabel,
                  ...(step.status === "pending" ? styles.stepLabelPending : {}),
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div style={styles.connector} />}
          </div>
        ))}
      </div>
      {showLoadingDots && !allCompleted && (
        <div style={styles.loadingWrap}>
          <div style={styles.loadingDots} aria-hidden="true">
            <span className="tradsy-typing-dot" />
            <span className="tradsy-typing-dot" />
            <span className="tradsy-typing-dot" />
          </div>
        </div>
      )}
    </div>
  );
}
