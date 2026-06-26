from sqlalchemy.orm import Session
from backend.core.all_models import Merchant, Menu, Campaign, Video
from . import schemas

def create_merchant(db: Session, merchant: schemas.MerchantCreate, owner_id: int):
    db_merchant = Merchant(
        name=merchant.name,
        address=merchant.address,
        latitude=merchant.latitude,
        longitude=merchant.longitude,
        description=merchant.description,
        owner_id=owner_id,
        image_url=merchant.image_url,
        category=merchant.category,
        slogan=merchant.slogan,
        hours=merchant.hours,
        phone=merchant.phone,
        email=merchant.email
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
    from sqlalchemy.orm import joinedload
    return db.query(Merchant).options(
        joinedload(Merchant.menus),
        joinedload(Merchant.campaigns),
        joinedload(Merchant.videos).joinedload(Video.reviewer)
    ).filter(Merchant.id == merchant_id).first()

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
    from sqlalchemy.orm import joinedload
    return db.query(Merchant).options(
        joinedload(Merchant.menus),
        joinedload(Merchant.campaigns),
        joinedload(Merchant.videos).joinedload(Video.reviewer)
    ).filter(Merchant.owner_id == owner_id).all()

def get_all_merchants(db: Session):
    from sqlalchemy.orm import joinedload
    return db.query(Merchant).options(
        joinedload(Merchant.menus),
        joinedload(Merchant.campaigns),
        joinedload(Merchant.videos).joinedload(Video.reviewer)
    ).all()

def toggle_campaign(db: Session, merchant_id: int, is_active: bool):
    campaign = db.query(Campaign).filter(Campaign.merchant_id == merchant_id).first()
    if campaign:
        campaign.is_active = is_active
        db.commit()
    return campaign

def get_stats(db: Session, merchant_id: int):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        return 0, 0, 0.0, 0, 0
        
    campaigns = db.query(Campaign).filter(Campaign.merchant_id == merchant_id).all()
    
    total_impressions = sum(c.impressions_count for c in campaigns) if campaigns else 0
    total_clicks = sum(c.clicks_count for c in campaigns) if campaigns else 0
    active_promos = sum(1 for c in campaigns if c.is_active)
    
    # Đếm số lượng video reviews được gắn thẻ nhà hàng này
    total_reviews = db.query(Video).filter(Video.tagged_merchant_id == merchant_id).count()
    rating_avg = merchant.rating_avg or 0.0
    
    return total_clicks, total_impressions, rating_avg, total_reviews, active_promos

def get_menu_item(db: Session, menu_id: int):
    return db.query(Menu).filter(Menu.id == menu_id).first()

def update_menu_item(db: Session, db_menu: Menu, menu_update: schemas.MenuUpdate):
    for field, value in menu_update.model_dump(exclude_unset=True).items():
        setattr(db_menu, field, value)
    db.commit()
    db.refresh(db_menu)
    return db_menu

def delete_menu_item(db: Session, db_menu: Menu):
    db.delete(db_menu)
    db.commit()

def get_campaigns_by_merchant(db: Session, merchant_id: int):
    return db.query(Campaign).filter(Campaign.merchant_id == merchant_id).all()

def get_campaign(db: Session, campaign_id: int):
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()

def create_campaign(db: Session, merchant_id: int, campaign: schemas.CampaignCreate):
    db_campaign = Campaign(**campaign.model_dump(), merchant_id=merchant_id)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def update_campaign(db: Session, db_campaign: Campaign, campaign_update: schemas.CampaignUpdate):
    for field, value in campaign_update.model_dump(exclude_unset=True).items():
        setattr(db_campaign, field, value)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def delete_campaign(db: Session, db_campaign: Campaign):
    db.delete(db_campaign)
    db.commit()

def get_merchant_reviews(db: Session, merchant_id: int):
    from sqlalchemy.orm import joinedload
    return db.query(Video).options(
        joinedload(Video.reviewer)
    ).filter(
        Video.tagged_merchant_id == merchant_id,
        Video.status == "approved"
    ).order_by(Video.created_at.desc()).all()

def get_review_video(db: Session, video_id: int):
    return db.query(Video).filter(Video.id == video_id).first()

def respond_to_review(db: Session, db_video: Video, response_text: str):
    db_video.merchant_response = response_text
    db.commit()
    db.refresh(db_video)
    return db_video

def delete_merchant(db: Session, db_merchant: Merchant):
    db.delete(db_merchant)
    db.commit()