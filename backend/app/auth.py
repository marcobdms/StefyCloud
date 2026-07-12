import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 15

APP_PASSWORD = os.getenv("APP_PASSWORD", "stefany123")  # Cámbiala en Coolify

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str) -> bool:
    """Compara la contraseña enviada con APP_PASSWORD."""
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
