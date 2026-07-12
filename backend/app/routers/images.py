import os, shutil, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/images", tags=["Images"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.CloudImage, response_model_by_alias=True)
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    url = f"/uploads/{unique_filename}"
    db_img = models.CloudImage(title=file.filename.rsplit(".", 1)[0], url=url, thumbnail=url)
    db.add(db_img)
    db.commit()
    db.refresh(db_img)
    return db_img

@router.get("/", response_model=List[schemas.CloudImage], response_model_by_alias=True)
def read_images(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.CloudImage).order_by(models.CloudImage.created_at.desc()).offset(skip).limit(limit).all()

@router.delete("/{img_id}")
def delete_image(img_id: str, db: Session = Depends(get_db)):
    db_img = db.query(models.CloudImage).filter(models.CloudImage.id == img_id).first()
    if db_img is None:
        raise HTTPException(status_code=404, detail="Image not found")
    if db_img.url:
        fp = os.path.join(UPLOAD_DIR, db_img.url.split("/")[-1])
        if os.path.exists(fp):
            os.remove(fp)
    db.delete(db_img)
    db.commit()
    return {"ok": True}
