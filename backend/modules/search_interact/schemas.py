from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# User representation in comments/responses
class UserMinResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)

# Likes Schemas
class LikeToggleResponse(BaseModel):
    liked: bool
    likes_count: int
    message: str

class CommentLikeToggleResponse(BaseModel):
    liked: bool
    likes_count: int
    message: str

# Comments Schemas
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    video_id: int
    content: str
    parent_id: Optional[int]
    likes_count: int = 0
    created_at: datetime
    user: UserMinResponse
    replies: Optional[List['CommentResponse']] = []

    model_config = ConfigDict(from_attributes=True)

# Geo-Search Schemas
class MerchantSearchResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    category: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    rating_avg: float
    distance: float  # In kilometers
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FollowToggleResponse(BaseModel):
    is_following: bool
    followers_count: int
    message: str

class ShareResponse(BaseModel):
    shares_count: int
    message: str
