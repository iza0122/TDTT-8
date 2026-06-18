from pydantic import BaseModel, model_validator
from typing import Optional, Any
from datetime import datetime

class PresignedUrlRequest(BaseModel):
    file_name: str
    content_type: str
    folder: Optional[str] = "general"  # e.g., videos, menus

class PresignedUrlResponse(BaseModel):
    upload_url: str
    public_url: str
    key: str

class VideoCreate(BaseModel):
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    tagged_merchant_id: Optional[int] = None
    post_type: Optional[str] = "video"
    rating: Optional[int] = 5

class VideoUserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    username: Optional[str] = None
    is_following: Optional[bool] = False

    class Config:
        from_attributes = True

class VideoMerchantResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    owner_id: int

    class Config:
        from_attributes = True

class VideoResponse(BaseModel):
    id: int
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    post_type: str = "video"
    status: str
    likes_count: int
    shares_count: int = 0
    comments_count: int = 0
    reviewer_id: int
    tagged_merchant_id: Optional[int] = None
    reup_from_id: Optional[int] = None
    reup_from_user: Optional[VideoUserResponse] = None
    created_at: datetime
    is_ads: Optional[bool] = False
    is_liked: Optional[bool] = False
    
    # Các trường lồng nhau ánh xạ theo thiết kế của Frontend
    user: Optional[VideoUserResponse] = None
    restaurant: Optional[VideoMerchantResponse] = None

    @model_validator(mode="before")
    @classmethod
    def map_relations(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Nếu đã là dict (như item QC tự dựng), giữ nguyên
            return data
            
        # Ánh xạ từ ORM model (SQLAlchemy)
        reviewer = getattr(data, "reviewer", None)
        merchant = getattr(data, "tagged_merchant", None)
        reup_from = getattr(data, "reup_from", None)
        
        obj_dict = {
            "id": data.id,
            "title": data.title,
            "video_url": data.video_url,
            "thumbnail_url": data.thumbnail_url,
            "description": data.description,
            "post_type": getattr(data, "post_type", "video"),
            "status": data.status,
            "likes_count": data.likes_count,
            "shares_count": getattr(data, "shares_count", 0),
            "comments_count": getattr(data, "comments_count", 0),
            "reviewer_id": data.reviewer_id,
            "tagged_merchant_id": data.tagged_merchant_id,
            "reup_from_id": getattr(data, "reup_from_id", None),
            "created_at": data.created_at,
            "is_ads": getattr(data, "is_ads", False),
            "is_liked": getattr(data, "is_liked", False),
        }
        
        if reviewer:
            obj_dict["user"] = {
                "id": reviewer.id,
                "full_name": reviewer.full_name or "Người dùng",
                "avatar_url": reviewer.avatar_url,
                "username": reviewer.email.split("@")[0] if reviewer.email else f"user_{reviewer.id}",
                "is_following": getattr(reviewer, "is_following", False)
            }
        else:
            obj_dict["user"] = None
            
        if merchant:
            obj_dict["restaurant"] = {
                "id": merchant.id,
                "name": merchant.name,
                "address": merchant.address or "",
                "latitude": merchant.latitude,
                "longitude": merchant.longitude,
                "owner_id": merchant.owner_id
            }
        else:
            obj_dict["restaurant"] = None

        if reup_from and reup_from.reviewer:
            orig_rev = reup_from.reviewer
            obj_dict["reup_from_user"] = {
                "id": orig_rev.id,
                "full_name": orig_rev.full_name or "Người dùng",
                "avatar_url": orig_rev.avatar_url,
                "username": orig_rev.email.split("@")[0] if orig_rev.email else f"user_{orig_rev.id}",
                "is_following": False
            }
        else:
            obj_dict["reup_from_user"] = None
            
        return obj_dict

    class Config:
        from_attributes = True

class VideoFeedResponse(BaseModel):
    items: list[VideoResponse]
    next_cursor: Optional[str] = None
