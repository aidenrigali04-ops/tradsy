"""
Rule engine: runs strategy config over bars and produces backtest metrics.
"""
import json
import random
from datetime import datetime, timedelta
from typing import Optional

from app.strategies.config_schema import StrategyConfig
from app.strategies.indicators import (
    Bar,
    eval_entry_indicator,
    eval_confirmation_rule,
    eval_exit_rule,
)


def load_config(config_json: str) -> StrategyConfig:
    """Parse strategy config from JSON string."""
    data = json.loads(config_json)
    return StrategyConfig.model_validate(data)


def _mock_bars(symbol: str, start: datetime, end: datetime, resolution: str, seed: int = 42) -> list[Bar]:
    """Generate mock OHLCV bars for backtest. Includes some parabolic moves for strategy triggers."""
    rng = random.Random(seed)
    delta = timedelta(hours=1) if resolution in ("1", "5", "15", "30", "60", "5min") else timedelta(days=1)
    bars: list[Bar] = []
    t = start
    base = 100.0
    bar_count = 0
    while t <= end and len(bars) < 500:
        o = base
        # Occasionally inject parabolic move (big gain then pullback) for strategy signals
        if bar_count > 20 and bar_count % 60 == 0:
            base = o * (1.75 + rng.random() * 0.2)  # 75-95% surge (triggers percent_gain_from_prior_close)
        elif bar_count > 20 and bar_count % 60 == 1:
            base = o * (0.97 - rng.random() * 0.04)  # Pullback (triggers short entry)
        else:
            change = (rng.random() - 0.45) * 0.04
            base = o * (1 + change)
        h = max(o, base)
        l = min(o, base)
        c = base
        v = int(rng.random() * 1e6 + 100000)
        bars.append(Bar(t=int(t.timestamp()), o=round(o, 2), h=round(h, 2), l=round(l, 2), c=round(c, 2), v=v))
        t += delta
        bar_count += 1
    return bars


def run_backtest_from_config(
    config: StrategyConfig,
    symbol: str = "AAPL",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    bars: Optional[list[Bar]] = None,
) -> dict:
    """
    Run backtest using strategy config.
    Returns metrics: pnl, pnl_pct, win_rate, max_drawdown, num_trades.
    """
    end_date = end_date or datetime.utcnow()
    start_date = start_date or (end_date - timedelta(days=365))

    if bars is None:
        tf = (config.backtest_assumptions and config.backtest_assumptions.primary_timeframe) or "5min"
        if tf == "daily_plus_5min_execution":
            tf = "1D"
        bars = _mock_bars(symbol, start_date, end_date, tf)

    if len(bars) < 10:
        return {
            "symbol": symbol,
            "timeframe": "1D",
            "start_time": start_date,
            "end_time": end_date,
            "pnl": 0.0,
            "pnl_pct": 0.0,
            "win_rate": 0.0,
            "max_drawdown": 0.0,
            "num_trades": 0,
        }

    rm = config.risk_management
    max_adverse = (rm and rm.max_adverse_excursion_pct) or 15.0
    max_daily_loss_pct = (rm and rm.max_daily_loss_pct) or 3.0
    max_trades_per_day = (rm and rm.max_trades_per_day) or 5

    ps = config.position_sizing
    base_risk_pct = (ps and ps.base_risk_per_trade_pct) or 1.0

    trades: list[dict] = []
    equity = 100000.0
    peak = equity
    max_dd = 0.0
    daily_trade_count = 0
    last_day_ts = None

    i = 1
    while i < len(bars) - 1:
        b = bars[i]
        prior_close = bars[i - 1].c if i > 0 else bars[0].c

        # Simple daily reset (compare bar timestamps)
        bar_day = b.t // 86400
        if last_day_ts is not None and bar_day != last_day_ts:
            daily_trade_count = 0
        last_day_ts = bar_day

        if daily_trade_count >= max_trades_per_day:
            i += 1
            continue

        # Check entries
        entries_ok = all(
            eval_entry_indicator(e.indicator, e.parameters, bars, i, prior_close)
            for e in config.entries
        )
        confirmations_ok = all(
            eval_confirmation_rule(r.rule, r.parameters, bars, i, prior_close)
            for r in config.confirmation_rules
        )

        if not (entries_ok and confirmations_ok):
            i += 1
            continue

        entry_price = b.c
        position_pct = base_risk_pct / 100.0

        # Look ahead for exit
        exit_pnl_pct = None
        for j in range(i + 1, min(i + 15, len(bars))):
            future = bars[j]
            pnl_pct = (entry_price - future.c) / entry_price * 100  # short

            if pnl_pct <= -max_adverse:
                exit_pnl_pct = -max_adverse
                i = j
                break

            for ex in config.exits:
                should_exit, _ = eval_exit_rule(
                    ex.type, ex.parameters, entry_price, future, bars[: j + 1], pnl_pct
                )
                if should_exit:
                    exit_pnl_pct = pnl_pct
                    i = j
                    break
            if exit_pnl_pct is not None:
                break

        if exit_pnl_pct is None:
            j = min(i + 5, len(bars) - 1)
            future = bars[j]
            exit_pnl_pct = (entry_price - future.c) / entry_price * 100
            i = j

        pnl = exit_pnl_pct / 100 * equity * position_pct
        trades.append({"pnl": pnl, "pnl_pct": exit_pnl_pct})
        equity += pnl
        daily_trade_count += 1

        peak = max(peak, equity)
        dd = (peak - equity) / peak * 100 if peak > 0 else 0
        max_dd = max(max_dd, dd)

        if equity < 100000.0 * (1 - max_daily_loss_pct / 100):
            break

        i += 1

    total_pnl = equity - 100000.0
    pnl_pct = total_pnl / 100000.0 * 100
    wins = sum(1 for t in trades if t["pnl"] > 0)
    win_rate = wins / len(trades) * 100 if trades else 0.0

    return {
        "symbol": symbol,
        "timeframe": "1D",
        "start_time": start_date,
        "end_time": end_date,
        "pnl": round(total_pnl, 2),
        "pnl_pct": round(pnl_pct, 2),
        "win_rate": round(win_rate, 2),
        "max_drawdown": round(max_dd, 2),
        "num_trades": len(trades),
    }
