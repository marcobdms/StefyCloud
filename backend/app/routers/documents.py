from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..favorites_utils import remove_favorites_for_item
from ..storage import delete_upload, save_upload
from ..trash_utils import create_trash_item, log_activity, serialize_datetime

router = APIRouter(prefix="/api/documents", tags=["Documents"])
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xls", "xlsx", "txt"}

@router.post("/", response_model=schemas.Document, response_model_by_alias=True)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    original_name, extension, stored_name, size_bytes = save_upload(
        file,
        ALLOWED_EXTENSIONS,
    )
    url = f"/uploads/{stored_name}"
    db_doc = models.Document(
        name=original_name,
        type=extension,
        size_bytes=size_bytes,
        url=url,
    )
    try:
        db.add(db_doc)
        db.flush()
        log_activity(
            db,
            action="created",
            item_type="document",
            item_id=db_doc.id,
            title=db_doc.name,
        )
        db.commit()
        db.refresh(db_doc)
    except Exception:
        db.rollback()
        delete_upload(url)
        raise
    return db_doc

@router.get("/", response_model=List[schemas.Document], response_model_by_alias=True)
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Document).order_by(models.Document.updated_at.desc()).offset(skip).limit(limit).all()

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    db_doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if db_doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    create_trash_item(
        db,
        item_type="document",
        item_id=db_doc.id,
        title=db_doc.name,
        payload={
            "id": db_doc.id,
            "name": db_doc.name,
            "type": db_doc.type,
            "size_bytes": db_doc.size_bytes,
            "url": db_doc.url,
            "updated_at": serialize_datetime(db_doc.updated_at),
        },
        file_urls=[db_doc.url],
    )
    remove_favorites_for_item(db, "document", db_doc.id)
    db.delete(db_doc)
    db.commit()
    return {"ok": True}
