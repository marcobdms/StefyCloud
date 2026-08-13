"""
backup_utils.py
---------------
Genera y restaura copias de seguridad completas de StefyCloud en formato ZIP.

Contenido del ZIP:
  - uploads/          → todos los archivos físicos (imágenes, documentos)
  - database/
      notes.json
      documents.json
      images.json
      reminders.json
      trash_items.json
      favorite_items.json

Envío automático a Telegram mediante Bot API (sin dependencias externas,
usa urllib de la stdlib para no añadir paquetes al requirements.txt).
"""

import io
import json
import logging
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from sqlalchemy.orm import Session

from . import models
from .storage import UPLOAD_DIR

log = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# ──────────────────────────────────────────────────────────────
# Serialización de filas SQLAlchemy → dict
# ──────────────────────────────────────────────────────────────

# Mapa de nombre de tabla → modelo SQLAlchemy (para backup y restore)
MODEL_MAP: dict[str, type] = {
    "notes": models.Note,
    "documents": models.Document,
    "images": models.CloudImage,
    "reminders": models.Reminder,
    "trash_items": models.TrashItem,
    "favorite_items": models.FavoriteItem,
}

# Sufijos de campos que son DateTime en nuestros modelos
_DATETIME_SUFFIXES = ("_at",)


def _parse_datetime(value: str | None) -> datetime | None:
    """Convierte una cadena ISO 8601 a datetime. Devuelve None si no es válida."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None

def _row_to_dict(row: Any) -> dict:
    """Convierte una fila de SQLAlchemy en un dict serializable."""
    result = {}
    for column in row.__table__.columns:
        value = getattr(row, column.name)
        if isinstance(value, datetime):
            value = value.isoformat()
        result[column.name] = value
    return result


def _table_to_json(rows: list) -> bytes:
    return json.dumps([_row_to_dict(r) for r in rows], ensure_ascii=False, indent=2).encode("utf-8")


# ──────────────────────────────────────────────────────────────
# Construcción del ZIP en memoria
# ──────────────────────────────────────────────────────────────

def build_backup_zip(db: Session) -> bytes:
    """
    Genera un archivo ZIP en memoria con todos los datos y archivos de StefyCloud.

    Returns:
        bytes: Contenido del ZIP listo para descargar o enviar.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        # ── 1. Exportar tablas de la base de datos ────────────────
        db_tables: dict[str, list] = {
            table_name: db.query(model_class).all()
            for table_name, model_class in MODEL_MAP.items()
        }

        for table_name, rows in db_tables.items():
            zf.writestr(
                f"database/{table_name}.json",
                _table_to_json(rows),
            )

        # ── 2. Incluir README con fecha e instrucciones ──────────
        readme = (
            f"StefyCloud Backup\n"
            f"Fecha: {timestamp} UTC\n\n"
            f"Contenido:\n"
            f"  database/*.json  →  Exportación de todas las tablas\n"
            f"  uploads/         →  Imágenes y documentos subidos\n\n"
            f"Para restaurar, sube este mismo ZIP usando el botón 'Restaurar copia'\n"
            f"en el menú de StefyCloud.\n"
        )
        zf.writestr("README.txt", readme)

        # ── 3. Copiar archivos de uploads al ZIP ─────────────────
        upload_path = Path(UPLOAD_DIR)
        if upload_path.exists():
            for file_path in upload_path.rglob("*"):
                if file_path.is_file() and not file_path.name.startswith("."):
                    arcname = "uploads/" + file_path.relative_to(upload_path).as_posix()
                    zf.write(file_path, arcname)

    log.info("Backup ZIP generado (%d bytes) a las %s UTC", buffer.tell(), timestamp)
    return buffer.getvalue()


# ──────────────────────────────────────────────────────────────
# Restauración desde ZIP
# ──────────────────────────────────────────────────────────────

def restore_from_zip(zip_bytes: bytes, db: Session) -> dict:
    """
    Restaura datos y archivos desde un ZIP de backup de StefyCloud.

    Estrategia de conflictos: INSERT-IF-NOT-EXISTS por ID.
    Si un registro con el mismo ID ya existe en la base de datos, se omite.
    Los archivos físicos que ya existen en uploads/ también se omiten.

    Returns:
        dict con 'restored' y 'skipped' por tabla, más 'uploads' contando archivos copiados.
    """
    buffer = io.BytesIO(zip_bytes)
    restored: dict[str, int] = {}
    skipped: dict[str, int] = {}

    with zipfile.ZipFile(buffer, mode="r") as zf:
        zip_names = set(zf.namelist())

        # ── 1. Restaurar tablas de la base de datos ───────────────
        for table_name, model_class in MODEL_MAP.items():
            json_path = f"database/{table_name}.json"
            if json_path not in zip_names:
                log.warning("No se encontró '%s' en el ZIP. Tabla omitida.", json_path)
                continue

            try:
                records: list[dict] = json.loads(zf.read(json_path).decode("utf-8"))
            except Exception:  # noqa: BLE001
                log.exception("Error leyendo '%s' del ZIP.", json_path)
                continue

            r_count = 0
            s_count = 0

            for record_dict in records:
                record_id = record_dict.get("id")

                # Saltar si ya existe
                if record_id and db.get(model_class, record_id) is not None:
                    s_count += 1
                    continue

                # Parsear campos datetime (sufijo "_at")
                instance_dict: dict = {}
                for key, value in record_dict.items():
                    if isinstance(value, str) and any(key.endswith(s) for s in _DATETIME_SUFFIXES):
                        value = _parse_datetime(value)
                    instance_dict[key] = value

                try:
                    db.add(model_class(**instance_dict))
                    r_count += 1
                except Exception:  # noqa: BLE001
                    log.exception("Error insertando registro %s en tabla '%s'.", record_id, table_name)
                    s_count += 1

            restored[table_name] = r_count
            skipped[table_name] = s_count

        try:
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
            log.exception("Error al hacer commit durante la restauración.")
            raise

        # ── 2. Restaurar archivos físicos de uploads ──────────────
        uploads_added = 0
        upload_path = Path(UPLOAD_DIR)
        upload_path.mkdir(parents=True, exist_ok=True)

        for name in zip_names:
            if not name.startswith("uploads/") or name.endswith("/"):
                continue
            relative = name[len("uploads/"):]
            if not relative:
                continue
            dest_path = upload_path / relative
            if dest_path.exists():
                continue  # No sobreescribir archivos existentes
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(zf.read(name))
            uploads_added += 1

    restored["uploads"] = uploads_added
    log.info(
        "Restauración completada: %s insertados, uploads=%d",
        {k: v for k, v in restored.items() if k != "uploads"},
        uploads_added,
    )
    return {"restored": restored, "skipped": skipped}




