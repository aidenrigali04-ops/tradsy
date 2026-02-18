import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onboarding, gurus } from "../api/client";

type Guru = { id: number; name: string; slug: string; description: string | null; image_url: string | null };

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: "0 auto", padding: 48 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 16 },
  subtitle: { color: "#666", marginBottom: 24 },
  textarea: { width: "100%", minHeight: 120, padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 24, resize: "vertical" },
  button: { padding: "14px 32px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 },
  sectionTitle: { fontSize: 20, fontWeight: 700, marginTop: 48, marginBottom: 8 },
  sectionSub: { color: "#666", marginBottom: 16 },
  cardRow: { display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 },
  card: {
    minWidth: 180,
    padding: 20,
    border: "1px solid #eee",
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer",
    background: "#fff",
  },
  cardSelected: { borderColor: "#111", background: "#f5f5f5" },
  cardImg: { width: 64, height: 64, borderRadius: "50%", background: "#ddd", margin: "0 auto 12px", objectFit: "cover" },
  cardName: { fontWeight: 700, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: "#666" },
  error: { color: "#c00", marginBottom: 12, fontSize: 14 },
};

export default function OnboardingStep2() {
  const [customStrategy, setCustomStrategy] = useState("");
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [selectedGuruId, setSelectedGuruId] = useState<number | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    gurus.list().then(setGuruList).finally(() => setLoading(false));
  }, []);

  async function handleContinue() {
    setError("");
    try {
      await onboarding.step2({
        custom_strategy_description: customStrategy || null,
        selected_guru_id: selectedGuruId,
        selected_strategy_id: selectedStrategyId,
      });
      navigate("/app");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function selectGuru(guruId: number) {
    setSelectedGuruId(guruId);
    const strategies = await gurus.strategies(guruId);
    setSelectedStrategyId(strategies[0]?.id ?? null);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>What is your trading strategy?</h1>
      <p style={styles.subtitle}>
        Please provide a detailed description of your trading setup, as accurately as you can, to enable our algorithm to develop an effective execution strategy.
      </p>
      <textarea
        style={styles.textarea}
        placeholder="My current strategy..."
        value={customStrategy}
        onChange={(e) => setCustomStrategy(e.target.value)}
      />
      <button type="button" style={styles.button} onClick={handleContinue}>
        Continue
      </button>

      <h2 style={styles.sectionTitle}>Recommendation (optional)</h2>
      <p style={styles.sectionSub}>You can replicate the trading strategy of your favorite expert.</p>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={styles.cardRow}>
          {guruList.map((g) => (
            <button
              key={g.id}
              type="button"
              style={{
                ...styles.card,
                ...(selectedGuruId === g.id ? styles.cardSelected : {}),
              }}
              onClick={() => selectGuru(g.id)}
            >
              <div style={styles.cardImg}>
                {g.image_url ? <img src={g.image_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : null}
              </div>
              <div style={styles.cardName}>{g.name}</div>
              <div style={styles.cardDesc}>{g.description ?? ""}</div>
            </button>
          ))}
        </div>
      )}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}
