from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class Location(BaseModel):
    lat: float
    lng: float

class MenuCreate(BaseModel):
    dish_name: str
    price: int
    is_available: bool = True

class MenuResponse(MenuCreate):
    id: int
    merchant_id: int
    
    model_config = ConfigDict(from_attributes=True)

class MerchantCreate(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None

class MerchantResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    description: Optional[str]
    rating_avg: float
    owner_id: int
    location: Location
    menus: List[MenuResponse] = []

    @classmethod
    def from_orm_custom(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            address=obj.address,
            description=obj.description,
            rating_avg=obj.rating_avg,
            owner_id=obj.owner_id,
            location=Location(lat=obj.latitude, lng=obj.longitude),
            menus=obj.menus
        )

class StatsResponse(BaseModel):
    total_clicks: int
    total_ad_impressions: int