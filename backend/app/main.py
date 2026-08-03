import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from .database import engine, Base, SessionLocal
from .dependencies import require_auth
from .migrations import apply_compatibility_migrations
from .reminder_scheduler import process_due_reminders
from .storage import UPLOAD_DIR
from .trash_utils import cleanup_expired_trash
from .routers import notes, reminders, documents, images, trash
from .routers import auth as auth_router
from .routers import push as push_router
from .auth import decode_token

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)
apply_compatibility_migrations()


def check_reminders():
    db = SessionLocal()
    try:
        process_due_reminders(db)
    finally:
        db.close()


def check_trash_expiration():
    db = SessionLocal()
    try:
        cleanup_expired_trash(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    del app
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        check_reminders,
        "interval",
        minutes=1,
        coalesce=True,
        max_instances=1,
    )
    scheduler.add_job(
        check_trash_expiration,
        "interval",
        hours=6,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Stefany Cloud API", lifespan=lifespan)

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
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth_router.router)
app.include_router(push_router.router)
app.include_router(notes.router, dependencies=[Depends(require_auth)])
app.include_router(reminders.router, dependencies=[Depends(require_auth)])
app.include_router(documents.router, dependencies=[Depends(require_auth)])
app.include_router(images.router, dependencies=[Depends(require_auth)])
app.include_router(trash.router, dependencies=[Depends(require_auth)])

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
