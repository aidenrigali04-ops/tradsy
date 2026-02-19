import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onboarding } from "../api/client";
import { useAuth } from "../context/AuthContext";

const RISK_DISCLAIMER = `Trading involves substantial risk of loss and is not suitable for every investor. You could lose some or all of your invested capital. Past performance is not indicative of future results. You should consult a qualified financial advisor before making investment decisions.`;

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 560, margin: "0 auto", padding: 48 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 16 },
  subtitle: { color: "#666", marginBottom: 24 },
  label: { display: "block", marginBottom: 8, fontWeight: 500 },
  select: { width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 24 },
  button: { padding: "14px 32px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  error: { color: "#c00", marginBottom: 12, fontSize: 14 },
  disclaimer: {
    padding: 16,
    background: "#f8f8f8",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 13,
    color: "#444",
    marginBottom: 16,
    maxHeight: 120,
    overflowY: "auto",
  },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 },
};

export default function OnboardingStep1() {
  const { user } = useAuth();
  const [first_name, setFirst_name] = useState(user?.first_name ?? "");
  const [risk_tolerance, setRisk_tolerance] = useState<string>("");
  const [experience_level, setExperience_level] = useState<string>("");
  const [risk_disclaimer_accepted, setRisk_disclaimer_accepted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.first_name) setFirst_name(user.first_name);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!risk_tolerance || !experience_level) {
      setError("Please select risk tolerance and experience level");
      return;
    }
    if (!risk_disclaimer_accepted) {
      setError("You must accept the risk disclaimer to continue");
      return;
    }
    try {
      await onboarding.step1({
        first_name: first_name || "User",
        risk_tolerance,
        experience_level,
        risk_disclaimer_accepted: true,
      });
      navigate("/onboarding/2");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div style={styles.page}>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Onboarding · Step 1 of 2</p>
      <h1 style={styles.title}>Almost there</h1>
      <p style={styles.subtitle}>Tell us your risk tolerance and experience so we can personalize your experience.</p>
      <form onSubmit={handleSubmit}>
        <label style={styles.label}>First name</label>
        <input
          style={{ ...styles.select, marginBottom: 24 }}
          value={first_name}
          onChange={(e) => setFirst_name(e.target.value)}
          placeholder="Your name"
        />
        <label style={styles.label}>Risk tolerance</label>
        <select
          style={styles.select}
          value={risk_tolerance}
          onChange={(e) => setRisk_tolerance(e.target.value)}
        >
          <option value="">Select</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <label style={styles.label}>Experience level</label>
        <select
          style={styles.select}
          value={experience_level}
          onChange={(e) => setExperience_level(e.target.value)}
        >
          <option value="">Select</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <label style={styles.label}>Risk disclaimer</label>
        <div style={styles.disclaimer}>{RISK_DISCLAIMER}</div>
        <div style={styles.checkboxRow}>
          <input
            type="checkbox"
            id="disclaimer"
            checked={risk_disclaimer_accepted}
            onChange={(e) => setRisk_disclaimer_accepted(e.target.checked)}
          />
          <label htmlFor="disclaimer" style={{ ...styles.label, marginBottom: 0 }}>
            I have read and accept the risk disclaimer above.
          </label>
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button}>Continue</button>
      </form>
    </div>
  );
}
