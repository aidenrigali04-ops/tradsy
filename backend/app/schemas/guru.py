from typing import Optional
from pydantic import BaseModel


class GuruResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]

    class Config:
        from_attributes = True


class StrategyResponse(BaseModel):
    id: int
    guru_id: int
    name: str
    strategy_type: Optional[str]

    class Config:
        from_attributes = True
