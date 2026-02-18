/**
 * Compact trade execution panel: SELL / quantity / BUY.
 * In Phase 4 this will call the Broker API.
 */
export default function ExecuteTradePanel({ symbol = "XAUUSD", sellPrice = 4636.58, buyPrice = 4636.88 }: { symbol?: string; sellPrice?: number; buyPrice?: number }) {
  return (
    <div
      title={symbol}
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <button
        type="button"
        style={{
          padding: "8px 16px",
          background: "transparent",
          color: "#c00",
          border: "1px solid #c00",
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        SELL {sellPrice.toFixed(2)}
      </button>
      <input
        type="text"
        defaultValue="0.30"
        style={{
          width: 72,
          padding: "8px 10px",
          border: "1px solid #ddd",
          borderRadius: 6,
          textAlign: "center",
        }}
      />
      <button
        type="button"
        style={{
          padding: "8px 16px",
          background: "transparent",
          color: "#07c",
          border: "1px solid #07c",
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        BUY {buyPrice.toFixed(2)}
      </button>
    </div>
  );
}
