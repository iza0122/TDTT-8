from sqlalchemy.orm import Session
from backend.core.all_models import Merchant, Menu, Campaign
from . import schemas

def create_merchant(db: Session, merchant: schemas.MerchantCreate, owner_id: int):
    db_merchant = Merchant(
        name=merchant.name,
        address=merchant.address,
        latitude=merchant.latitude,
        longitude=merchant.longitude,
        description=merchant.description,
        owner_id=owner_id
    )
    db.add(db_merchant)
    db.commit()
    db.refresh(db_merchant)
    
    # Tự động tạo một campaign mặc định (tắt) khi tạo quán
    db_campaign = Campaign(merchant_id=db_merchant.id, title=f"QC {merchant.name}", video_url="", is_active=False)
    db.add(db_campaign)
    db.commit()
    
    return db_merchant

def get_merchant(db: Session, merchant_id: int):
    return db.query(Merchant).filter(Merchant.id == merchant_id).first()

def update_merchant(db: Session, db_merchant: Merchant, merchant_update: schemas.MerchantUpdate):
    for field, value in merchant_update.model_dump(exclude_unset=True).items():
        setattr(db_merchant, field, value)
    db.commit()
    db.refresh(db_merchant)
    return db_merchant

def create_menu_item(db: Session, merchant_id: int, menu: schemas.MenuCreate):
    db_menu = Menu(**menu.model_dump(), merchant_id=merchant_id)
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu

def get_merchants_by_owner(db: Session, owner_id: int):
    return db.query(Merchant).filter(Merchant.owner_id == owner_id).all()

def get_all_merchants(db: Session):
    return db.query(Merchant).all()

def toggle_campaign(db: Session, merchant_id: int, is_active: bool):
    campaign = db.query(Campaign).filter(Campaign.merchant_id == merchant_id).first()
    if campaign:
        campaign.is_active = is_active
        db.commit()
    return campaign

def get_stats(db: Session, merchant_id: int):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    campaigns = db.query(Campaign).filter(Campaign.merchant_id == merchant_id).all()
    
    total_impressions = sum(c.impressions_count for c in campaigns) if campaigns else 0
    total_clicks = sum(c.clicks_count for c in campaigns) if campaigns else 0
    
    return merchant, total_clicks, total_impressions