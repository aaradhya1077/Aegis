from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt

from fastapi import HTTPException, status
from app.database import SessionLocal, DBUser

ACCESS_TOKEN_TTL_SECONDS = 60 * 60  # 1 hour
JWT_SECRET = os.getenv("JWT_SECRET", "aegis-compliance-secret-key-2026")
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, ttl_seconds: int = ACCESS_TOKEN_TTL_SECONDS) -> str:
    """Generate a signed cryptographic JWT access token."""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(seconds=ttl_seconds),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Generate a signed cryptographic JWT refresh token."""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def validate_access_token(token: Optional[str]) -> dict:
    """Decode and validate a JWT access token."""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")


def require_user_from_token(token: Optional[str]) -> dict:
    """Extract claims from a valid token and fetch user details from database."""
    payload = validate_access_token(token)
    user_id = payload["sub"]

    db = SessionLocal()
    try:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
        return {
            "id": user.id,
            "name": user.name,
            "role": user.role,
        }
    finally:
        db.close()


def parse_authorization_header(header_value: Optional[str]) -> Optional[str]:
    """Parse bearer authorization header."""
    if not header_value:
        return None
    if not header_value.lower().startswith("bearer "):
        return None
    return header_value.split(" ", 1)[1].strip() or None
