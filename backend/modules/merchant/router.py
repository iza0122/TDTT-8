from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import get_current_user, RoleChecker
from typing import List # Add this line
from backend.core.all_models import User
from . import schemas, services

router = APIRouter()

@router.post("/", response_model=schemas.MerchantResponse, summary="Tạo quán ăn mới")
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

    merchant, total_clicks, total_impressions = services.get_stats(db, merchant_id)
    return schemas.StatsResponse(
        total_clicks=total_clicks, 
        total_ad_impressions=total_impressions
    )
