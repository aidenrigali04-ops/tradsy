"""
Pydantic models for guru strategy config (JSON).
Matches the Steven Dux config format provided.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


class PersonalityProfile(BaseModel):
    risk_tolerance: Optional[str] = None
    decision_speed: Optional[str] = None
    holding_period: Optional[str] = None
    psychological_edge: Optional[str] = None
    common_failure_mode: Optional[str] = None


class MarketFocus(BaseModel):
    asset_type: Optional[str] = None
    market_cap_preference: Optional[str] = None
    volatility_profile: Optional[str] = None


class EntryIndicator(BaseModel):
    indicator: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class ConfirmationRule(BaseModel):
    rule: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class PositionSizing(BaseModel):
    model: Optional[str] = None
    base_risk_per_trade_pct: Optional[float] = None
    max_risk_per_trade_pct: Optional[float] = None
    volatility_adjustment: Optional[bool] = None
    liquidity_adjustment: Optional[bool] = None


class ExitRule(BaseModel):
    type: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class RiskManagement(BaseModel):
    hard_stop_rule: Optional[str] = None
    max_adverse_excursion_pct: Optional[float] = None
    max_daily_loss_pct: Optional[float] = None
    max_trades_per_day: Optional[int] = None
    cooldown_after_loss_minutes: Optional[int] = None


class BehavioralModifier(BaseModel):
    rule: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class BacktestAssumptions(BaseModel):
    primary_timeframe: Optional[str] = None
    intraday_execution_context: Optional[str] = None
    historical_conditions: Optional[str] = None


class StrategyConfig(BaseModel):
    name: str
    personality_profile: Optional[PersonalityProfile] = None
    market_focus: Optional[MarketFocus] = None
    strategy_type: Optional[str] = None
    entries: list[EntryIndicator] = Field(default_factory=list)
    confirmation_rules: list[ConfirmationRule] = Field(default_factory=list)
    position_sizing: Optional[PositionSizing] = None
    exits: list[ExitRule] = Field(default_factory=list)
    risk_management: Optional[RiskManagement] = None
    behavioral_modifiers: list[BehavioralModifier] = Field(default_factory=list)
    backtest_assumptions: Optional[BacktestAssumptions] = None
