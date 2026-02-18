"""
Indicator and rule implementations for strategy config.
Evaluates entry/confirmation/exit rules against bar data.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Bar:
    t: int  # Unix timestamp
    o: float
    h: float
    l: float
    c: float
    v: float


def _sma(values: list[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def _atr(bars: list[Bar], period: int = 14) -> Optional[float]:
    if len(bars) < period + 1:
        return None
    trs = []
    for i in range(1, min(period + 1, len(bars) + 1)):
        idx = -i
        high, low = bars[idx].h, bars[idx].l
        prev_close = bars[idx - 1].c
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        trs.append(tr)
    return sum(trs) / len(trs) if trs else None


def _vwap(bars: list[Bar]) -> Optional[float]:
    if not bars:
        return None
    total_pv = sum((b.h + b.l + b.c) / 3 * b.v for b in bars)
    total_v = sum(b.v for b in bars)
    return total_pv / total_v if total_v > 0 else None


def eval_entry_indicator(
    indicator: str,
    params: dict,
    bars: list[Bar],
    idx: int,
    prior_close: Optional[float] = None,
    context: Optional[dict] = None,
) -> bool:
    """Return True if entry condition is satisfied."""
    context = context or {}
    b = bars[idx]
    prev_bars = bars[: idx + 1]

    if indicator == "percent_gain_from_prior_close":
        if prior_close is None or prior_close <= 0:
            return False
        pct = (b.c - prior_close) / prior_close * 100
        return pct >= params.get("min_threshold_pct", 0)

    if indicator == "two_day_percent_gain":
        if len(bars) < 3:
            return False
        two_ago = bars[max(0, idx - 2)].c
        if two_ago <= 0:
            return False
        pct = (b.c - two_ago) / two_ago * 100
        return pct >= params.get("min_threshold_pct", 0)

    if indicator == "gap_up_pct":
        if prior_close is None or prior_close <= 0 or idx == 0:
            return False
        gap = (b.o - prior_close) / prior_close * 100
        return gap >= params.get("min_gap_pct", 0)

    if indicator == "float_size_max":
        max_float = params.get("max_float_millions", 40)
        # No float data: use volume as proxy - pass if vol < 40M * 1e6
        return True  # Stub: assume pass when no float data

    if indicator == "volume_vs_float_ratio":
        # Stub: no float data; use volume vs avg volume as proxy
        if len(prev_bars) < 5:
            return True
        avg_v = sum(p.v for p in prev_bars[-5:]) / min(5, len(prev_bars))
        return b.v >= avg_v * params.get("min_rotation_multiple", 1.0) if avg_v > 0 else True

    if indicator == "percent_above_vwap":
        vwap_val = _vwap(prev_bars)
        if vwap_val is None or vwap_val <= 0:
            return True
        pct = (b.c - vwap_val) / vwap_val * 100
        return pct >= params.get("min_pct", 0)

    if indicator == "atr_multiple_extension":
        period = params.get("lookback_period", 14)
        atr_val = _atr(prev_bars, period)
        if atr_val is None or atr_val <= 0 or prior_close is None:
            return False
        ext = (b.c - prior_close) / atr_val
        return ext >= params.get("min_multiple", 0)

    return True


def eval_confirmation_rule(
    rule: str,
    params: dict,
    bars: list[Bar],
    idx: int,
    prior_close: Optional[float] = None,
) -> bool:
    """Return True if confirmation rule is satisfied."""
    b = bars[idx]
    prev_bars = bars[: idx + 1]

    if rule == "failed_breakout_within_n_bars":
        n = params.get("bars", 3)
        if idx < n:
            return False
        # Simplified: check if we had a high then lower closes
        segment = bars[max(0, idx - n) : idx + 1]
        if len(segment) < 2:
            return False
        high_idx = max(range(len(segment)), key=lambda i: segment[i].h)
        return high_idx < len(segment) - 1

    if rule == "first_lower_high_5min":
        if idx < 2:
            return False
        highs = [prev_bars[i].h for i in range(max(0, idx - 5), idx + 1)]
        return len(highs) >= 2 and highs[-1] < max(highs[:-1])

    if rule == "upper_wick_ratio_threshold":
        body = abs(b.c - b.o)
        if body < 1e-9:
            return False
        upper_wick = b.h - max(b.o, b.c)
        ratio = upper_wick / body
        return ratio >= params.get("min_wick_to_body_ratio", 0)

    if rule == "volume_climax_bar":
        n = 5
        if len(prev_bars) < n + 1:
            return True
        avg_v = sum(p.v for p in prev_bars[-n - 1 : -1]) / max(1, n)
        return b.v >= avg_v * params.get("min_multiple_vs_5bar_avg", 1)

    if rule == "declining_volume_on_bounce":
        comp = params.get("comparison_bars", 3)
        if idx < comp:
            return True
        recent = [prev_bars[i].v for i in range(idx - comp, idx + 1)]
        return len(recent) >= 2 and recent[-1] <= recent[-2]

    if rule == "daily_lower_high":
        if idx < 2:
            return False
        return prev_bars[-1].h < max(prev_bars[-3].h, prev_bars[-2].h) if len(prev_bars) >= 3 else False

    if rule == "break_of_morning_support":
        return True  # Stub: need intraday structure

    if rule == "close_below_previous_day_midpoint":
        if idx < 1:
            return False
        prev = prev_bars[-2]
        mid = (prev.h + prev.l) / 2
        return b.c < mid

    return True


def eval_exit_rule(
    exit_type: str,
    params: dict,
    entry_price: float,
    current_bar: Bar,
    bars: list[Bar],
    position_pnl_pct: float,
) -> tuple[bool, float]:
    """
    Return (should_exit, exit_price_or_0).
    """
    if exit_type == "partial_cover_pct":
        target = params.get("target_pct", 7)
        if position_pnl_pct >= target:
            return True, current_bar.c
        return False, 0.0

    if exit_type == "vwap_touch_exit":
        vwap_val = _vwap(bars) if bars else None
        if vwap_val and current_bar.l <= vwap_val <= current_bar.h:
            return True, vwap_val
        return False, 0.0

    if exit_type == "structure_based_trailing":
        return False, 0.0  # Stub

    if exit_type == "retrace_of_total_move_pct":
        target = params.get("target_pct", 50)
        # Simplified: exit when we've retraced 50% from high
        return False, 0.0  # Stub

    if exit_type == "cover_near_prior_breakout_base":
        return False, 0.0  # Stub

    return False, 0.0
