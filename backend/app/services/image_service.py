import os
import uuid
from fastapi import UploadFile
from pathlib import Path

# Base upload directory is defined in main.py as "uploads" under project root.
BASE_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"

def _ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def save_image(file: UploadFile, subfolder: str) -> str:
    """Save an uploaded image file to the specified subfolder and return its relative URL.
    Args:
        file: FastAPI UploadFile instance.
        subfolder: e.g., "products", "communities", "payments".
    Returns:
        A string URL path like "/uploads/products/<filename>".
    """
    # Generate a unique filename to avoid collisions
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    folder_path = BASE_UPLOAD_DIR / subfolder
    _ensure_dir(folder_path)
    file_path = folder_path / filename
    # Write file content
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    # Return URL path that FastAPI static mount will serve
    return f"/uploads/{subfolder}/{filename}"
