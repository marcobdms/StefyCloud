import os
import uuid
from pathlib import Path
from typing import Collection

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))
CHUNK_SIZE = 1024 * 1024


def save_upload(
    file: UploadFile,
    allowed_extensions: Collection[str],
    require_image_content_type: bool = False,
) -> tuple[str, str, str, int]:
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower().lstrip(".")
    if not original_name or extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Formato de archivo no permitido")

    content_type = file.content_type or ""
    if (
        require_image_content_type
        and not content_type.startswith("image/")
        and content_type != "application/octet-stream"
    ):
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}.{extension}"
    file_path = UPLOAD_DIR / stored_name
    size_bytes = 0

    try:
        with file_path.open("wb") as buffer:
            while chunk := file.file.read(CHUNK_SIZE):
                size_bytes += len(chunk)
                if size_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"El archivo supera el límite de {MAX_UPLOAD_BYTES // (1024 * 1024)} MB",
                    )
                buffer.write(chunk)
    except Exception:
        file_path.unlink(missing_ok=True)
        raise

    return original_name, extension, stored_name, size_bytes


def delete_upload(url: str | None) -> None:
    if not url:
        return
    stored_name = Path(url).name
    (UPLOAD_DIR / stored_name).unlink(missing_ok=True)
