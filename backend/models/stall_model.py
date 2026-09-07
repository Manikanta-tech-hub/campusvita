from typing import Optional

from pydantic import BaseModel, Field


# =====================================
# STALL MODEL
# =====================================

class StallData(BaseModel):
    name: str = Field(min_length=1)
    image: str = ""
    description: str = ""
    is_open: bool = True
    active: bool = True
    owner_email: Optional[str] = None
    
    rating: Optional[float] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    preparation_time: Optional[str] = None