from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.strategy import Guru, Strategy
from app.schemas.guru import GuruResponse, StrategyResponse
from app.dependencies import get_current_user_optional

router = APIRouter()


@router.get("", response_model=list[GuruResponse])
async def list_gurus(
    db=Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(select(Guru).order_by(Guru.name))
    gurus = result.scalars().all()
    return [GuruResponse.model_validate(g) for g in gurus]


@router.get("/similar", response_model=list[GuruResponse])
async def similar_gurus(
    guru_id: int = Query(..., description="Guru ID to find similar to"),
    db=Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(select(Guru).where(Guru.id != guru_id).order_by(Guru.name).limit(5))
    gurus = result.scalars().all()
    return [GuruResponse.model_validate(g) for g in gurus]


@router.get("/{guru_id}/strategies", response_model=list[StrategyResponse])
async def list_strategies_by_guru(
    guru_id: int,
    db=Depends(get_db),
    _=Depends(get_current_user_optional),
):
    result = await db.execute(
        select(Strategy).where(Strategy.guru_id == guru_id).order_by(Strategy.name)
    )
    strategies = result.scalars().all()
    return [StrategyResponse.model_validate(s) for s in strategies]
