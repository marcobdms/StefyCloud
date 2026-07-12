from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, default="")
    content = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    type = Column(String) # pdf, docx, etc.
    size_bytes = Column(Integer)
    url = Column(String, nullable=True) # URL o ruta al archivo guardado
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class CloudImage(Base):
    __tablename__ = "images"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, index=True)
    url = Column(String) # URL al archivo grande
    thumbnail = Column(String) # URL al thumbnail
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    date = Column(String) # ISO date string YYYY-MM-DD
    time = Column(String, nullable=True) # HH:MM
    priority = Column(String) # low, medium, high
    group_name = Column(String) # today, tomorrow, upcoming. Se calculará en el endpoint o cliente.


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    endpoint = Column(String, unique=True, index=True)
    p256dh = Column(String)
    auth = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    token_hash = Column(String, unique=True, index=True)  # Hash del JWT para identificarlo
    device_label = Column(String, nullable=True)           # Ej: "iPhone de Stefany"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

