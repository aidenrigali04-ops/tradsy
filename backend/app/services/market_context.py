"""
Market context for Deep Analysis: fetches or builds symbol summary (price, volume, etc.)
to inject into the LLM prompt so responses use real or realistic data.
"""
from datetime import datetime, timedelta
from typing import Optional


# Realistic last-close ranges for common symbols (for mock; replace with real API later)
_SYMBOL_ANCHORS: dict[str, float] = {
    "AAPL": 228.0,
    "MSFT": 420.0,
    "GOOGL": 175.0,
    "AMZN": 198.0,
    "NVDA": 138.0,
    "META": 525.0,
    "TSLA": 350.0,
    "SPY": 580.0,
    "QQQ": 505.0,
}


def get_market_context(symbol: str, timeframe: str = "1D", bars_count: int = 30) -> str:
    """
    Return a text summary of market context for the symbol (price, volume, recent range).
    Uses deterministic mock data keyed by symbol so output is stable; replace with real API (e.g. Alpaca, Polygon) later.
    """
    symbol_upper = (symbol or "AAPL").upper().strip()
    base = _SYMBOL_ANCHORS.get(symbol_upper, 100.0)
    # Deterministic "random" from symbol seed
    seed = sum(ord(c) for c in symbol_upper) % 1000
    prices: list[float] = []
    volumes: list[int] = []
    t = base
    for i in range(bars_count):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        r = (seed % 1000) / 1000.0
        change = (r - 0.5) * 0.04
        t = round(t * (1 + change), 2)
        prices.append(t)
        volumes.append(int(5e6 + (seed % 100) * 1e5))
    if not prices:
        return f"Symbol: {symbol_upper}. No recent data available."
    last_close = prices[-1]
    prev_close = prices[-2] if len(prices) > 1 else last_close
    change_pct = round((last_close - prev_close) / prev_close * 100, 2) if prev_close else 0
    day_high = max(prices[-5:]) if len(prices) >= 5 else max(prices)
    day_low = min(prices[-5:]) if len(prices) >= 5 else min(prices)
    avg_vol = sum(volumes[-10:]) // max(1, min(10, len(volumes)))
    vol_str = f"{avg_vol / 1e6:.2f}M" if avg_vol >= 1e6 else f"{avg_vol / 1e3:.1f}K"
    lines = [
        f"**{symbol_upper}** ({timeframe})",
        f"- Last close: ${last_close:.2f}",
        f"- Change: {change_pct:+.2f}% (vs prior close ${prev_close:.2f})",
        f"- Session high / low: ${day_high:.2f} / ${day_low:.2f}",
        f"- Avg volume (recent): {vol_str}",
    ]
    return "\n".join(lines)
