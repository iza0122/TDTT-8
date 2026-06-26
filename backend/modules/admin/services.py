from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.all_models import User, Merchant, Video, Campaign

def get_admin_stats(db: Session):
    total_users = db.query(User).count()
    pending_videos = db.query(Video).filter(Video.status == "pending").count()
    active_merchants = db.query(Merchant).filter(Merchant.is_active == True).count()
    active_campaigns = db.query(Campaign).filter(Campaign.is_active == True).count()
    return {
        "total_users": total_users,
        "pending_videos": pending_videos,
        "active_merchants": active_merchants,
        "active_campaigns": active_campaigns,
    }

def get_admin_users(
    db: Session,
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None, # For disabled status
    sort: Optional[str] = None
) -> List[User]:
    query = db.query(User)

    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role and role != "all":
        query = query.filter(User.role == role)
    if status and status != "all":
        if status == "disabled":
            query = query.filter(User.meta_data["disabled"].astext == "true")
        elif status == "active":
            query = query.filter(User.meta_data["disabled"].astext != "true")

    if sort == "newest":
        query = query.order_by(User.created_at.desc())
    else:
        query = query.order_by(User.id.asc())

    return query.offset(offset).limit(limit).all()

def get_admin_users_count(
    db: Session,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
) -> int:
    query = db.query(User)

    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role and role != "all":
        query = query.filter(User.role == role)
    if status and status != "all":
        if status == "disabled":
            query = query.filter(User.meta_data["disabled"].astext == "true")
        elif status == "active":
            query = query.filter(User.meta_data["disabled"].astext != "true")

    return query.count()

def patch_user_role(db: Session, user_id: int, role: str) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user

def patch_user_disable(db: Session, user_id: int, disabled: bool) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # Re-assign dictionary to trigger SQLAlchemy's change detection for JSON columns
        meta = dict(user.meta_data) if user.meta_data is not None else {}
        meta["disabled"] = disabled
        user.meta_data = meta
        
        # Synchronize with Firebase Auth if possible
        if user.firebase_uid and not user.firebase_uid.startswith("g_"):
            try:
                from firebase_admin import auth
                auth.update_user(user.firebase_uid, disabled=disabled)
                print(f"[ADMIN] Đã đồng bộ trạng thái disabled={disabled} lên Firebase Auth cho UID: {user.firebase_uid}")
            except Exception as e:
                print(f"[ADMIN] Cảnh báo: Không thể cập nhật trạng thái disabled lên Firebase Auth: {e}")

        db.commit()
        db.refresh(user)
    return user

