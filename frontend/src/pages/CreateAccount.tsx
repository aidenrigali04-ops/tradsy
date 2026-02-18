import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh" },
  left: { flex: 1, padding: 48, maxWidth: 440, display: "flex", flexDirection: "column" },
  logo: { display: "flex", alignItems: "center", gap: 8, marginBottom: 48, fontSize: 24, fontWeight: 700 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24 },
  socialRow: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 },
  socialBtn: {
    padding: "12px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  input: { width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 16 },
  checkbox: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 14, color: "#666" },
  submit: { width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  loginLink: { marginTop: 16, textAlign: "center", fontSize: 14, color: "#666" },
  footer: { marginTop: "auto", paddingTop: 32, display: "flex", gap: 24, fontSize: 14, color: "#666" },
  right: {
    flex: 1,
    background: "#f8f8f8",
    padding: 48,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  rightTitle: { fontSize: 28, fontWeight: 600, marginBottom: 24 },
  promptBox: {
    width: "100%",
    maxWidth: 480,
    padding: "16px 20px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brokers: { marginTop: 48, fontSize: 14, color: "#666", marginBottom: 12 },
  brokerLogos: { display: "flex", gap: 24, alignItems: "center" },
};

export default function CreateAccount() {
  const [first_name, setFirst_name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!agree) {
      setError("Please agree to the TOS");
      return;
    }
    try {
      await register(first_name, email, password);
      navigate("/onboarding/1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <span style={{ fontSize: 28 }}>◆</span> Tradsy
        </div>
        <h1 style={styles.title}>Create a free account</h1>
        <div style={styles.socialRow}>
          <button type="button" style={styles.socialBtn}>Google</button>
          <button type="button" style={styles.socialBtn}>Tradingview</button>
          <button type="button" style={styles.socialBtn}>Apple</button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="First name"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label style={styles.checkbox}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            By creating an account you're agreeing to our TOS
          </label>
          {error && <p style={{ color: "#c00", marginBottom: 12, fontSize: 14 }}>{error}</p>}
          <button type="submit" style={styles.submit}>Create account</button>
        </form>
        <p style={styles.loginLink}>
          Already have an account? <Link to="/login">Log-in</Link>
        </p>
        <div style={styles.footer}>
          <Link to="/legal">Legal</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/masterclass">Masterclass</Link>
        </div>
      </div>
      <div style={styles.right}>
        <h2 style={styles.rightTitle}>Hi, let's find a trade</h2>
        <div style={styles.promptBox}>
          <span>🍎</span>
          <input
            style={{ border: "none", flex: 1, outline: "none", background: "transparent" }}
            placeholder="Using my strategy, find a good entry"
            readOnly
          />
          <span style={{ fontSize: 20 }}>◆</span>
        </div>
        <p style={styles.brokers}>Trusted by your favorite brokers.</p>
        <div style={styles.brokerLogos}>
          <span>Webull</span>
          <span>TradingView</span>
          <span>Robinhood</span>
        </div>
      </div>
    </div>
  );
}
