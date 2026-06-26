from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user, RoleChecker
from backend.core.all_models import User # For current_user type hint
from . import schemas, services

router = APIRouter()

# Admin Dashboard Stats
@router.get("/stats", response_model=schemas.AdminStatsResponse, summary="Lấy thống kê tổng quan Admin Dashboard")
def get_admin_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    return services.get_admin_stats(db)

# Admin Users Management
@router.get("/users", response_model=schemas.PaginatedUsersResponse, summary="Lấy danh sách người dùng cho Admin")
def get_admin_users_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None, description="Filter by user role"),
    status: Optional[str] = Query(None, description="Filter by user status (e.g., active, disabled)"),
    sort: Optional[str] = Query(None, description="Sort order (e.g., newest)"),
):
    users = services.get_admin_users(db, limit, offset, search, role, status, sort)
    total = services.get_admin_users_count(db, search, role, status)
    return {"items": users, "total": total}

@router.patch("/users/{user_id}/role", response_model=schemas.AdminUserResponse, summary="Cập nhật vai trò người dùng")
def patch_user_role_endpoint(
    user_id: int,
    user_update: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    user = services.patch_user_role(db, user_id, user_update.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}/disable", response_model=schemas.AdminUserResponse, summary="Vô hiệu hóa/Kích hoạt người dùng")
def patch_user_disable_endpoint(
    user_id: int,
    user_update: schemas.UserDisableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    user = services.patch_user_disable(db, user_id, user_update.disabled)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Admin Merchants Management
@router.get("/merchants", response_model=schemas.PaginatedMerchantsResponse, summary="Lấy danh sách quán ăn cho Admin")
def get_admin_merchants_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Filter by merchant category"),
    is_active: Optional[str] = Query(None, description="Filter by active status (e.g., true, false)"),
):
    merchants = services.get_admin_merchants(db, limit, offset, search, category, is_active)
    total = services.get_admin_merchants_count(db, search, category, is_active)
    return {"items": merchants, "total": total}

@router.patch("/merchants/{merchant_id}/active", response_model=schemas.AdminMerchantResponse, summary="Bật/Tắt trạng thái hoạt động của quán ăn")
def patch_merchant_active_endpoint(
    merchant_id: int,
    merchant_update: schemas.MerchantActiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    merchant = services.patch_merchant_active(db, merchant_id, merchant_update.is_active)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant

# Admin Videos Management
@router.get("/videos", response_model=schemas.PaginatedVideosResponse, summary="Lấy danh sách video cho Admin")
def get_admin_videos_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by video status (e.g., pending, approved, rejected)"),
    post_type: Optional[str] = Query(None, description="Filter by post type (e.g., video, image)"),
):
    videos = services.get_admin_videos(db, limit, offset, status, post_type)
    total = services.get_admin_videos_count(db, status, post_type)
    return {"items": videos, "total": total}

@router.patch("/videos/{video_id}/status", response_model=schemas.AdminVideoResponse, summary="Cập nhật trạng thái video (Duyệt/Từ chối)")
def patch_video_status_endpoint(
    video_id: int,
    video_update: schemas.VideoStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    video = services.patch_video_status(db, video_id, video_update.status, video_update.reject_reason)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

# Admin Campaigns Management
@router.get("/campaigns", response_model=schemas.PaginatedCampaignsResponse, summary="Lấy danh sách chiến dịch quảng cáo cho Admin")
def get_admin_campaigns_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"])),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    is_active: Optional[str] = Query(None, description="Filter by active status (e.g., true, false)"),
    merchant_search: Optional[str] = Query(None, description="Search by merchant name"),
):
    campaigns = services.get_admin_campaigns(db, limit, offset, is_active, merchant_search)
    total = services.get_admin_campaigns_count(db, is_active, merchant_search)
    return {"items": campaigns, "total": total}

@router.patch("/campaigns/{campaign_id}/toggle", response_model=schemas.AdminCampaignResponse, summary="Bật/Tắt chiến dịch quảng cáo")
def patch_campaign_active_endpoint(
    campaign_id: int,
    campaign_update: schemas.CampaignActiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    campaign = services.patch_campaign_active(db, campaign_id, campaign_update.is_active)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign