"""
Risk assessment for overtrading warning UI.
Returns probability of loss, balance, and recommendation (apply risk-management).
In production: integrate with real P&amp;L, position size, and volatility.
"""
from typing import Any

from app.schemas.chat import RiskAssessmentResponse


# Mock balance per user (replace with DB/portfolio service)
def _mock_balance(user_id: int) -> float:
    """Return mock account balance. In production, fetch from portfolio/account API."""
    return 190.0


def _probability_of_loss(symbol: str, user_id: int) -> float:
    """
    Estimate probability that current entry would result in a loss.
    In production: use entry price vs current, volatility, stop placement.
    """
    return 45.0


def get_risk_assessment(symbol: str, user_id: int) -> RiskAssessmentResponse:
    """
    Build risk assessment for the overtrading warning UI.
    Logic: compare position/entry context to risk limits and market context;
    if overtrading signal, return high probability of loss and recommend risk management.
    """
    balance = _mock_balance(user_id)
    prob_loss = _probability_of_loss(symbol, user_id)
    message = (
        f"It appears that you are overtrading; your current entry point on this stock has a "
        f"**{int(prob_loss)}% chance of resulting in a loss.** "
        f"With your current balance at ${int(balance)}, I would advise implementing risk management strategies "
        f"or reconsidering this trade altogether."
    )
    return RiskAssessmentResponse(
        symbol=symbol,
        probability_loss_pct=prob_loss,
        balance=balance,
        message=message,
        show_apply=True,
    )
