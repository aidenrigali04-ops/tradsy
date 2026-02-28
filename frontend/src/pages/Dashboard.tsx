import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { onboarding } from "../api/client";
import ChartPanel from "../components/ChartPanel";
import ExecuteTradePanel from "../components/ExecuteTradePanel";
import ChatPanel from "../components/ChatPanel";

const styles: Record<string, React.CSSProperties> = {
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 16 },
  newChatBtn: {
    padding: "10px 18px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  mainTitle: { fontSize: 24, fontWeight: 600, marginBottom: 8 },
  subTitle: { color: "#666", marginBottom: 16, fontSize: 14 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 380px",
    gap: 24,
    flex: 1,
    minHeight: 0,
  },
  left: { display: "flex", flexDirection: "column", gap: 16, minHeight: 0 },
  chartWrap: { flex: 1, position: "relative", minHeight: 360, border: "1px solid #eee", borderRadius: 8, overflow: "hidden", background: "#fff" },
  executeBtn: { alignSelf: "start", padding: "12px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" },
  disclaimer: { marginTop: 4, fontSize: 12, color: "#666" },
  chatWrap: { minHeight: 400 },
};

const EXECUTE_TRADE_MESSAGE = "I want to execute the current trade. Apply risk management and confirm size and direction for AAPL.";

export default function Dashboard() {
  const { user } = useAuth();
  const { newChatKey, requestNewChat } = useChat();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [executionTrigger, setExecutionTrigger] = useState("");

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
      <div style={styles.topRow}>
        <button
          type="button"
          style={styles.newChatBtn}
          onClick={requestNewChat}
          aria-label="Start new chat"
        >
          New chat
        </button>
        <h1 style={{ ...styles.mainTitle, margin: 0, flex: 1 }}>Hi{user?.first_name ? ` ${user.first_name}` : ""}, let&apos;s find a trade</h1>
      </div>
      <p style={styles.subTitle}>
        Chart, execution, and Tradsy AI chat. Ask for analysis or entries.
      </p>
      <div style={styles.grid}>
        <div style={styles.left}>
          <div style={styles.chartWrap}>
            <ExecuteTradePanel symbol="AAPL" sellPrice={150} buyPrice={151} />
            <ChartPanel symbol="AAPL" interval="1D" />
          </div>
          <button
            type="button"
            style={styles.executeBtn}
            onClick={() => setExecutionTrigger(EXECUTE_TRADE_MESSAGE)}
          >
            Execute trade
          </button>
          <p style={styles.disclaimer}>Market intelligence, not advice. You&apos;re in control.</p>
        </div>
        <div style={styles.chatWrap}>
          <ChatPanel
            key={newChatKey}
            resetKey={newChatKey}
            symbol="AAPL"
            symbolLabel="AAPL"
            placeholder="Using my strategy, find a good entry..."
            triggerMessage={executionTrigger}
            onTriggerSent={() => setExecutionTrigger("")}
          />
        </div>
      </div>
    </>
  );
}
