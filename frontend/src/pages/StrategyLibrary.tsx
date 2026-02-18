import { useState, useEffect } from "react";
import { gurus } from "../api/client";

type Guru = { id: number; name: string; slug: string; description: string | null; image_url: string | null };
type Strategy = { id: number; guru_id: number; name: string; strategy_type: string | null };

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 960, margin: "0 auto", padding: 48 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  subtitle: { color: "#666", marginBottom: 32, fontSize: 15 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24 },
  card: {
    padding: 24,
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fff",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  cardSelected: { borderColor: "#111", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  cardImg: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#eee",
    margin: "0 auto 16px",
    objectFit: "cover",
  },
  cardName: { fontWeight: 700, marginBottom: 4, fontSize: 16 },
  cardDesc: { fontSize: 13, color: "#666" },
  star: { position: "absolute", top: 12, right: 12, fontSize: 18, color: "#ccc" },
  starSelected: { color: "#f5a623" },
  cardWrap: { position: "relative" },
};

export default function StrategyLibrary() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [strategiesByGuru, setStrategiesByGuru] = useState<Record<number, Strategy[]>>({});
  const [selectedGuruId, setSelectedGuruId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gurus.list().then(setGuruList).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    guruList.forEach((g) => {
      gurus.strategies(g.id).then((strategies) => {
        setStrategiesByGuru((prev) => ({ ...prev, [g.id]: strategies }));
      });
    });
  }, [guruList]);

  function toggleFavorite(guruId: number) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(guruId)) next.delete(guruId);
      else next.add(guruId);
      return next;
    });
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Strategy Library</h1>
      <p style={styles.subtitle}>
        Choose your trading strategy and let our AI analyze it according to its established rules.
      </p>
      <div style={styles.grid}>
        {guruList.map((g) => (
          <div key={g.id} style={styles.cardWrap}>
            <button
              type="button"
              style={{
                ...styles.card,
                ...(selectedGuruId === g.id ? styles.cardSelected : {}),
              }}
              onClick={() => setSelectedGuruId(selectedGuruId === g.id ? null : g.id)}
            >
              <span
                style={{ ...styles.star, ...(favorites.has(g.id) ? styles.starSelected : {}) }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(g.id);
                }}
                role="button"
                tabIndex={0}
              >
                ★
              </span>
              <div style={styles.cardImg}>
                {g.image_url ? (
                  <img src={g.image_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                ) : null}
              </div>
              <div style={styles.cardName}>{g.name}</div>
              <div style={styles.cardDesc}>{g.description ?? ""}</div>
              {strategiesByGuru[g.id]?.length ? (
                <div style={{ marginTop: 12, fontSize: 12, color: "#888" }}>
                  {strategiesByGuru[g.id].length} strateg{strategiesByGuru[g.id].length === 1 ? "y" : "ies"}
                </div>
              ) : null}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
