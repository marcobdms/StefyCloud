from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from . import models
from .auth import decode_token, hash_token
from .database import get_db


def get_authenticated_session(
    request: Request,
    db: Session = Depends(get_db),
) -> models.Session:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = auth_header.removeprefix("Bearer ")
    if not decode_token(token):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    session = (
        db.query(models.Session)
        .filter(models.Session.token_hash == hash_token(token))
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Sesión no encontrada. Inicia sesión de nuevo.",
        )
    return session


def require_auth(
    session: models.Session = Depends(get_authenticated_session),
) -> None:
    del session
