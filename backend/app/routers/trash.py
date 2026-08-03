from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..trash_utils import (
    cleanup_expired_trash,
    days_left,
    load_file_urls,
    load_json,
    log_activity,
    parse_datetime,
    purge_file_urls,
    utc_now,
)


router = APIRouter(prefix="/api/trash", tags=["Trash"])


def serialize_trash_item(item: models.TrashItem) -> dict:
    return {
        "id": item.id,
        "item_type": item.item_type,
        "item_id": item.item_id,
        "title": item.title or "Sin título",
        "deleted_at": item.deleted_at,
        "expires_at": item.expires_at,
        "days_left": days_left(item.expires_at),
    }


def ensure_original_missing(db: Session, item: models.TrashItem) -> None:
    model_by_type = {
        "note": models.Note,
        "document": models.Document,
        "image": models.CloudImage,
        "reminder": models.Reminder,
    }
    model = model_by_type.get(item.item_type)
    if model is None:
        raise HTTPException(status_code=400, detail="Tipo de elemento no soportado")
    existing = db.query(model).filter(model.id == item.item_id).first()
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un elemento activo con este identificador",
        )


def restore_model_from_payload(item: models.TrashItem) -> object:
    payload = load_json(item.payload, {})
    if item.item_type == "note":
        return models.Note(
            id=item.item_id,
            title=payload.get("title", ""),
            content=payload.get("content", ""),
            created_at=parse_datetime(payload.get("created_at")) or utc_now(),
            updated_at=parse_datetime(payload.get("updated_at")) or utc_now(),
        )
    if item.item_type == "document":
        return models.Document(
            id=item.item_id,
            name=payload.get("name", item.title),
            type=payload.get("type", ""),
            size_bytes=payload.get("size_bytes", 0) or 0,
            url=payload.get("url"),
            updated_at=parse_datetime(payload.get("updated_at")) or utc_now(),
        )
    if item.item_type == "image":
        return models.CloudImage(
            id=item.item_id,
            title=payload.get("title", item.title),
            url=payload.get("url", ""),
            thumbnail=payload.get("thumbnail", payload.get("url", "")),
            created_at=parse_datetime(payload.get("created_at")) or utc_now(),
        )
    if item.item_type == "reminder":
        return models.Reminder(
            id=item.item_id,
            title=payload.get("title", item.title),
            description=payload.get("description"),
            completed=payload.get("completed", False),
            date=payload.get("date", ""),
            time=payload.get("time"),
            timezone=payload.get("timezone"),
            priority=payload.get("priority", "medium"),
            group_name=payload.get("group_name", "upcoming"),
            notified_at=parse_datetime(payload.get("notified_at")),
        )
    raise HTTPException(status_code=400, detail="Tipo de elemento no soportado")


@router.get("/", response_model=List[schemas.TrashItem], response_model_by_alias=True)
def read_trash(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cleanup_expired_trash(db)
    items = (
        db.query(models.TrashItem)
        .order_by(models.TrashItem.deleted_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [serialize_trash_item(item) for item in items]


@router.get("/activity", response_model=List[schemas.ActivityLog], response_model_by_alias=True)
def read_activity(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    cleanup_expired_trash(db)
    return (
        db.query(models.ActivityLog)
        .order_by(models.ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/{trash_id}/restore")
def restore_trash_item(trash_id: str, db: Session = Depends(get_db)):
    cleanup_expired_trash(db)
    item = db.query(models.TrashItem).filter(models.TrashItem.id == trash_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Elemento no encontrado en la papelera")

    ensure_original_missing(db, item)
    restored = restore_model_from_payload(item)
    db.add(restored)
    log_activity(
        db,
        action="restored",
        item_type=item.item_type,
        item_id=item.item_id,
        title=item.title,
    )
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.delete("/{trash_id}")
def permanently_delete_trash_item(trash_id: str, db: Session = Depends(get_db)):
    cleanup_expired_trash(db)
    item = db.query(models.TrashItem).filter(models.TrashItem.id == trash_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Elemento no encontrado en la papelera")

    file_urls = load_file_urls(item.file_urls)
    log_activity(
        db,
        action="permanently_deleted",
        item_type=item.item_type,
        item_id=item.item_id,
        title=item.title,
    )
    db.delete(item)
    db.commit()
    purge_file_urls(file_urls)
    return {"ok": True}
