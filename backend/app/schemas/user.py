from __future__ import annotations
from typing import Optional
from pydantic import BaseModel
from app.models.user import ExperienceLevel, RiskTolerance


class UserProfileUpdate(BaseModel):
    risk_tolerance: Optional[RiskTolerance] = None
    experience_level: Optional[ExperienceLevel] = None
    custom_strategy_description: Optional[str] = None
    selected_guru_id: Optional[int] = None
    selected_strategy_id: Optional[int] = None


class UserProfileResponse(BaseModel):
    risk_tolerance: Optional[str]
    experience_level: Optional[str]
    onboarding_completed: bool
    custom_strategy_description: Optional[str]
    selected_guru_id: Optional[int]
    selected_strategy_id: Optional[int]

    class Config:
        from_attributes = True
