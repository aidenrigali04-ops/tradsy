from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class BacktestRunResponse(BaseModel):
    id: int
    strategy_id: int
    symbol: str
    timeframe: str
    start_time: datetime
    end_time: datetime
    pnl: float
    pnl_pct: Optional[float]
    win_rate: Optional[float]
    max_drawdown: Optional[float]
    num_trades: int
    created_at: datetime

    class Config:
        from_attributes = True


class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    timeframe: str = "1D"
