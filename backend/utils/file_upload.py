import os
import uuid
from fastapi import UploadFile

FOOD_UPLOAD_DIR = "uploads/foods"
CATEGORY_UPLOAD_DIR = "uploads/categories"


async def _save_image(
    file: UploadFile,
    upload_dir: str,
    url_prefix: str,
):
    os.makedirs(upload_dir, exist_ok=True)

    original_filename = file.filename or ""

    extension = os.path.splitext(original_filename)[1].lower()

    if not extension:
        extension = ".jpg"

    filename = f"{uuid.uuid4()}{extension}"

    filepath = os.path.join(
        upload_dir,
        filename,
    )

    contents = await file.read()

    if not contents:
        raise ValueError("Uploaded image is empty")

    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    return f"{url_prefix}/{filename}"


async def save_food_image(file: UploadFile):
    return await _save_image(
        file,
        FOOD_UPLOAD_DIR,
        "/uploads/foods",
    )


async def save_category_image(file: UploadFile):
    return await _save_image(
        file,
        CATEGORY_UPLOAD_DIR,
        "/uploads/categories",
    )
