from fastapi import APIRouter, Depends, HTTPException, Request, status

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserProfile
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, PasswordResetRequest, PasswordResetConfirm
from app.auth import create_access_token, hash_password, verify_password
from app.middleware.rate_limit import rate_limit_auth

router = APIRouter()


async def _rate_limit_register(request: Request):
    await rate_limit_auth(request, "register")


async def _rate_limit_login(request: Request):
    await rate_limit_auth(request, "login")


@router.post("/register", response_model=Token)
async def register(
    request: Request,
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_rate_limit_register),
):
    try:
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            email_verified=False,
        )
        db.add(user)
        await db.flush()
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
        await db.refresh(user)
        token = create_access_token({"sub": str(user.id), "email": user.email})
        return Token(access_token=token)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_rate_limit_login),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token)


def _hash_token(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/password-reset/request")
async def password_reset_request(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request password reset. Always returns success (don't reveal if email exists)."""
    import secrets
    from datetime import datetime, timedelta
    from sqlalchemy import text

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        token_hash = _hash_token(token)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        await db.execute(
            text("""
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
                VALUES (:user_id, :token_hash, :expires_at, :created_at)
            """),
            {"user_id": user.id, "token_hash": token_hash, "expires_at": expires_at, "created_at": datetime.utcnow()}
        )
        await db.commit()
        # TODO: Send email with reset link. For dev without email: {frontend_origin}/reset-password?token={token}
    return {"ok": True}


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    """Confirm password reset with token and new password."""
    from datetime import datetime
    from app.auth.password import hash_password
    from sqlalchemy import text

    token_hash = _hash_token(data.token)
    result = await db.execute(
        text("""
            SELECT id, user_id FROM password_reset_tokens
            WHERE token_hash = :token_hash AND expires_at > :now
        """),
        {"token_hash": token_hash, "now": datetime.utcnow()}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user_result = await db.execute(select(User).where(User.id == row[1]))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.hashed_password = hash_password(data.new_password)
    await db.execute(text("DELETE FROM password_reset_tokens WHERE id = :id"), {"id": row[0]})
    await db.commit()
    return {"ok": True}


# Placeholder endpoints for OAuth - frontend can redirect here; backend would exchange code for token
@router.get("/google")
async def google_auth():
    return {"message": "Redirect to Google OAuth; implement with authlib and frontend redirect_uri"}


@router.get("/tradingview")
async def tradingview_auth():
    return {"message": "Redirect to TradingView OAuth; implement with TradingView client credentials"}


@router.get("/apple")
async def apple_auth():
    return {"message": "Redirect to Apple Sign In; implement with Apple JS SDK and backend verify"}
