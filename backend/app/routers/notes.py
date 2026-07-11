from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/", response_model=schemas.Note)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    db_note = models.Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[schemas.Note])
def read_notes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    notes = db.query(models.Note).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()
    return notes

@router.get("/{note_id}", response_model=schemas.Note)
def read_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.patch("/{note_id}", response_model=schemas.Note)
def update_note(note_id: str, note: schemas.NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)
        
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"ok": True}
