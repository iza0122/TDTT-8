from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # 1. CẢI TIẾN LỚN: Đổi từ google_id sang firebase_uid và siết chặt ràng buộc
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    
    # 2. CẢI TIẾN: Cho phép email nullable=True để hỗ trợ luồng Đăng nhập bằng Số điện thoại (OTP)
    email = Column(String, unique=True, index=True, nullable=True)
    
    full_name = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)
    role = Column(String, default="reviewer", nullable=False) # e.g. admin, merchant, reviewer
    
    # 3. MỞ RỘNG (Open-Closed): Lưu trữ linh hoạt các siêu dữ liệu cấu hình hoặc token bên thứ 3 mà không cần sửa bảng
    meta_data = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    merchants = relationship("Merchant", back_populates="owner")
    videos = relationship("Video", back_populates="reviewer")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    comment_likes = relationship("CommentLike", back_populates="user", cascade="all, delete-orphan")


class Merchant(Base):
    __tablename__ = "merchants"

    __table_args__ = (
        Index("idx_merchants_location", "latitude", "longitude"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    rating_avg = Column(Float, default=0.0, nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # 4. CẢI TIẾN: Tránh lỗi "Hard-delete" nhà hàng làm mất sạch video/data của hệ thống
    is_active = Column(Boolean, default=True, nullable=False, index=True) 
    image_url = Column(String, nullable=True)
    
    slogan = Column(String, nullable=True)
    hours = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="merchants")
    menus = relationship("Menu", back_populates="merchant", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="tagged_merchant")
    campaigns = relationship("Campaign", back_populates="merchant", cascade="all, delete-orphan")


class Menu(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    dish_name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=True, default="Món ăn")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    merchant = relationship("Merchant", back_populates="menus")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    # 5. CẢI TIẾN QUAN TRỌNG: Thêm trạng thái kiểm duyệt video để tránh Reviewer đăng nội dung rác bừa bãi
    status = Column(String, default="pending", nullable=False, index=True) # pending, approved, rejected
    
    # 6. PHÂN LOẠI UX: video (Reels) hoặc image (Post)
    post_type = Column(String, default="video", nullable=False, index=True)
    
    likes_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    rating = Column(Integer, default=5, nullable=False)
    merchant_response = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tagged_merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True, index=True)
    reup_from_id = Column(Integer, ForeignKey("videos.id"), nullable=True, index=True) # ID bài viết gốc nếu là reup
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    reviewer = relationship("User", back_populates="videos")
    tagged_merchant = relationship("Merchant", back_populates="videos")
    likes = relationship("Like", back_populates="video", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="video", cascade="all, delete-orphan")
    
    # Self-referencing relationship for reups
    reup_from = relationship("Video", remote_side=[id], backref="reups")


class Like(Base):
    __tablename__ = "likes"

    __table_args__ = (
        Index("idx_likes_user_video", "user_id", "video_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="likes")
    video = relationship("Video", back_populates="likes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)
    likes_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="comments")
    video = relationship("Video", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")


class CommentLike(Base):
    __tablename__ = "comment_likes"

    __table_args__ = (
        Index("idx_comment_likes_user_comment", "user_id", "comment_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="comment_likes")
    comment = relationship("Comment", back_populates="likes")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    impressions_count = Column(Integer, default=0, nullable=False)
    clicks_count = Column(Integer, default=0, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    merchant = relationship("Merchant", back_populates="campaigns")

class UserFollow(Base):
    __tablename__ = "user_follows"

    __table_args__ = (
        Index("idx_user_follows_follower_following", "follower_id", "following_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class HiddenVideo(Base):
    __tablename__ = "hidden_videos"

    __table_args__ = (
        Index("idx_hidden_videos_user_video", "user_id", "video_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class UserShare(Base):
    __tablename__ = "user_shares"

    __table_args__ = (
        Index("idx_user_shares_user_video", "user_id", "video_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

