import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", flexDirection: "row", minHeight: "100vh" },
  sidebar: {
    width: 260,
    minWidth: 260,
    flexShrink: 0,
    borderRight: "1px solid #eee",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
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
  main: { flex: 1, padding: 24, background: "#fafafa", display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" },
  footer: { marginTop: "auto", fontSize: 12, color: "#999" },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestNewChat } = useChat();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNewChat = () => {
    requestNewChat();
    navigate("/app");
  };

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
        <div style={styles.footer}>
          <a href="/legal">Legal</a> · <a href="/resources">Resources</a>
        </div>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}
