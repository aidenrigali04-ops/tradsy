import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { onboarding } from "../api/client";
import ChatPanel from "../components/ChatPanel";

const styles: Record<string, React.CSSProperties> = {
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { newChatKey } = useChat();
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
    <div style={styles.chatContainer}>
      <ChatPanel
        key={newChatKey}
        resetKey={newChatKey}
        symbol="AAPL"
        symbolLabel="AAPL"
        placeholder="Using my strategy, find a good entry..."
        fullScreen
        userName={user?.first_name ?? undefined}
      />
    </div>
  );
}
