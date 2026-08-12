import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads/foods"


async def save_food_image(file: UploadFile):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    extension = file.filename.split(".")[-1]

    filename = f"{uuid.uuid4()}.{extension}"

    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    return f"/uploads/foods/{filename}"