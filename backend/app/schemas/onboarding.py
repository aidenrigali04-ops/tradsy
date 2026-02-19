from typing import Optional
from pydantic import BaseModel
from app.models.user import ExperienceLevel, RiskTolerance


class OnboardingStep1(BaseModel):
    first_name: str
    risk_tolerance: RiskTolerance
    experience_level: ExperienceLevel
    risk_disclaimer_accepted: bool


class OnboardingStep2(BaseModel):
    custom_strategy_description: Optional[str] = None
    selected_guru_id: Optional[int] = None
    selected_strategy_id: Optional[int] = None


class OnboardingStatus(BaseModel):
    onboarding_completed: bool
    step: int  # 1 or 2
