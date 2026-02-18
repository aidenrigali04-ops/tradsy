from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.database import get_db
from app.models.strategy import Strategy, Guru
from app.models.backtest import StrategyBacktestRun
from app.schemas.guru import StrategyResponse
from app.schemas.backtest import BacktestRunResponse, BacktestRequest
from app.dependencies import get_current_user_optional
from app.services.backtest import run_backtest

router = APIRouter()


@router.get("", response_model=list[StrategyResponse])
async def list_strategies(
    guru_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user_optional),
):
    q = select(Strategy).order_by(Strategy.name)
    if guru_id is not None:
        q = q.where(Strategy.guru_id == guru_id)
    result = await db.execute(q)
    strategies = result.scalars().all()
    return [StrategyResponse.model_validate(s) for s in strategies]


@router.get("/similar", response_model=list[StrategyResponse])
async def similar_strategies(
    strategy_id: int = Query(..., description="Strategy ID to find similar to"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    if not strategy:
        return []
    result = await db.execute(
        select(Strategy)
        .where(Strategy.guru_id == strategy.guru_id, Strategy.id != strategy_id)
        .limit(5)
    )
    strategies = result.scalars().all()
    return [StrategyResponse.model_validate(s) for s in strategies]


@router.post("/{strategy_id}/backtest", response_model=BacktestRunResponse)
async def trigger_backtest(
    strategy_id: int,
    body: BacktestRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=365)
    metrics = await run_backtest(
        strategy_id=strategy_id,
        symbol=body.symbol,
        timeframe=body.timeframe,
        start_date=start_time,
        end_date=end_time,
        config_json=strategy.code_or_config,
    )
    run = StrategyBacktestRun(
        strategy_id=strategy_id,
        symbol=metrics["symbol"],
        timeframe=metrics["timeframe"],
        start_time=metrics["start_time"],
        end_time=metrics["end_time"],
        pnl=metrics["pnl"],
        pnl_pct=metrics.get("pnl_pct"),
        win_rate=metrics.get("win_rate"),
        max_drawdown=metrics.get("max_drawdown"),
        num_trades=metrics.get("num_trades", 0),
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return BacktestRunResponse.model_validate(run)


@router.get("/{strategy_id}/backtests", response_model=list[BacktestRunResponse])
async def list_backtests(
    strategy_id: int,
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(
        select(StrategyBacktestRun)
        .where(StrategyBacktestRun.strategy_id == strategy_id)
        .order_by(StrategyBacktestRun.created_at.desc())
        .limit(limit)
    )
    runs = result.scalars().all()
    return [BacktestRunResponse.model_validate(r) for r in runs]
