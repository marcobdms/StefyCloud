"""
routers/backup.py
-----------------
Endpoints de copia de seguridad para StefyCloud.

  GET  /api/backup/download      → Descarga el ZIP al momento
  POST /api/backup/upload-now    → Envía el ZIP a Telegram ahora mismo
  POST /api/backup/restore       → Restaura desde un ZIP de backup
"""

import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..backup_utils import build_backup_zip, restore_from_zip, upload_to_telegram
from ..database import get_db
from ..dependencies import require_auth

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/backup", tags=["Backup"])



@router.get("/download", dependencies=[Depends(require_auth)])
def download_backup(db: Session = Depends(get_db)):
    """
    Genera un ZIP con todos los datos y archivos de StefyCloud y lo devuelve
    como descarga directa al navegador.
    """
    zip_bytes = build_backup_zip(db)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"stefany-cloud-backup-{timestamp}.zip"

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(zip_bytes)),
        },
    )


@router.post("/upload-now", dependencies=[Depends(require_auth)])
def upload_backup_now(db: Session = Depends(get_db)):
    """
    Genera el ZIP y lo envía a Telegram inmediatamente (on-demand).
    """
    zip_bytes = build_backup_zip(db)
    success = upload_to_telegram(zip_bytes)
    if success:
        return {"ok": True, "message": "Copia de seguridad enviada a Telegram correctamente."}
    return {"ok": False, "message": "No se pudo enviar a Telegram. Comprueba TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID."}


@router.post("/restore", dependencies=[Depends(require_auth)])
async def restore_backup(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Recibe un archivo ZIP de backup y restaura su contenido.

    Estrategia: INSERT-IF-NOT-EXISTS por ID.
    Si un registro ya existe en la base de datos, se omite.
    Los archivos físicos que ya existen en uploads/ también se omiten.
    """
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un ZIP (.zip).")

    zip_bytes = await file.read()
    if not zip_bytes:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")

    try:
        result = restore_from_zip(zip_bytes, db)
    except Exception as exc:  # noqa: BLE001
        log.exception("Error durante la restauración del backup.")
        raise HTTPException(status_code=500, detail=f"Error al restaurar: {exc}") from exc

    return {"ok": True, **result}
