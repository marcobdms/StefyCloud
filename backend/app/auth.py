import os
import hashlib
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 15
MAX_SESSIONS = 2

APP_PASSWORD = os.getenv("APP_PASSWORD", "stefany123")

def verify_password(plain: str) -> bool:
    return plain == APP_PASSWORD

def create_access_token() -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"exp": expire, "sub": "stefany"}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> bool:
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return True
    except Exception:
        return False

def hash_token(token: str) -> str:
    """Hash del token para guardar en BD sin exponer el JWT completo."""
    return hashlib.sha256(token.encode()).hexdigest()
