from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..storage import delete_upload, save_upload

router = APIRouter(prefix="/api/images", tags=["Images"])
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif"}

@router.post("/", response_model=schemas.CloudImage, response_model_by_alias=True)
def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    original_name, _, stored_name, _ = save_upload(
        file,
        ALLOWED_EXTENSIONS,
        require_image_content_type=True,
    )
    url = f"/uploads/{stored_name}"
    db_img = models.CloudImage(
        title=original_name.rsplit(".", 1)[0],
        url=url,
        thumbnail=url,
    )
    try:
        db.add(db_img)
        db.commit()
        db.refresh(db_img)
    except Exception:
        db.rollback()
        delete_upload(url)
        raise
    return db_img

@router.get("/", response_model=List[schemas.CloudImage], response_model_by_alias=True)
def read_images(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.CloudImage).order_by(models.CloudImage.created_at.desc()).offset(skip).limit(limit).all()

@router.delete("/{img_id}")
def delete_image(img_id: str, db: Session = Depends(get_db)):
    db_img = db.query(models.CloudImage).filter(models.CloudImage.id == img_id).first()
    if db_img is None:
        raise HTTPException(status_code=404, detail="Image not found")
    delete_upload(db_img.url)
    db.delete(db_img)
    db.commit()
    return {"ok": True}
