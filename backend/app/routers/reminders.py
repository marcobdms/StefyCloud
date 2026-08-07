from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..favorites_utils import remove_favorites_for_item
from ..trash_utils import create_trash_item, log_activity, serialize_datetime

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.post("/", response_model=schemas.Reminder, response_model_by_alias=True)
def create_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.Reminder(**reminder.model_dump())
    db.add(db_reminder)
    db.flush()
    log_activity(
        db,
        action="created",
        item_type="reminder",
        item_id=db_reminder.id,
        title=db_reminder.title,
    )
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/", response_model=List[schemas.Reminder], response_model_by_alias=True)
def read_reminders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Reminder).offset(skip).limit(limit).all()

@router.patch("/{reminder_id}", response_model=schemas.Reminder, response_model_by_alias=True)
def update_reminder(reminder_id: str, reminder: schemas.ReminderUpdate, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if db_reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    updates = reminder.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_reminder, key, value)
    if {"date", "time", "timezone"} & updates.keys():
        db_reminder.notified_at = None
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if db_reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    create_trash_item(
        db,
        item_type="reminder",
        item_id=db_reminder.id,
        title=db_reminder.title,
        payload={
            "id": db_reminder.id,
            "title": db_reminder.title,
            "description": db_reminder.description,
            "completed": db_reminder.completed,
            "date": db_reminder.date,
            "time": db_reminder.time,
            "timezone": db_reminder.timezone,
            "priority": db_reminder.priority,
            "group_name": db_reminder.group_name,
            "notified_at": serialize_datetime(db_reminder.notified_at),
        },
    )
    remove_favorites_for_item(db, "reminder", db_reminder.id)
    db.delete(db_reminder)
    db.commit()
    return {"ok": True}
