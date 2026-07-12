import os
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from .database import engine, Base, SessionLocal, get_db
from .routers import notes, reminders, documents, images
from .routers import auth as auth_router
from .routers import push as push_router
from .routers.push import send_push_notification
from .auth import decode_token
from . import models

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stefany Cloud API")

# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "https://stefy-cloud.vercel.app"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos subidos
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Dependencia de autenticación
def require_auth(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = auth_header.removeprefix("Bearer ")
    if not decode_token(token):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    # Verificar que la sesión existe en BD (no ha sido revocada)
    from .auth import hash_token
    token_h = hash_token(token)
    session = db.query(models.Session).filter(models.Session.token_hash == token_h).first()
    if not session:
        raise HTTPException(status_code=401, detail="Sesión no encontrada. Inicia sesión de nuevo.")

# Routers
app.include_router(auth_router.router)
app.include_router(push_router.router)
app.include_router(notes.router, dependencies=[Depends(require_auth)])
app.include_router(reminders.router, dependencies=[Depends(require_auth)])
app.include_router(documents.router, dependencies=[Depends(require_auth)])
app.include_router(images.router, dependencies=[Depends(require_auth)])

@app.get("/")
def read_root():
    return {"message": "Stefany Cloud API is running."}

@app.get("/api/me")
def me(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = auth_header.removeprefix("Bearer ")
    if not decode_token(token):
        raise HTTPException(status_code=401, detail="No autenticado")
    return {"ok": True}


# ── Scheduler: revisa recordatorios cada minuto ──────────────────────────────
def check_reminders():
    """Envía push si hay un recordatorio que empieza en los próximos 5 minutos."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")

        # Busca recordatorios de hoy, no completados, con hora definida
        pending = db.query(models.Reminder).filter(
            models.Reminder.date == today_str,
            models.Reminder.completed == False,
            models.Reminder.time != None,
        ).all()

        for reminder in pending:
            if reminder.time == current_time:
                subscriptions = db.query(models.PushSubscription).all()
                for sub in subscriptions:
                    send_push_notification(
                        sub,
                        title=f"⏰ {reminder.title}",
                        body=reminder.description or "Es hora de tu recordatorio",
                        url="/reminders",
                    )
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(check_reminders, "interval", minutes=1)
scheduler.start()