# ──────────────────────────────────────────────────────────────
# Estado del backup (para poder borrar el mensaje anterior)
# ──────────────────────────────────────────────────────────────

_STATE_FILE = Path(os.getenv("UPLOAD_DIR", "uploads")) / ".backup_state.json"


def _load_state() -> dict:
    try:
        return json.loads(_STATE_FILE.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}


def _save_state(state: dict) -> None:
    try:
        _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        _STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    except Exception:  # noqa: BLE001
        log.warning("No se pudo guardar el estado del backup.")


def _telegram_api(endpoint: str, data: bytes, content_type: str) -> dict | None:
    """Llama a un endpoint de Telegram API y devuelve la respuesta JSON o None si falla."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/{endpoint}"
    req = urllib_request.Request(
        url,
        data=data,
        headers={"Content-Type": content_type},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (HTTPError, URLError) as exc:
        log.error("Error en llamada a Telegram (%s): %s", endpoint, exc)
        return None


def _delete_telegram_message(message_id: int) -> None:
    """Borra un mensaje anterior del chat para que solo exista el backup más reciente."""
    boundary = "----SCDeleteBoundary"
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"chat_id\"\r\n\r\n"
        f"{TELEGRAM_CHAT_ID}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"message_id\"\r\n\r\n"
        f"{message_id}\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    result = _telegram_api(
        "deleteMessage",
        body,
        f"multipart/form-data; boundary={boundary}",
    )
    if result and result.get("result") is True:
        log.info("Mensaje de backup anterior (%d) eliminado del chat.", message_id)
    else:
        log.warning("No se pudo eliminar el mensaje anterior de Telegram (message_id=%d).", message_id)


# ──────────────────────────────────────────────────────────────
# Envío a Telegram
# ──────────────────────────────────────────────────────────────

def upload_to_telegram(zip_bytes: bytes) -> bool:
    """
    Envía el ZIP de backup al chat de Telegram configurado.
    Borra el backup anterior (si existe) antes de enviar el nuevo,
    de forma que solo haya una copia en el chat en todo momento.

    Requiere las variables de entorno:
        TELEGRAM_BOT_TOKEN  →  Token del bot (obtenido con @BotFather)
        TELEGRAM_CHAT_ID    →  ID del chat donde enviar el archivo

    Returns:
        True si el envío fue exitoso, False en caso de error.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        log.warning(
            "TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados. "
            "Saltando envío automático de backup."
        )
        return False

    # ── Borrar el backup anterior si existe ──────────────────
    state = _load_state()
    prev_message_id = state.get("last_message_id")
    if prev_message_id:
        _delete_telegram_message(int(prev_message_id))

    # ── Enviar el nuevo backup ────────────────────────────────
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = "stefany-cloud-backup.zip"  # Nombre fijo para claridad visual
    caption = (
        f"☁️ StefyCloud — Copia de seguridad\n"
        f"📅 {timestamp}\n"
        f"🗂 {len(zip_bytes) / 1024 / 1024:.1f} MB"
    )

    boundary = "----StefanyCloudBackupBoundary"
    body_parts: list[bytes] = []

    body_parts.append(
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"chat_id\"\r\n\r\n"
        f"{TELEGRAM_CHAT_ID}\r\n".encode()
    )
    body_parts.append(
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"caption\"\r\n\r\n"
        f"{caption}\r\n".encode()
    )
    body_parts.append(
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"document\"; filename=\"{filename}\"\r\n"
        f"Content-Type: application/zip\r\n\r\n".encode()
        + zip_bytes
        + b"\r\n"
    )
    body_parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(body_parts)

    result = _telegram_api(
        "sendDocument",
        body,
        f"multipart/form-data; boundary={boundary}",
    )

    if result and result.get("ok"):
        new_message_id = result["result"]["message_id"]
        _save_state({"last_message_id": new_message_id, "sent_at": timestamp})
        log.info("Backup enviado a Telegram (%s, message_id=%d).", filename, new_message_id)
        return True

    log.error("Telegram API devolvió error: %s", result)
    return False


# ──────────────────────────────────────────────────────────────
# Job para APScheduler (llamado cada 10 días desde main.py)
# ──────────────────────────────────────────────────────────────

def run_scheduled_backup() -> None:
    """
    Función llamada por el planificador cada 10 días.
    Genera el ZIP y lo envía a Telegram.
    Importa SessionLocal aquí para evitar importaciones circulares.
    """
    from .database import SessionLocal  # noqa: PLC0415

    db = SessionLocal()
    try:
        zip_bytes = build_backup_zip(db)
        upload_to_telegram(zip_bytes)
    except Exception:  # noqa: BLE001
        log.exception("Error durante el backup programado.")
    finally:
        db.close()
