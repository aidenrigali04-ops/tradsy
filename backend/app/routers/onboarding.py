from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.onboarding import OnboardingStep1, OnboardingStep2, OnboardingStatus
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/status", response_model=OnboardingStatus)
async def onboarding_status(user: User = Depends(get_current_user), db=Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        return OnboardingStatus(onboarding_completed=False, step=1)
    if profile.onboarding_completed:
        return OnboardingStatus(onboarding_completed=True, step=2)
    # Step 1 done if we have risk_tolerance and experience_level
    if profile.risk_tolerance is not None and profile.experience_level is not None:
        return OnboardingStatus(onboarding_completed=False, step=2)
    return OnboardingStatus(onboarding_completed=False, step=1)


@router.post("/step1")
async def onboarding_step1(
    data: OnboardingStep1,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not data.risk_disclaimer_accepted:
        raise HTTPException(status_code=400, detail="Risk disclaimer must be accepted to continue")
    user.first_name = data.first_name
    profile.risk_tolerance = data.risk_tolerance
    profile.experience_level = data.experience_level
    profile.risk_disclaimer_accepted_at = datetime.utcnow()
    await db.commit()
    return {"ok": True, "next_step": 2}


@router.post("/step2")
async def onboarding_step2(
    data: OnboardingStep2,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if data.custom_strategy_description is not None:
        profile.custom_strategy_description = data.custom_strategy_description
    if data.selected_guru_id is not None:
        profile.selected_guru_id = data.selected_guru_id
    if data.selected_strategy_id is not None:
        profile.selected_strategy_id = data.selected_strategy_id
    profile.onboarding_completed = True
    await db.commit()
    return {"ok": True, "onboarding_completed": True}
