from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.core.all_models import User
from . import schemas, services

router = APIRouter()

@router.post("/", response_model=schemas.MerchantResponse, summary="Tạo quán ăn mới")
def create_merchant_endpoint(
    merchant: schemas.MerchantCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

@router.post("/{merchant_id}/menus", response_model=schemas.MenuResponse, summary="Thêm món ăn mới vào thực đơn")
def create_menu_endpoint(
    merchant_id: int, 
    menu: schemas.MenuCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thêm một món ăn mới. **Lưu ý:** Chỉ tài khoản của Chủ quán (owner) mới có quyền thực hiện hành động này.
    """
    merchant = services.get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    if merchant.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Chỉ chủ quán mới có quyền thêm món")
        
    return services.create_menu_item(db, merchant_id, menu)

@router.patch("/{merchant_id}/campaigns/toggle", summary="Bật/Tắt chiến dịch quảng cáo")
def toggle_campaign_endpoint(
    merchant_id: int, 
    is_active: bool, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Kích hoạt hoặc tạm dừng chiến dịch quảng cáo của quán ăn trên hệ thống.
    """
    campaign = services.toggle_campaign(db, merchant_id, is_active)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign updated", "is_active": is_active}

@router.get("/{merchant_id}/stats", response_model=schemas.StatsResponse, summary="Xem thống kê lượt click & hiển thị QC")
def get_stats_endpoint(
    merchant_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy dữ liệu thống kê tổng số lượt hiển thị (impressions) và số lượt click vào quảng cáo của quán ăn.
    """
    merchant, total_clicks, total_impressions = services.get_stats(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return schemas.StatsResponse(
        total_clicks=total_clicks, 
        total_ad_impressions=total_impressions
    )