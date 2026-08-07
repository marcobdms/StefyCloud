from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


def resolve_favorite_target(
    db: Session,
    item_type: str,
    item_id: str,
) -> tuple[str, str | None]:
    if item_type == "note":
        note = db.query(models.Note).filter(models.Note.id == item_id).first()
        if note is None:
            raise HTTPException(status_code=404, detail="Nota no encontrada")
        return note.title or "Sin título", f"/notes/{note.id}"

    if item_type == "document":
        document = db.query(models.Document).filter(models.Document.id == item_id).first()
        if document is None:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        return document.name or "Sin título", document.url

    if item_type == "image":
        image = db.query(models.CloudImage).filter(models.CloudImage.id == item_id).first()
        if image is None:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        return image.title or "Sin título", f"/images/{image.id}"

    if item_type == "reminder":
        reminder = db.query(models.Reminder).filter(models.Reminder.id == item_id).first()
        if reminder is None:
            raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
        return reminder.title or "Sin título", f"/reminders/{reminder.id}"

    raise HTTPException(status_code=400, detail="Tipo de favorito no soportado")


def serialize_favorite(db: Session, item: models.FavoriteItem) -> dict:
    try:
        title, target_url = resolve_favorite_target(db, item.item_type, item.item_id)
    except HTTPException:
        title, target_url = item.title or "Sin título", None

    return {
        "id": item.id,
        "item_type": item.item_type,
        "item_id": item.item_id,
        "title": title,
        "target_url": target_url,
        "created_at": item.created_at,
    }


@router.get("/", response_model=List[schemas.FavoriteItem], response_model_by_alias=True)
def read_favorites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = (
        db.query(models.FavoriteItem)
        .order_by(models.FavoriteItem.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_favorite(db, item) for item in items]


@router.post("/", response_model=schemas.FavoriteItem, response_model_by_alias=True)
def create_favorite(favorite: schemas.FavoriteCreate, db: Session = Depends(get_db)):
    title, _ = resolve_favorite_target(db, favorite.item_type, favorite.item_id)
    existing = (
        db.query(models.FavoriteItem)
        .filter(
            models.FavoriteItem.item_type == favorite.item_type,
            models.FavoriteItem.item_id == favorite.item_id,
        )
        .first()
    )
    if existing is not None:
        existing.title = title
        db.commit()
        db.refresh(existing)
        return serialize_favorite(db, existing)

    item = models.FavoriteItem(
        item_type=favorite.item_type,
        item_id=favorite.item_id,
        title=title,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_favorite(db, item)


@router.delete("/{favorite_id}")
def delete_favorite(favorite_id: str, db: Session = Depends(get_db)):
    item = db.query(models.FavoriteItem).filter(models.FavoriteItem.id == favorite_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Favorito no encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}
