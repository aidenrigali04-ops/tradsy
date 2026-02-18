"""
Backtest runner: runs strategy logic over historical range and returns metrics.
Uses config-driven rule engine when strategy has code_or_config (JSON).
"""
from datetime import datetime, timedelta
from typing import Optional

from app.strategies import load_config, run_backtest_from_config


async def run_backtest(
    strategy_id: int,
    symbol: str = "AAPL",
    timeframe: str = "1D",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    config_json: Optional[str] = None,
) -> dict:
    """Run backtest for a strategy. Uses config if provided, else placeholder."""
    end_date = end_date or datetime.utcnow()
    start_date = start_date or (end_date - timedelta(days=365))

    if config_json:
        try:
            config = load_config(config_json)
            result = run_backtest_from_config(
                config, symbol=symbol, start_date=start_date, end_date=end_date
            )
            return {
                "strategy_id": strategy_id,
                **result,
            }
        except Exception:
            pass

    return {
        "strategy_id": strategy_id,
        "symbol": symbol,
        "timeframe": timeframe,
        "start_time": start_date,
        "end_time": end_date,
        "pnl": 0.0,
        "pnl_pct": 0.0,
        "win_rate": 0.0,
        "max_drawdown": 0.0,
        "num_trades": 0,
    }
