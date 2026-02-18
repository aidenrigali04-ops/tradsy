import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { onboarding } from "../api/client";
import ChartPanel from "../components/ChartPanel";
import ExecuteTradePanel from "../components/ExecuteTradePanel";

const styles: Record<string, React.CSSProperties> = {
  chartWrap: { flex: 1, position: "relative", minHeight: 400, border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" },
  mainTitle: { fontSize: 24, fontWeight: 600, marginBottom: 16 },
  mainPlaceholder: { color: "#666", marginBottom: 16 },
  executeBtn: { marginTop: 12, padding: "12px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  disclaimer: { marginTop: 8, fontSize: 12, color: "#666" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    onboarding
      .status()
      .then((s) => {
        if (!s.onboarding_completed) {
          navigate(s.step === 1 ? "/onboarding/1" : "/onboarding/2", { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  if (checking) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <>
        <h1 style={styles.mainTitle}>Hi{user?.first_name ? ` ${user.first_name}` : ""}, let's find a trade</h1>
        <p style={styles.mainPlaceholder}>
          Strategy performance and live signals will appear here.
        </p>
        <div style={styles.chartWrap}>
          <ExecuteTradePanel symbol="AAPL" sellPrice={150} buyPrice={151} />
          <ChartPanel symbol="AAPL" interval="1D" />
        </div>
        <button type="button" style={styles.executeBtn}>Execute trade</button>
        <p style={styles.disclaimer}>Market intelligence, not advice. You're in control.</p>
    </>
  );
}
