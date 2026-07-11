import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Por defecto usa SQLite local. En producción (Coolify) le pasarás DATABASE_URL.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stefany_cloud.db")

# SQLite necesita un check_same_thread=False
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
