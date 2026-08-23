from pydantic import BaseModel, Field


class StallData(BaseModel):
    name: str = Field(..., min_length=1)
    image: str = ""
    description: str = ""
    is_open: bool = True
    active: bool = True