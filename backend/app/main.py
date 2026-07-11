from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import notes, reminders, documents, images
import os

# Crear las tablas en la base de datos (En prod se suele usar Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stefany Cloud API")

# Configurar CORS (permitir Vercel y Localhost)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Cuando tengas el dominio de Vercel, lo añades aquí. Ej: "https://stefany-cloud.vercel.app"
    "*" # Temporalmente abierto para desarrollo. Quitar en prod.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos (uploads)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Incluir routers
app.include_router(notes.router)
app.include_router(reminders.router)
app.include_router(documents.router)
app.include_router(images.router)

@app.get("/")
def read_root():
    return {"message": "Stefany Cloud API is running."}
