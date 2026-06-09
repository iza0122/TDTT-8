from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

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
    category: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None


class MerchantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
 
class MerchantResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    category: Optional[str] = None
    description: Optional[str]
    rating_avg: float
    owner_id: int
    is_active: bool
    created_at: datetime
    location: Location
    menus: List[MenuResponse] = []

    @classmethod
    def from_orm_custom(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            address=obj.address,
            category=getattr(obj, 'category', None),
            description=obj.description,
            rating_avg=obj.rating_avg,
            owner_id=obj.owner_id,
            is_active=obj.is_active,
            created_at=obj.created_at,
            location=Location(lat=obj.latitude, lng=obj.longitude),
            menus=obj.menus
        )


class StatsResponse(BaseModel):
    total_clicks: int
    total_ad_impressions: int