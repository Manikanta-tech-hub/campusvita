from pydantic import BaseModel, Field


# =====================================
# FOOD MODEL
# =====================================

class FoodData(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    category: str = Field(min_length=1)
    category_id: str = Field(min_length=1)
    stall_id: str = Field(min_length=1)
    image: str = ""
    description: str = ""
    available: bool = True