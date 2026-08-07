from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..favorites_utils import remove_favorites_for_item
from ..storage import delete_upload, save_upload
from ..trash_utils import create_trash_item, log_activity, serialize_datetime

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
        db.flush()
        log_activity(
            db,
            action="created",
            item_type="image",
            item_id=db_img.id,
            title=db_img.title,
        )
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
    create_trash_item(
        db,
        item_type="image",
        item_id=db_img.id,
        title=db_img.title,
        payload={
            "id": db_img.id,
            "title": db_img.title,
            "url": db_img.url,
            "thumbnail": db_img.thumbnail,
            "created_at": serialize_datetime(db_img.created_at),
        },
        file_urls=[db_img.url, db_img.thumbnail],
    )
    remove_favorites_for_item(db, "image", db_img.id)
    db.delete(db_img)
    db.commit()
    return {"ok": True}
