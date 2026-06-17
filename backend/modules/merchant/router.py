from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.core.security import get_current_user, RoleChecker
from backend.core.all_models import User
from . import schemas, services

router = APIRouter()

@router.post("", response_model=schemas.MerchantResponse, summary="Tạo quán ăn mới")
def create_merchant_endpoint(
    merchant: schemas.MerchantCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    API này cho phép người dùng đăng ký một quán ăn mới. Người tạo sẽ tự động trở thành chủ quán (owner).
    """
    db_merchant = services.create_merchant(db, merchant, owner_id=current_user.id)
    return schemas.MerchantResponse.from_orm_custom(db_merchant)

@router.get("/me", response_model=List[schemas.MerchantResponse], summary="Lấy danh sách các quán ăn của người dùng hiện tại")
def get_current_user_merchants_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant", "admin", "reviewer"]))
):
    """
    API này trả về danh sách tất cả các quán ăn mà người dùng hiện tại sở hữu hoặc có quyền xem.
    """
    if current_user.role == "admin":
        merchants = services.get_all_merchants(db) # Assume an admin can see all merchants
    else:
        merchants = services.get_merchants_by_owner(db, owner_id=current_user.id)
    return [schemas.MerchantResponse.from_orm_custom(merchant) for merchant in merchants]

@router.get("/{merchant_id}", response_model=schemas.MerchantResponse, summary="Lấy thông tin chi tiết quán ăn")
def get_merchant_endpoint(merchant_id: int, db: Session = Depends(get_db)):
    """
    Xem thông tin của quán ăn bao gồm địa chỉ, tọa độ, đánh giá trung bình và toàn bộ thực đơn.
    """
    db_merchant = services.get_merchant(db, merchant_id)
    if not db_merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return schemas.MerchantResponse.from_orm_custom(db_merchant)

@router.patch("/{merchant_id}", response_model=schemas.MerchantResponse, summary="Cập nhật thông tin quán ăn")
def update_merchant_endpoint(
    merchant_id: int,
    merchant_update: schemas.MerchantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant", "admin"]))
):
    """
    API này cho phép cập nhật thông tin của một quán ăn. Chỉ chủ quán hoặc admin mới có quyền.
    """
    db_merchant = services.get_merchant(db, merchant_id)
    if not db_merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if db_merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán hoặc admin mới có quyền cập nhật thông tin quán")

    updated_merchant = services.update_merchant(db, db_merchant, merchant_update)
    return schemas.MerchantResponse.from_orm_custom(updated_merchant)

@router.post("/{merchant_id}/menus", response_model=schemas.MenuResponse, summary="Thêm món ăn mới vào thực đơn")
def create_menu_endpoint(
    merchant_id: int, 
    menu: schemas.MenuCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    Thêm một món ăn mới. **Lưu ý:** Chỉ tài khoản của Chủ quán (owner) mới có quyền thực hiện hành động này.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền thêm món")
        
    return services.create_menu_item(db, merchant_id, menu)

@router.patch("/{merchant_id}/campaigns/toggle", summary="Bật/Tắt chiến dịch quảng cáo")
def toggle_campaign_endpoint(
    merchant_id: int, 
    is_active: bool, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    Kích hoạt hoặc tạm dừng chiến dịch quảng cáo của quán ăn trên hệ thống.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền cấu hình quảng cáo")

    campaign = services.toggle_campaign(db, merchant_id, is_active)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign updated", "is_active": is_active}

@router.get("/{merchant_id}/stats", response_model=schemas.StatsResponse, summary="Xem thống kê lượt click & hiển thị QC")
def get_stats_endpoint(
    merchant_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    Lấy dữ liệu thống kê tổng số lượt hiển thị (impressions) và số lượt click vào quảng cáo của quán ăn.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền xem thống kê")

    total_clicks, total_impressions, rating_avg, total_reviews, active_promos = services.get_stats(db, merchant_id)
    return schemas.StatsResponse(
        total_clicks=total_clicks, 
        total_ad_impressions=total_impressions,
        rating_avg=rating_avg,
        total_reviews=total_reviews,
        active_promos=active_promos
    )

@router.patch("/{merchant_id}/menus/{menu_id}", response_model=schemas.MenuResponse, summary="Cập nhật món ăn trong thực đơn")
def update_menu_endpoint(
    merchant_id: int,
    menu_id: int,
    menu_update: schemas.MenuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    Cập nhật thông tin món ăn (tên, giá, trạng thái hoạt động). Chỉ chủ quán hoặc admin mới có quyền.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền cập nhật món ăn")

    db_menu = services.get_menu_item(db, menu_id)
    if not db_menu or db_menu.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="Menu item not found in this merchant")

    return services.update_menu_item(db, db_menu, menu_update)

@router.delete("/{merchant_id}/menus/{menu_id}", summary="Xóa món ăn khỏi thực đơn")
def delete_menu_endpoint(
    merchant_id: int,
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    """
    Xóa một món ăn khỏi thực đơn. Chỉ chủ quán hoặc admin mới có quyền.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền xóa món ăn")

    db_menu = services.get_menu_item(db, menu_id)
    if not db_menu or db_menu.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="Menu item not found in this merchant")

    services.delete_menu_item(db, db_menu)
    return {"message": "Menu item deleted successfully"}