def get_admin_merchants(
    db: Session,
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[str] = None
) -> List[Merchant]:
    from sqlalchemy.orm import joinedload
    query = db.query(Merchant).options(joinedload(Merchant.owner)).join(User, Merchant.owner_id == User.id)

    if search:
        query = query.filter(
            Merchant.name.ilike(f"%{search}%") | Merchant.address.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    if category and category != "all":
        query = query.filter(Merchant.category == category)
    if is_active and is_active != "all":
        query = query.filter(Merchant.is_active == (is_active == "true"))

    return query.offset(offset).limit(limit).all()

def get_admin_merchants_count(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[str] = None
) -> int:
    query = db.query(Merchant).join(User, Merchant.owner_id == User.id)

    if search:
        query = query.filter(
            Merchant.name.ilike(f"%{search}%") | Merchant.address.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    if category and category != "all":
        query = query.filter(Merchant.category == category)
    if is_active and is_active != "all":
        query = query.filter(Merchant.is_active == (is_active == "true"))
        
    return query.count()

def patch_merchant_active(db: Session, merchant_id: int, is_active: bool) -> Optional[Merchant]:
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if merchant:
        merchant.is_active = is_active
        db.commit()
        db.refresh(merchant)
    return merchant

def get_admin_videos(
    db: Session,
    limit: int = 10,
    offset: int = 0,
    status: Optional[str] = None,
    post_type: Optional[str] = None
) -> List[Video]:
    from sqlalchemy.orm import joinedload
    query = db.query(Video).options(
        joinedload(Video.reviewer),
        joinedload(Video.tagged_merchant).joinedload(Merchant.owner)
    ).join(User, Video.reviewer_id == User.id)

    if status and status != "all":
        query = query.filter(Video.status == status)
    if post_type and post_type != "all":
        query = query.filter(Video.post_type == post_type)

    return query.offset(offset).limit(limit).all()

def get_admin_videos_count(
    db: Session,
    status: Optional[str] = None,
    post_type: Optional[str] = None
) -> int:
    query = db.query(Video).join(User, Video.reviewer_id == User.id)

    if status and status != "all":
        query = query.filter(Video.status == status)
    if post_type and post_type != "all":
        query = query.filter(Video.post_type == post_type)

    return query.count()

def patch_video_status(
    db: Session, video_id: int, status: str, reject_reason: Optional[str] = None
) -> Optional[Video]:
    from datetime import datetime
    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.status = status
        meta = dict(video.meta_data) if video.meta_data is not None else {}
        if status == "rejected":
            meta["reject_reason"] = reject_reason
            meta["rejected_at"] = datetime.utcnow().isoformat()
        else:
            if "reject_reason" in meta:
                del meta["reject_reason"]
            if "rejected_at" in meta:
                del meta["rejected_at"]
        video.meta_data = meta
        db.commit()
        db.refresh(video)
    return video

def get_admin_campaigns(
    db: Session,
    limit: int = 10,
    offset: int = 0,
    is_active: Optional[str] = None,
    merchant_search: Optional[str] = None
) -> List[Campaign]:
    from sqlalchemy.orm import joinedload
    query = db.query(Campaign).options(
        joinedload(Campaign.merchant).joinedload(Merchant.owner)
    ).join(Merchant, Campaign.merchant_id == Merchant.id)

    if is_active and is_active != "all":
        query = query.filter(Campaign.is_active == (is_active == "true"))
    if merchant_search:
        query = query.filter(Merchant.name.ilike(f"%{merchant_search}%"))

    return query.offset(offset).limit(limit).all()

def get_admin_campaigns_count(
    db: Session,
    is_active: Optional[str] = None,
    merchant_search: Optional[str] = None
) -> int:
    query = db.query(Campaign).join(Merchant, Campaign.merchant_id == Merchant.id)

    if is_active and is_active != "all":
        query = query.filter(Campaign.is_active == (is_active == "true"))
    if merchant_search:
        query = query.filter(Merchant.name.ilike(f"%{merchant_search}%"))

    return query.count()

def patch_campaign_active(db: Session, campaign_id: int, is_active: bool) -> Optional[Campaign]:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if campaign:
        campaign.is_active = is_active
        db.commit()
        db.refresh(campaign)
    return campaign


def get_admin_reports(
    db: Session,
    limit: int = 10,
    offset: int = 0,
    status: Optional[str] = None,
    reported_entity_type: Optional[str] = None
) -> List[dict]:
    from sqlalchemy.orm import joinedload
    from backend.core.all_models import Report, User, Video, Merchant
    
    query = db.query(Report).options(joinedload(Report.reporter))
    
    if status and status != "all":
        query = query.filter(Report.status == status)
        
    if reported_entity_type and reported_entity_type != "all":
        query = query.filter(Report.reported_entity_type == reported_entity_type)
        
    reports = query.order_by(Report.created_at.desc()).offset(offset).limit(limit).all()
    
    # Batch-load reported videos to avoid N+1 query pattern
    video_ids = []
    for r in reports:
        if r.reported_entity_type == "video":
            try:
                video_ids.append(int(r.reported_entity_id))
            except ValueError:
                pass
                
    videos_map = {}
    if video_ids:
        # Load videos with reviewer and tagged merchant
        videos = db.query(Video).options(
            joinedload(Video.reviewer),
            joinedload(Video.tagged_merchant).joinedload(Merchant.owner)
        ).filter(Video.id.in_(video_ids)).all()
        for v in videos:
            videos_map[str(v.id)] = v
            
    # Build response list matching the schema
    results = []
    for r in reports:
        reported_video = None
        if r.reported_entity_type == "video":
            reported_video = videos_map.get(r.reported_entity_id)
            
        results.append({
            "id": r.id,
            "reporter_id": r.reporter_id,
            "reported_entity_type": r.reported_entity_type,
            "reported_entity_id": r.reported_entity_id,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "reporter": r.reporter,
            "reported_video": reported_video
        })
        
    return results


def get_admin_reports_count(
    db: Session,
    status: Optional[str] = None,
    reported_entity_type: Optional[str] = None
) -> int:
    from backend.core.all_models import Report
    query = db.query(Report)
    
    if status and status != "all":
        query = query.filter(Report.status == status)
        
    if reported_entity_type and reported_entity_type != "all":
        query = query.filter(Report.reported_entity_type == reported_entity_type)
        
    return query.count()


def patch_report_action(
    db: Session,
    report_id: str,
    status_val: str,
    action_taken: Optional[str] = None
) -> Optional[dict]:
    from backend.core.all_models import Report, Video
    from backend.modules.content.services import delete_video_record_internal
    from sqlalchemy.orm import joinedload
    from datetime import datetime
    
    report = db.query(Report).options(joinedload(Report.reporter)).filter(Report.id == report_id).first()
    if not report:
        return None
        
    # Execute action
    reported_video = None
    if action_taken == "delete" and report.reported_entity_type == "video":
        # Find video to delete
        try:
            video_id = int(report.reported_entity_id)
            video = db.query(Video).options(joinedload(Video.tagged_merchant)).filter(Video.id == video_id).first()
            if video:
                delete_video_record_internal(db, video)
        except ValueError:
            pass
            
    report.status = status_val
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    # Reload video state if it wasn't deleted
    if report.reported_entity_type == "video":
        from backend.core.all_models import Merchant
        try:
            video_id = int(report.reported_entity_id)
            reported_video = db.query(Video).options(
                joinedload(Video.reviewer),
                joinedload(Video.tagged_merchant).joinedload(Merchant.owner)
            ).filter(Video.id == video_id).first()
        except ValueError:
            pass
        
    return {
        "id": report.id,
        "reporter_id": report.reporter_id,
        "reported_entity_type": report.reported_entity_type,
        "reported_entity_id": report.reported_entity_id,
        "reason": report.reason,
        "status": report.status,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "reporter": report.reporter,
        "reported_video": reported_video
    }