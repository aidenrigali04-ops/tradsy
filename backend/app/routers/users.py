from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.auth import UserResponse
from app.schemas.user import UserProfileResponse
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.get("/me/profile", response_model=UserProfileResponse)
async def my_profile(user: User = Depends(get_current_user), db=Depends(get_db)):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return UserProfileResponse(
            risk_tolerance=None,
            experience_level=None,
            onboarding_completed=False,
            custom_strategy_description=None,
            selected_guru_id=None,
            selected_strategy_id=None,
        )
    return UserProfileResponse(
        risk_tolerance=profile.risk_tolerance.value if profile.risk_tolerance else None,
        experience_level=profile.experience_level.value if profile.experience_level else None,
        onboarding_completed=profile.onboarding_completed,
        custom_strategy_description=profile.custom_strategy_description,
        selected_guru_id=profile.selected_guru_id,
        selected_strategy_id=profile.selected_strategy_id,
    )
