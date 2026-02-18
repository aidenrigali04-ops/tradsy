import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 400, margin: "60px auto", padding: 24 },
  title: { fontSize: 24, marginBottom: 16 },
  subtitle: { color: "#666", marginBottom: 24 },
  input: { width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 16 },
  submit: { padding: "12px 24px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  error: { color: "#c00", marginBottom: 12, fontSize: 14 },
  success: { color: "#0a0", marginBottom: 12, fontSize: 14 },
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Invalid link</h1>
        <p style={styles.subtitle}>This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api<{ ok: boolean }>("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      setSuccess(true);
    } catch {
      setError("Invalid or expired token. Request a new reset link.");
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Password reset</h1>
        <p style={styles.success}>Your password has been reset.</p>
        <Link to="/login">Log in</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Set new password</h1>
      <p style={styles.subtitle}>Enter your new password below.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.submit}>
          Reset password
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}
