import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 260,
    borderRight: "1px solid #eee",
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
  logo: { display: "flex", alignItems: "center", gap: 8, marginBottom: 32, fontSize: 20, fontWeight: 700, textDecoration: "none", color: "inherit" },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navItem: { padding: "10px 12px", borderRadius: 8, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", width: "100%", font: "inherit" },
  navLink: { padding: "10px 12px", borderRadius: 8, textAlign: "left", textDecoration: "none", color: "inherit", display: "block" },
  navItemActive: { background: "#eee", fontWeight: 500 },
  section: { marginTop: 24, fontSize: 12, color: "#999", marginBottom: 8 },
  main: { flex: 1, padding: 24, background: "#fafafa", display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" },
  footer: { marginTop: "auto", fontSize: 12, color: "#999" },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <Link to="/app" style={styles.logo}>
          <span style={{ fontSize: 24 }}>◆</span> Tradsy
        </Link>
        <div style={styles.nav}>
          <button type="button" style={styles.navItem}>New chat</button>
          <button type="button" style={styles.navItem}>Search chat</button>
        </div>
        <div style={styles.section}>Chat history</div>
        <div style={styles.nav}>
          <Link
            to="/app"
            style={{
              ...styles.navLink,
              ...(isActive("/app") && !location.pathname.includes("strategy") && !location.pathname.includes("analytics") && !location.pathname.includes("settings") ? styles.navItemActive : {}),
            }}
          >
            Last Trade
          </Link>
        </div>
        <div style={styles.section}>Navigation</div>
        <div style={styles.nav}>
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
        </div>
        <div style={styles.footer}>
          <a href="/legal">Legal</a> · <a href="/resources">Resources</a>
        </div>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}
