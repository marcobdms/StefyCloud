import os
import json
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException
from .. import models
from ..database import get_db
from ..auth import decode_token

router = APIRouter(prefix="/api/push", tags=["Push"])

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": f"mailto:{os.getenv('VAPID_EMAIL', 'admin@stefanycloud.com')}"}

def require_auth(request: Request):
    token = request.cookies.get("access_token")
    if not token or not decode_token(token):
        raise HTTPException(status_code=401, detail="No autenticado")

@router.post("/subscribe")
def subscribe(request: Request, body: dict, db: Session = Depends(get_db)):
    """Guarda la suscripción push del dispositivo."""
    require_auth(request)
    endpoint = body.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Endpoint requerido")
    
    # Busca si ya existe esta suscripción
    existing = db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == endpoint
    ).first()
    
    if not existing:
        sub = models.PushSubscription(
            endpoint=endpoint,
            p256dh=body.get("keys", {}).get("p256dh", ""),
            auth=body.get("keys", {}).get("auth", ""),
        )
        db.add(sub)
        db.commit()
    
    return {"ok": True}

def send_push_notification(subscription: "models.PushSubscription", title: str, body: str, url: str = "/reminders"):
    """Envía una notificación push a un dispositivo."""
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        return  # VAPID no configurado, silencioso
    
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
            vapid_claims=VAPID_CLAIMS,
        )
    except WebPushException as ex:
        print(f"Push failed: {ex}")
