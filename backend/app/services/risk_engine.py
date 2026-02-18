"""
Risk management engine: validates order size, stop-loss, daily limits.
Used when executing orders (Phase 4).
"""
from typing import Optional
from enum import Enum


class RiskTolerance(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Max position size as fraction of account (example)
MAX_POSITION_FRACTION = {
    RiskTolerance.LOW: 0.05,
    RiskTolerance.MEDIUM: 0.10,
    RiskTolerance.HIGH: 0.20,
}

# Max daily loss as fraction of account
MAX_DAILY_LOSS_FRACTION = {
    RiskTolerance.LOW: 0.01,
    RiskTolerance.MEDIUM: 0.02,
    RiskTolerance.HIGH: 0.05,
}


def max_position_size(account_balance: float, risk_tolerance: Optional[str]) -> float:
    """Return max allowed position size in currency."""
    rt = RiskTolerance(risk_tolerance) if risk_tolerance else RiskTolerance.MEDIUM
    return account_balance * MAX_POSITION_FRACTION.get(rt, 0.10)


def max_daily_loss(account_balance: float, risk_tolerance: Optional[str]) -> float:
    """Return max allowed daily loss in currency."""
    rt = RiskTolerance(risk_tolerance) if risk_tolerance else RiskTolerance.MEDIUM
    return account_balance * MAX_DAILY_LOSS_FRACTION.get(rt, 0.02)


def validate_position_size(
    size: float,
    price: float,
    account_balance: float,
    risk_tolerance: Optional[str],
) -> tuple[bool, Optional[str]]:
    """Validate notional position size. Returns (ok, error_message)."""
    notional = size * price
    max_allowed = max_position_size(account_balance, risk_tolerance)
    if notional > max_allowed:
        return False, f"Position size ${notional:.2f} exceeds max ${max_allowed:.2f}"
    return True, None
