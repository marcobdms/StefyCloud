from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.post("/", response_model=schemas.Reminder)
def create_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.Reminder(**reminder.model_dump())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/", response_model=List[schemas.Reminder])
def read_reminders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reminders = db.query(models.Reminder).offset(skip).limit(limit).all()
    return reminders

@router.patch("/{reminder_id}", response_model=schemas.Reminder)
def update_reminder(reminder_id: str, reminder: schemas.ReminderUpdate, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if db_reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    update_data = reminder.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reminder, key, value)
        
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if db_reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(db_reminder)
    db.commit()
    return {"ok": True}
