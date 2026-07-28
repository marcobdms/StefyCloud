import os
from datetime import datetime, timedelta, timezone
from typing import Callable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session

from . import models
from .routers.push import PushSendResult, send_push_notification

SendPush = Callable[
    [models.PushSubscription, str, str, str],
    PushSendResult,
]


def reminder_due_at_utc(
    reminder: models.Reminder,
    fallback_timezone: str | None = None,
) -> datetime | None:
    if not reminder.time:
        return None

    timezone_name = (
        reminder.timezone
        or fallback_timezone
        or os.getenv("DEFAULT_TIMEZONE", "UTC")
    )
    try:
        reminder_zone = ZoneInfo(timezone_name)
        local_due_at = datetime.strptime(
            f"{reminder.date} {reminder.time}",
            "%Y-%m-%d %H:%M",
        ).replace(tzinfo=reminder_zone)
    except (ValueError, ZoneInfoNotFoundError):
        return None

    return local_due_at.astimezone(timezone.utc)


def process_due_reminders(
    db: Session,
    now: datetime | None = None,
    send_push: SendPush = send_push_notification,
    grace_minutes: int | None = None,
) -> int:
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    else:
        current_time = current_time.astimezone(timezone.utc)

    grace = grace_minutes or int(os.getenv("REMINDER_GRACE_MINUTES", "15"))
    earliest_due_at = current_time - timedelta(minutes=grace)

    pending = (
        db.query(models.Reminder)
        .filter(
            models.Reminder.completed.is_(False),
            models.Reminder.time.is_not(None),
            models.Reminder.notified_at.is_(None),
        )
        .all()
    )
    subscriptions = db.query(models.PushSubscription).all()
    if not subscriptions:
        return 0

    sent_count = 0
    for reminder in pending:
        due_at = reminder_due_at_utc(reminder)
        if due_at is None or not (earliest_due_at <= due_at <= current_time):
            continue

        delivered = False
        stale_subscriptions: list[models.PushSubscription] = []
        for subscription in subscriptions:
            result = send_push(
                subscription,
                f"Recordatorio: {reminder.title}",
                reminder.description or "Es hora de tu recordatorio",
                f"/reminders/{reminder.id}",
            )
            if result == "sent":
                delivered = True
            elif result == "stale":
                stale_subscriptions.append(subscription)

        for subscription in stale_subscriptions:
            db.delete(subscription)
            subscriptions.remove(subscription)

        if delivered:
            reminder.notified_at = current_time
            sent_count += 1

    db.commit()
    return sent_count
