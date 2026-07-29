import os
import json
import base64
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException
from .. import models
from ..database import get_db
from ..dependencies import get_authenticated_session

router = APIRouter(prefix="/api/push", tags=["Push"])

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": f"mailto:{os.getenv('VAPID_EMAIL', 'admin@stefanycloud.com')}"}

PushSendResult = Literal["sent", "failed", "stale", "disabled"]


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscriptionPayload(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


def has_valid_vapid_public_key(value: str) -> bool:
    """Comprueba el formato de una clave pública VAPID P-256 sin exponer secretos."""
    try:
        padding = "=" * (-len(value) % 4)
        decoded = base64.urlsafe_b64decode(value + padding)
    except (ValueError, TypeError):
        return False
    return len(decoded) == 65 and decoded[0] == 4


@router.get("/config")
def push_config():
    """Entrega la clave pública usada por esta API para crear suscripciones push."""
    if not has_valid_vapid_public_key(VAPID_PUBLIC_KEY):
        raise HTTPException(
            status_code=503,
            detail="VAPID_PUBLIC_KEY no es una clave pública VAPID P-256 válida",
        )
    return {"publicKey": VAPID_PUBLIC_KEY}

@router.post("/subscribe")
def subscribe(
    body: SubscriptionPayload,
    db: Session = Depends(get_db),
    session: models.Session = Depends(get_authenticated_session),
):
    """Guarda la suscripción push del dispositivo."""
    existing = db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == body.endpoint
    ).first()

    if existing:
        existing.p256dh = body.keys.p256dh
        existing.auth = body.keys.auth
        existing.session_id = session.id
    else:
        sub = models.PushSubscription(
            endpoint=body.endpoint,
            p256dh=body.keys.p256dh,
            auth=body.keys.auth,
            session_id=session.id,
        )
        db.add(sub)

    db.commit()
    return {"ok": True}


@router.post("/unsubscribe")
def unsubscribe(
    body: SubscriptionPayload,
    db: Session = Depends(get_db),
    session: models.Session = Depends(get_authenticated_session),
):
    subscription = (
        db.query(models.PushSubscription)
        .filter(
            models.PushSubscription.endpoint == body.endpoint,
            models.PushSubscription.session_id == session.id,
        )
        .first()
    )
    if subscription:
        db.delete(subscription)
        db.commit()
    return {"ok": True}


@router.post("/test")
def test_notification(
    db: Session = Depends(get_db),
    session: models.Session = Depends(get_authenticated_session),
):
    subscriptions = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.session_id == session.id)
        .all()
    )
    if not subscriptions:
        raise HTTPException(
            status_code=404,
            detail="Este dispositivo no tiene una suscripción activa",
        )

    results = [
        send_push_notification(
            subscription,
            "Notificaciones activadas",
            "Stefany Cloud ya puede avisarte de tus recordatorios",
            "/reminders",
        )
        for subscription in subscriptions
    ]
    if "sent" in results:
        return {"ok": True}
    if "disabled" in results:
        raise HTTPException(
            status_code=503,
            detail="Las claves VAPID no están configuradas en el backend",
        )
    raise HTTPException(
        status_code=502,
        detail="La suscripción se guardó, pero la prueba no pudo entregarse",
    )


def send_push_notification(
    subscription: "models.PushSubscription",
    title: str,
    body: str,
    url: str = "/reminders",
) -> PushSendResult:
    """Envía una notificación push a un dispositivo."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        print("Push disabled: VAPID keys are not configured")
        return "disabled"

    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            },
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=dict(VAPID_CLAIMS),
        )
        return "sent"
    except WebPushException as ex:
        print(f"Push failed: {ex}")
        status_code = getattr(ex.response, "status_code", None)
        return "stale" if status_code in {404, 410} else "failed"
