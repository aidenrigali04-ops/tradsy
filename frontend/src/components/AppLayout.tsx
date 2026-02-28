import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import type { ArchivedChat } from "../types/chatHistory";

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" },
  sidebar: {
    width: 260,
    minWidth: 260,
    flexShrink: 0,
    borderRight: "1px solid #eee",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    overflowY: "auto",
  },
  logo: { display: "flex", alignItems: "center", gap: 8, marginBottom: 32, fontSize: 20, fontWeight: 700, textDecoration: "none", color: "inherit" },
  newChatBtn: {
    padding: "10px 14px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 24,
  },
  section: { fontSize: 12, color: "#999", marginBottom: 8 },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navLink: { padding: "10px 12px", borderRadius: 8, textAlign: "left", textDecoration: "none", color: "inherit", display: "block" },
  navItemActive: { background: "#eee", fontWeight: 500 },
  historySection: { marginTop: 24, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
  historyGroup: { marginBottom: 16 },
  historyGroupTitle: { fontSize: 11, color: "#999", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" },
  historyItem: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 13,
    color: "#333",
    cursor: "pointer",
    marginBottom: 2,
    textAlign: "left",
    border: "none",
    background: "transparent",
  },
  historyItemTitle: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  historyItemDate: { display: "block", fontSize: 11, color: "#999", marginTop: 2 },
  main: { flex: 1, padding: 24, background: "#fafafa", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" },
  footer: { marginTop: "auto", fontSize: 12, color: "#999", flexShrink: 0 },
};

function groupChatsBySymbol(chatHistory: ArchivedChat[]): Record<string, ArchivedChat[]> {
  const bySymbol: Record<string, ArchivedChat[]> = {};
  for (const chat of chatHistory) {
    const sym = chat.symbol || "Other";
    if (!bySymbol[sym]) bySymbol[sym] = [];
    bySymbol[sym].push(chat);
  }
  return bySymbol;
}

function formatHistoryDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestNewChat, chatHistory, selectChatFromHistory } = useChat();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNewChat = () => {
    requestNewChat();
    navigate("/app");
  };

  const handleOpenHistoryChat = (id: string) => {
    selectChatFromHistory(id);
    navigate("/app");
  };

  const bySymbol = groupChatsBySymbol(chatHistory);
  const symbols = Object.keys(bySymbol).sort();

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <Link to="/app" style={styles.logo}>
          <span style={{ fontSize: 24 }}>◆</span> Tradsy
        </Link>
        <button type="button" style={styles.newChatBtn} onClick={handleNewChat} aria-label="New chat">
          New chat
        </button>
        <div style={styles.section}>Navigation</div>
        <nav style={styles.nav}>
          <Link
            to="/app"
            style={{ ...styles.navLink, ...(isActive("/app") && !location.pathname.includes("strategy") && !location.pathname.includes("analytics") && !location.pathname.includes("settings") ? styles.navItemActive : {}) }}
          >
            Chat
          </Link>
          <Link
            to="/app/strategy-library"
            style={{ ...styles.navLink, ...(isActive("/app/strategy-library") ? styles.navItemActive : {}) }}
          >
            Strategy Library
          </Link>
          <Link
            to="/app/analytics"
            style={{ ...styles.navLink, ...(isActive("/app/analytics") ? styles.navItemActive : {}) }}
          >
            Analytics
          </Link>
          <Link
            to="/app/settings"
            style={{ ...styles.navLink, ...(isActive("/app/settings") ? styles.navItemActive : {}) }}
          >
            Settings
          </Link>
        </nav>
        {chatHistory.length > 0 && (
          <div style={styles.historySection}>
            <div style={styles.section}>Chat history</div>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {symbols.map((sym) => (
                <div key={sym} style={styles.historyGroup}>
                  <div style={styles.historyGroupTitle}>{sym}</div>
                  {bySymbol[sym].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      style={styles.historyItem}
                      onClick={() => handleOpenHistoryChat(c.id)}
                      title={c.title}
                    >
                      <span style={styles.historyItemTitle}>{c.title}</span>
                      <span style={styles.historyItemDate}>{formatHistoryDate(c.lastMessageAt)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={styles.footer}>
          <a href="/legal">Legal</a> · <a href="/resources">Resources</a>
        </div>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}