# Campaigns (Promotions) CRUD
@router.get("/{merchant_id}/campaigns", response_model=List[schemas.CampaignResponse], summary="Lấy danh sách các chiến dịch khuyến mãi")
def get_campaigns_endpoint(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant", "admin"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền xem chiến dịch")
    return services.get_campaigns_by_merchant(db, merchant_id)

@router.post("/{merchant_id}/campaigns", response_model=schemas.CampaignResponse, summary="Tạo chiến dịch khuyến mãi mới")
def create_campaign_endpoint(
    merchant_id: int,
    campaign: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền tạo chiến dịch")
    return services.create_campaign(db, merchant_id, campaign)

@router.patch("/{merchant_id}/campaigns/{campaign_id}", response_model=schemas.CampaignResponse, summary="Cập nhật chiến dịch khuyến mãi")
def update_campaign_endpoint(
    merchant_id: int,
    campaign_id: int,
    campaign_update: schemas.CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền cập nhật chiến dịch")
    db_campaign = services.get_campaign(db, campaign_id)
    if not db_campaign or db_campaign.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return services.update_campaign(db, db_campaign, campaign_update)

@router.delete("/{merchant_id}/campaigns/{campaign_id}", summary="Xóa chiến dịch khuyến mãi")
def delete_campaign_endpoint(
    merchant_id: int,
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền xóa chiến dịch")
    db_campaign = services.get_campaign(db, campaign_id)
    if not db_campaign or db_campaign.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="Campaign not found")
    services.delete_campaign(db, db_campaign)
    return {"message": "Campaign deleted successfully"}

# Reviews
@router.get("/{merchant_id}/reviews", response_model=List[schemas.ReviewResponse], summary="Lấy danh sách các đánh giá của quán ăn")
def get_reviews_endpoint(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant", "admin"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền xem đánh giá")
    db_reviews = services.get_merchant_reviews(db, merchant_id)
    return [schemas.ReviewResponse.from_orm_custom(r) for r in db_reviews]

@router.post("/{merchant_id}/reviews/{review_id}/response", response_model=schemas.ReviewResponse, summary="Phản hồi đánh giá của khách hàng")
def respond_to_review_endpoint(
    merchant_id: int,
    review_id: int,
    payload: schemas.ReviewResponsePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant"]))
):
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền phản hồi đánh giá")
    db_video = services.get_review_video(db, review_id)
    if not db_video or db_video.tagged_merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="Review not found for this merchant")
    updated_video = services.respond_to_review(db, db_video, payload.response)
    return schemas.ReviewResponse.from_orm_custom(updated_video)

@router.delete("/{merchant_id}", summary="Xóa quán ăn")
def delete_merchant_endpoint(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["merchant", "admin"]))
):
    """
    Xóa một quán ăn của chủ quán hiện tại hoặc bởi Admin.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if merchant.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ chủ quán hoặc admin mới có quyền xóa quán ăn")
    
    services.delete_merchant(db, merchant)
    return {"message": "Merchant deleted successfully"}