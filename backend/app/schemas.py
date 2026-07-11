from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ================= NOTES =================
class NoteBase(BaseModel):
    title: str = ""
    content: str = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Note(NoteBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ================= DOCUMENTS =================
class DocumentBase(BaseModel):
    name: str
    type: str
    size_bytes: int
    url: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    updated_at: datetime

    class Config:
        from_attributes = True

# ================= IMAGES =================
class CloudImageBase(BaseModel):
    title: str
    url: str
    thumbnail: str

class CloudImageCreate(CloudImageBase):
    pass

class CloudImage(CloudImageBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ================= REMINDERS =================
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    date: str
    time: Optional[str] = None
    priority: str
    group_name: str

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[str] = None
    group_name: Optional[str] = None

class Reminder(ReminderBase):
    id: str

    class Config:
        from_attributes = True
