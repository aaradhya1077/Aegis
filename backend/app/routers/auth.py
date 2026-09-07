from __future__ import annotations

from datetime import timedelta
import jwt
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.models import LoginRequest, RefreshResponse, TokenResponse, User
from app.database import SessionLocal, DBUser
from app.utils import (
    create_access_token,
    create_refresh_token,
    parse_authorization_header,
    require_user_from_token,
    verify_password,
    JWT_SECRET,
    JWT_ALGORITHM,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = int(timedelta(days=7).total_seconds())


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response) -> TokenResponse:
    user_id = payload.user_id

    db = SessionLocal()
    try:
        db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not db_user or not verify_password(payload.password, db_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)

        response.set_cookie(
            REFRESH_COOKIE_NAME,
            refresh_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=REFRESH_COOKIE_MAX_AGE,
        )

        user = User(id=user_id, name=db_user.name, role=db_user.role)
        return TokenResponse(accessToken=access_token, user=user)
    finally:
        db.close()


@router.get("/me", response_model=User)
def me(authorization: str | None = Header(default=None)) -> User:
    token = parse_authorization_header(authorization)
    user_dict = require_user_from_token(token)
    return User(**user_dict)


@router.post("/refresh", response_model=RefreshResponse)
def refresh_access_token(
    response: Response, refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
) -> RefreshResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type in refresh")
        user_id = payload["sub"]
    except jwt.ExpiredSignatureError:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
    except jwt.PyJWTError:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token = create_access_token(user_id)
    return RefreshResponse(accessToken=access_token)
