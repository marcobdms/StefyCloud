from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime

# Config base que convierte snake_case → camelCase en JSON
class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=lambda s: ''.join(w.capitalize() if i else w for i, w in enumerate(s.split('_')))
    )

# ================= NOTES =================
class NoteCreate(BaseModel):
    title: str = ""
    content: str = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Note(CamelModel):
    id: str
    title: str = ""
    content: str = ""
    created_at: datetime
    updated_at: datetime

# ================= DOCUMENTS =================
class DocumentCreate(BaseModel):
    name: str
    type: str
    size_bytes: int
    url: Optional[str] = None

class Document(CamelModel):
    id: str
    name: str
    type: str
    size_bytes: int
    url: Optional[str] = None
    updated_at: datetime

# ================= IMAGES =================
class CloudImageCreate(BaseModel):
    title: str
    url: str
    thumbnail: str

class CloudImage(CamelModel):
    id: str
    title: str
    url: str
    thumbnail: str
    created_at: datetime

# ================= REMINDERS =================
class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    date: str
    time: Optional[str] = None
    priority: str
    group_name: str

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[str] = None
    group_name: Optional[str] = None

class Reminder(CamelModel):
    id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
    date: str
    time: Optional[str] = None
    priority: str
    group_name: str
