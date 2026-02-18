import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh" },
  left: { flex: 1, padding: 48, maxWidth: 440, display: "flex", flexDirection: "column" },
  logo: { display: "flex", alignItems: "center", gap: 8, marginBottom: 48, fontSize: 24, fontWeight: 700 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24 },
  input: { width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 16 },
  submit: { width: "100%", padding: 14, background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  registerLink: { marginTop: 16, textAlign: "center", fontSize: 14, color: "#666" },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <span style={{ fontSize: 28 }}>◆</span> Tradsy
        </div>
        <h1 style={styles.title}>Log in</h1>
        <form onSubmit={handleSubmit}>
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
          {error && <p style={{ color: "#c00", marginBottom: 12, fontSize: 14 }}>{error}</p>}
          <button type="submit" style={styles.submit}>Log in</button>
        </form>
        <p style={{ marginTop: 12, fontSize: 14 }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p style={styles.registerLink}>
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
