from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(body: LoginRequest):
    if not verify_password(body.password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    token = create_access_token()
    # Devolvemos el token en el body — el frontend lo guardará como cookie en su propio dominio
    return {"ok": True, "token": token}

@router.post("/logout")
def logout():
    return {"ok": True}
