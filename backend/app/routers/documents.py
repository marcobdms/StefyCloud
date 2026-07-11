import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.Document)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "unknown"
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_bytes = os.path.getsize(file_path)
    url = f"/uploads/{unique_filename}"
    
    db_doc = models.Document(
        name=file.filename,
        type=ext,
        size_bytes=size_bytes,
        url=url
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

@router.get("/", response_model=List[schemas.Document])
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    docs = db.query(models.Document).order_by(models.Document.updated_at.desc()).offset(skip).limit(limit).all()
    return docs

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if db_doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Eliminar archivo físico
    if db_doc.url:
        filename = db_doc.url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
    db.delete(db_doc)
    db.commit()
    return {"ok": True}
