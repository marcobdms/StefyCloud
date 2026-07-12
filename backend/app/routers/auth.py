from fastapi import APIRouter, HTTPException, Response, Request, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..auth import verify_password, create_access_token, decode_token, hash_token, MAX_SESSIONS
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if not verify_password(body.password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    # ── Límite de 2 dispositivos ──────────────────────────────
    active_sessions = db.query(models.Session).order_by(models.Session.created_at).all()

    if len(active_sessions) >= MAX_SESSIONS:
        raise HTTPException(
            status_code=403,
            detail=f"Ya hay {MAX_SESSIONS} dispositivos activos. Cierra sesión en otro dispositivo antes de continuar."
        )

    token = create_access_token()
    token_h = hash_token(token)

    # Detectar etiqueta del dispositivo desde User-Agent
    ua = request.headers.get("User-Agent", "Dispositivo desconocido")
    label = "iPhone" if "iPhone" in ua else ("Mac" if "Mac" in ua else "PC" if "Windows" in ua else ua[:40])

    db_session = models.Session(token_hash=token_h, device_label=label)
    db.add(db_session)
    db.commit()

    return {"ok": True, "token": token}


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    """Elimina la sesión del token actual de la base de datos."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.removeprefix("Bearer ")
        token_h = hash_token(token)
        db.query(models.Session).filter(models.Session.token_hash == token_h).delete()
        db.commit()
    return {"ok": True}


@router.get("/sessions")
def list_sessions(request: Request, db: Session = Depends(get_db)):
    """Lista los dispositivos activos (para que el usuario vea cuáles están conectados)."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or not decode_token(auth.removeprefix("Bearer ")):
        raise HTTPException(status_code=401, detail="No autenticado")

    sessions = db.query(models.Session).order_by(models.Session.created_at).all()
    return [{"id": s.id, "device": s.device_label, "createdAt": s.created_at.isoformat()} for s in sessions]
