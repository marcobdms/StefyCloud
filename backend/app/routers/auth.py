from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(body: LoginRequest, response: Response):
    if not verify_password(body.password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    token = create_access_token()

    # Cookie httpOnly: el navegador la envía automáticamente en cada petición
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,        # Solo HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * ACCESS_TOKEN_EXPIRE_DAYS,  # 15 días en segundos
    )
    return {"ok": True}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}
