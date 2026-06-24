from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class RegisterRequest(BaseModel):
    email: Optional[str] = Field(None, description="Địa chỉ email đăng ký")
    phone_number: Optional[str] = Field(None, description="Số điện thoại đăng ký (tuỳ chọn)")
    password: str = Field(..., min_length=6, description="Mật khẩu đăng ký (tối thiểu 6 ký tự)")
    full_name: Optional[str] = Field(None, description="Họ và tên người dùng")
    avatar_url: Optional[str] = Field(None, description="Đường dẫn ảnh đại diện")
    role: Optional[str] = Field("reviewer", description="Vai trò người dùng (ví dụ: reviewer, merchant)")

class LoginRequest(BaseModel):
    email: Optional[str] = Field(None, description="Email hoặc Số điện thoại đăng nhập")
    phone_number: Optional[str] = Field(None, description="Số điện thoại đăng nhập (nếu tách riêng)")
    username: Optional[str] = Field(None, description="Trường đăng nhập chung (Email hoặc SĐT)")
    password: str = Field(..., description="Mật khẩu")

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    meta_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    user: UserResponse

from datetime import datetime
from typing import List

class VideoMinResponse(BaseModel):
    id: int
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    likes_count: int = 0
    post_type: str = "video"
    status: str = "pending"
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    bio: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    is_following: Optional[bool] = False
    posts_count: int = 0
    saved_count: int = 0
    likes_received_count: int = 0
    videos: List[VideoMinResponse] = []
    saved_videos: List[VideoMinResponse] = []
    liked_videos: List[VideoMinResponse] = []
    hidden_videos: List[VideoMinResponse] = []

    class Config:
        from_attributes = True

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    id_token: str
