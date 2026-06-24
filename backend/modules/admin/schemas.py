from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Admin User Schemas
class AdminUserBase(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    firebase_uid: str
    meta_data: Optional[dict] = None

class AdminUserResponse(AdminUserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

# Admin Merchant Schemas
class AdminMerchantResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    category: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    rating_avg: float
    owner_id: int
    is_active: bool
    created_at: datetime
    owner: Optional[AdminUserBase] = None # Nested user schema

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

# Admin Video Schemas
class AdminVideoResponse(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    post_type: str
    status: str
    likes_count: int
    reviewer_id: int
    tagged_merchant_id: Optional[int] = None
    created_at: datetime
    reviewer: Optional[AdminUserBase] = None
    tagged_merchant: Optional[AdminMerchantResponse] = None
    meta_data: Optional[dict] = None

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

# Admin Campaign Schemas
class AdminCampaignResponse(BaseModel):
    id: int
    merchant_id: int
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    is_active: bool
    impressions_count: int
    clicks_count: int
    created_at: datetime
    merchant: Optional[AdminMerchantResponse] = None

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

# Admin Stats Schema
class AdminStatsResponse(BaseModel):
    total_users: int
    pending_videos: int
    active_merchants: int
    active_campaigns: int

    class Config:
        orm_mode = True

# Pagination Schemas
class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int

class PaginatedUsersResponse(PaginatedResponse):
    items: List[AdminUserResponse]

class PaginatedMerchantsResponse(PaginatedResponse):
    items: List[AdminMerchantResponse]

class PaginatedVideosResponse(PaginatedResponse):
    items: List[AdminVideoResponse]

class PaginatedCampaignsResponse(PaginatedResponse):
    items: List[AdminCampaignResponse]

# Request Schemas for PATCH operations
class UserRoleUpdate(BaseModel):
    role: str

class UserDisableUpdate(BaseModel):
    disabled: bool

class VideoStatusUpdate(BaseModel):
    status: str
    reject_reason: Optional[str] = None

class MerchantActiveUpdate(BaseModel):
    is_active: bool

class CampaignActiveUpdate(BaseModel):
    is_active: bool