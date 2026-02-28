import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "16px 24px",
    borderBottom: "1px solid #eee",
    background: "#fff",
  },
  logo: { display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700, textDecoration: "none", color: "inherit" },
  nav: { display: "flex", alignItems: "center", gap: 8 },
  navLink: { padding: "8px 14px", borderRadius: 8, textDecoration: "none", color: "inherit", display: "block", fontSize: 14 },
  navItemActive: { background: "#eee", fontWeight: 500 },
  newChatBtn: {
    padding: "8px 14px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  main: { flex: 1, padding: 24, background: "#fafafa", display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" },
  footer: { marginLeft: "auto", fontSize: 12, color: "#999" },
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
      <header style={styles.topBar}>
        <Link to="/app" style={styles.logo}>
          <span style={{ fontSize: 24 }}>◆</span> Tradsy
        </Link>
        <button type="button" style={styles.newChatBtn} onClick={handleNewChat} aria-label="New chat">
          New chat
        </button>
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
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}
