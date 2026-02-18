"""
Chart/bars API for TradingView datafeed.
Returns OHLC bars for a symbol and timeframe (mock data for now).
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()


def _mock_bars(symbol: str, from_ts: int, to_ts: int, resolution: str) -> list[dict]:
    """Generate mock OHLC bars. Replace with real market data source."""
    # resolution: 1, 5, 15, 30, 60, 1D, 1W
    delta = timedelta(hours=1) if resolution in ("1", "5", "15", "30", "60") else timedelta(days=1)
    t = datetime.utcfromtimestamp(from_ts)
    end = datetime.utcfromtimestamp(to_ts)
    bars = []
    base = 100.0
    while t <= end and len(bars) < 300:
        import random
        o = base
        base = o * (1 + (random.random() - 0.5) * 0.02)
        h = max(o, base)
        l = min(o, base)
        c = base
        v = int(random.random() * 1e6)
        bars.append({"t": int(t.timestamp()), "o": round(o, 2), "h": round(h, 2), "l": round(l, 2), "c": round(c, 2), "v": v})
        t += delta
    return bars


@router.get("/bars")
async def get_bars(
    symbol: str = Query(..., description="Symbol e.g. AAPL"),
    from_ts: int = Query(..., description="Unix timestamp from"),
    to_ts: int = Query(..., description="Unix timestamp to"),
    resolution: str = Query("1D", description="1, 5, 15, 30, 60, 1D, 1W"),
):
    """Return OHLC bars for TradingView datafeed. s: ok, t: times, o, h, l, c, v."""
    bars = _mock_bars(symbol, from_ts, to_ts, resolution)
    if not bars:
        return {"s": "ok", "t": [], "o": [], "h": [], "l": [], "c": [], "v": []}
    return {
        "s": "ok",
        "t": [b["t"] for b in bars],
        "o": [b["o"] for b in bars],
        "h": [b["h"] for b in bars],
        "l": [b["l"] for b in bars],
        "c": [b["c"] for b in bars],
        "v": [b["v"] for b in bars],
    }


@router.get("/symbol")
async def resolve_symbol(symbol: str = Query(..., description="Symbol to resolve")):
    """Symbol info for TradingView resolveSymbol. Mock."""
    return {
        "name": symbol,
        "exchange": "Tradsy",
        "type": "stock",
        "description": symbol,
        "session": "0900-1600",
        "timezone": "America/New_York",
    }
