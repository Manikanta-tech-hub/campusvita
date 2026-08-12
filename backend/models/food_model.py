from pydantic import BaseModel

# =====================================
# FOOD MODEL
# =====================================

class FoodData(BaseModel):
    name: str
    price: float
    category: str
    category_id: str
    image: str
    description: str
    available: bool