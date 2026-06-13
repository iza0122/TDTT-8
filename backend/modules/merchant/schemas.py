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
    description: Optional[str] = None
    image_url: Optional[str] = None

class MenuResponse(MenuCreate):
    id: int
    merchant_id: int
    
    model_config = ConfigDict(from_attributes=True)

class MenuUpdate(BaseModel):
    dish_name: Optional[str] = None
    price: Optional[int] = None
    is_available: Optional[bool] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class MerchantCreate(BaseModel):
    name: str
    address: Optional[str] = None
    category: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    image_url: Optional[str] = None


class MerchantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None
 
class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = ""
    thumbnail_url: Optional[str] = None
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignResponse(BaseModel):
    id: int
    merchant_id: int
    title: str
    description: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    is_active: bool
    impressions_count: int
    clicks_count: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ReviewResponse(BaseModel):
    id: int
    customerName: str
    customerAvatar: Optional[str] = None
    rating: int
    comment: str
    date: datetime
    response: Optional[str] = None
    reviewerId: int
    reviewImage: Optional[str] = None

    @classmethod
    def from_orm_custom(cls, obj):
        reviewer = getattr(obj, 'reviewer', None)
        return cls(
            id=obj.id,
            customerName=reviewer.full_name if reviewer else "Khách hàng",
            customerAvatar=reviewer.avatar_url if reviewer else None,
            rating=obj.rating if obj.rating is not None else 5,
            comment=obj.description or "",
            date=obj.created_at,
            response=obj.merchant_response,
            reviewerId=obj.reviewer_id,
            reviewImage=obj.thumbnail_url
        )

class ReviewResponsePayload(BaseModel):
    response: str

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
    campaigns: List[CampaignResponse] = []
    reviews: List[ReviewResponse] = []
    image_url: Optional[str] = None

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
            menus=obj.menus,
            campaigns=[CampaignResponse.model_validate(c) for c in obj.campaigns] if getattr(obj, 'campaigns', None) else [],
            reviews=[ReviewResponse.from_orm_custom(v) for v in obj.videos] if getattr(obj, 'videos', None) else [],
            image_url=getattr(obj, 'image_url', None)
        )

class StatsResponse(BaseModel):
    total_clicks: int
    total_ad_impressions: int
    rating_avg: float
    total_reviews: int
    active_promos: int