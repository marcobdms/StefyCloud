import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from . import models
from .storage import delete_upload


TRASH_RETENTION_DAYS = 10


def utc_now() -> datetime:
    """UTC sin tzinfo para mantener compatibilidad con SQLite y PostgreSQL."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def serialize_datetime(value: datetime | None) -> str | None:
    value = normalize_datetime(value)
    return value.isoformat() if value else None


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return normalize_datetime(value)
    try:
        return normalize_datetime(datetime.fromisoformat(str(value)))
    except ValueError:
        return None


def dump_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def load_json(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def days_left(expires_at: datetime | None) -> int:
    expires_at = normalize_datetime(expires_at)
    if expires_at is None:
        return 0
    seconds_left = (expires_at - utc_now()).total_seconds()
    return max(0, math.ceil(seconds_left / 86400))


def log_activity(
    db: Session,
    *,
    action: str,
    item_type: str,
    item_id: str | None,
    title: str | None,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        models.ActivityLog(
            action=action,
            item_type=item_type,
            item_id=item_id,
            title=title or "Sin título",
            metadata_json=dump_json(metadata or {}),
        )
    )


def create_trash_item(
    db: Session,
    *,
    item_type: str,
    item_id: str,
    title: str | None,
    payload: dict[str, Any],
    file_urls: list[str | None] | None = None,
) -> models.TrashItem:
    now = utc_now()
    urls = [url for url in (file_urls or []) if url]
    trash_item = models.TrashItem(
        item_type=item_type,
        item_id=item_id,
        title=title or "Sin título",
        payload=dump_json(payload),
        file_urls=dump_json(urls),
        deleted_at=now,
        expires_at=now + timedelta(days=TRASH_RETENTION_DAYS),
    )
    db.add(trash_item)
    log_activity(
        db,
        action="deleted",
        item_type=item_type,
        item_id=item_id,
        title=title,
    )
    return trash_item


def purge_file_urls(file_urls: list[str]) -> None:
    for url in sorted(set(file_urls)):
        delete_upload(url)


def load_file_urls(value: str | None) -> list[str]:
    urls = load_json(value, [])
    if not isinstance(urls, list):
        return []
    return [url for url in urls if isinstance(url, str) and url]


def cleanup_expired_trash(db: Session) -> int:
    expired_items = (
        db.query(models.TrashItem)
        .filter(models.TrashItem.expires_at <= utc_now())
        .all()
    )
    file_urls_to_purge: list[str] = []
    for item in expired_items:
        file_urls_to_purge.extend(load_file_urls(item.file_urls))
        log_activity(
            db,
            action="purged",
            item_type=item.item_type,
            item_id=item.item_id,
            title=item.title,
            metadata={"reason": "expired"},
        )
        db.delete(item)
    if expired_items:
        db.commit()
        purge_file_urls(file_urls_to_purge)
    return len(expired_items)
