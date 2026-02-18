from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StrategyBacktestRun(Base):
    __tablename__ = "strategy_backtest_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    strategy_id: Mapped[int] = mapped_column(ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False)
    timeframe: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. 1D, 15m
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    pnl: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    win_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_drawdown: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    num_trades: Mapped[int] = mapped_column(Integer, default=0)
    params_snapshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
