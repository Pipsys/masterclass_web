from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.core.config import settings
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
async def register(payload: schemas.RegisterIn, db: AsyncSession = Depends(get_session)):
    existing = await db.execute(select(models.User).where(models.User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = models.User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenOut)
async def login(payload: schemas.LoginIn, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(models.User).where(models.User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expires_days)

    db.add(models.RefreshToken(user_id=user.id, token=refresh_token, expires_at=expires_at))
    await db.commit()

    return schemas.TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=schemas.TokenOut)
async def refresh(payload: schemas.RefreshIn, db: AsyncSession = Depends(get_session)):
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    result = await db.execute(
        select(models.RefreshToken).where(
            models.RefreshToken.token == payload.refresh_token,
            models.RefreshToken.revoked.is_(False),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    access_token = create_access_token(token_data.get("sub"))
    return schemas.TokenOut(access_token=access_token, refresh_token=payload.refresh_token)


@router.get("/me", response_model=schemas.UserOut)
async def me(user=Depends(get_current_user)):
    return user
