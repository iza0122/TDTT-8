import uuid
import boto3
from botocore.config import Config
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from backend.core.config import settings
from backend.core.all_models import Video, Merchant, Campaign, HiddenVideo, UserFollow
from backend.modules.content.schemas import VideoCreate
from backend.core.database import SessionLocal, Base

def get_r2_client():
    """
    Khởi tạo dynamic boto3 client cho Cloudflare R2.
    Tránh lỗi crash lúc import module nếu biến cấu hình chưa được định nghĩa đầy đủ.
    """
    if (not settings.CLOUDFLARE_R2_ACCOUNT_ID or 
        not settings.CLOUDFLARE_R2_ACCESS_KEY_ID or 
        not settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ lưu trữ đám mây Cloudflare R2 chưa được cấu hình đầy đủ."
        )
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def generate_presigned_upload_url(file_name: str, content_type: str, folder: str = "general") -> dict:
    """
    Tạo Presigned URL (PUT method) cho phép client upload file thẳng lên Cloudflare R2.
    """
    # 1. Tạo tên file duy nhất tránh ghi đè dữ liệu
    ext = file_name.split(".")[-1] if "." in file_name else ""
    unique_filename = f"{uuid.uuid4()}"
    if ext:
        unique_filename = f"{unique_filename}.{ext}"
        
    key = f"{folder}/{unique_filename}"
    
    # 2. Tạo client và sinh Presigned URL
    try:
        s3_client = get_r2_client()
        upload_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.CLOUDFLARE_R2_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type
            },
            ExpiresIn=3600  # Link có hiệu lực trong 1 giờ
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi khởi tạo Presigned URL: {str(e)}"
        )
        
    # 3. Tạo Public URL để truy cập file sau khi upload thành công
    public_url_base = settings.CLOUDFLARE_R2_PUBLIC_URL
    if public_url_base:
        # Đảm bảo đường dẫn chuẩn xác
        public_url_base = public_url_base.rstrip("/")
        public_url = f"{public_url_base}/{key}"
    else:
        # Fallback về địa chỉ mặc định của Cloudflare R2
        public_url = f"https://pub-{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev/{settings.CLOUDFLARE_R2_BUCKET_NAME}/{key}"
        
    return {
        "upload_url": upload_url,
        "public_url": public_url,
        "key": key
    }

def create_video(db: Session, video_in: VideoCreate, reviewer_id: int) -> Video:
    """
    Lưu thông tin siêu dữ liệu (Metadata) của Video / Review vào PostgreSQL.
    """
    # Xử lý chuẩn hóa tagged_merchant_id: nếu là 0 hoặc bé hơn, coi như không gắn thẻ (None)
    tagged_merchant_id = video_in.tagged_merchant_id
    if tagged_merchant_id is not None and tagged_merchant_id <= 0:
        tagged_merchant_id = None

    # Xác minh nhà hàng được gắn thẻ nếu có
    merchant = None
    if tagged_merchant_id is not None:
        merchant = db.query(Merchant).filter(Merchant.id == tagged_merchant_id).first()
        if not merchant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nhà hàng/Cửa hàng được gắn thẻ không tồn tại trong hệ thống."
            )
            
    is_review = video_in.post_type == "review" or video_in.post_type == "text"
    
    # Kiểm tra xem đã có đánh giá cũ chưa để ghi đè (Anti-Spam / Edit Review)
    existing_review = None
    if is_review and tagged_merchant_id is not None:
        existing_review = db.query(Video).filter(
            Video.reviewer_id == reviewer_id,
            Video.tagged_merchant_id == tagged_merchant_id,
            (Video.post_type == "review") | (Video.post_type == "text")
        ).first()

    if existing_review:
        from datetime import datetime
        existing_review.title = video_in.title
        existing_review.description = video_in.description
        existing_review.rating = video_in.rating if video_in.rating is not None else 5
        if video_in.thumbnail_url:
            existing_review.thumbnail_url = video_in.thumbnail_url
        existing_review.created_at = datetime.utcnow()
        db_video = existing_review
    else:
        db_video = Video(
            title=video_in.title,
            video_url=video_in.video_url,
            thumbnail_url=video_in.thumbnail_url,
            description=video_in.description,
            reviewer_id=reviewer_id,
            tagged_merchant_id=tagged_merchant_id,
            post_type=video_in.post_type or "video",
            rating=video_in.rating if video_in.rating is not None else 5,
            status="approved" if is_review else "pending"  # Tự động duyệt đối với đánh giá bằng chữ
        )
    
    try:
        if not existing_review:
            db.add(db_video)
        db.commit()
        db.refresh(db_video)
        
        # Cập nhật điểm rating_avg cho Merchant dựa trên tất cả bài đánh giá của merchant này
        if tagged_merchant_id is not None and merchant is not None:
            ratings = db.query(Video.rating).filter(
                Video.tagged_merchant_id == tagged_merchant_id,
                Video.rating.isnot(None)
            ).all()
            if ratings:
                avg_rating = sum(r[0] for r in ratings) / len(ratings)
                merchant.rating_avg = round(avg_rating, 1)
                db.commit()
                db.refresh(merchant)
                
        return db_video
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi lưu trữ thông tin video/đánh giá: {str(e)}"
        )

def reup_video(db: Session, video_id: int, reviewer_id: int) -> Video:
    """
    Chia sẻ lại (Reup) một bài viết/video của người khác lên bảng tin của mình.
    """
    # 1. Tìm video gốc
    original_video = db.query(Video).filter(Video.id == video_id).first()
    if not original_video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết/Video gốc không tồn tại."
        )

    # 2. Tạo một bản ghi video mới sao chép thông tin
    db_video = Video(
        title=original_video.title,
        video_url=original_video.video_url,
        thumbnail_url=original_video.thumbnail_url,
        description=original_video.description,
        reviewer_id=reviewer_id,
        tagged_merchant_id=original_video.tagged_merchant_id,
        post_type=original_video.post_type,
        reup_from_id=original_video.id,
        status="approved"  # Tự động approve cho bài reup
    )

    try:
        db.add(db_video)
        
        # Tăng luôn lượt chia sẻ (share_post logic) cho video gốc của chủ sở hữu nếu user chưa share bài này bao giờ
        from backend.core.all_models import UserShare
        existing_share = db.query(UserShare).filter(
            UserShare.user_id == reviewer_id,
            UserShare.video_id == video_id
        ).first()
        
        if not existing_share:
            new_share = UserShare(user_id=reviewer_id, video_id=video_id)
            db.add(new_share)
            original_video.shares_count = (original_video.shares_count or 0) + 1
        
        db.commit()
        db.refresh(db_video)
        return db_video
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi reup bài viết: {str(e)}"
        )

def get_videos(db: Session, skip: int = 0, limit: int = 10) -> list[Video]:
    """
    Lấy danh sách video (cho Feed) có phân trang (cũ).
    """
    return db.query(Video).offset(skip).limit(limit).all()

def get_video_feed(db: Session, cursor: Optional[str] = None, limit: int = 8, post_type: Optional[str] = None, current_user_id: Optional[int] = None, following_only: bool = False) -> dict:
    """
    Lấy danh sách video (cho Feed) có phân trang bằng Cursor
    và tự động trộn quảng cáo (Campaign) theo tỷ lệ 4:1.
    """
    # 1. Giải mã cursor
    cursor_data = decode_cursor(cursor)
    
    # Lấy danh sách ID video đã thích và người dùng đã follow của user hiện tại
    liked_video_ids = set()
    followed_user_ids = set()
    if current_user_id:
        from backend.core.all_models import Like
        likes = db.query(Like.video_id).filter(Like.user_id == current_user_id).all()
        liked_video_ids = {like[0] for like in likes}
        
        follows = db.query(UserFollow.following_id).filter(UserFollow.follower_id == current_user_id).all()
        followed_user_ids = {f[0] for f in follows}
    
    # 2. Truy vấn video thường (organic)
    query = db.query(Video).options(
        joinedload(Video.reviewer),
        joinedload(Video.tagged_merchant),
        joinedload(Video.reup_from).joinedload(Video.reviewer)
    ).filter(Video.status == "approved")
    if post_type:
        query = query.filter(Video.post_type == post_type)
        
    # Lọc video bị ẩn bởi user hiện tại
    if current_user_id:
        hidden_video_ids = db.query(HiddenVideo.video_id).filter(HiddenVideo.user_id == current_user_id).all()
        if hidden_video_ids:
            query = query.filter(~Video.id.in_([hv[0] for hv in hidden_video_ids]))
            
    # Lọc chỉ lấy các bài viết của những người đang follow
    if following_only and current_user_id:
        if followed_user_ids:
            query = query.filter(Video.reviewer_id.in_(list(followed_user_ids)))
        else:
            # Chưa theo dõi ai -> Trả về danh sách trống
            query = query.filter(1 == 0)
        
    if cursor_data:
        cursor_time, cursor_id = cursor_data
        query = query.filter(
            (Video.created_at < cursor_time) | 
            ((Video.created_at == cursor_time) & (Video.id < cursor_id))
        )
    
    # Lấy thêm 1 phần tử để xác định has_next
    query = query.order_by(Video.created_at.desc(), Video.id.desc())
    organic_videos = query.limit(limit + 1).all()
    
    # 3. Tính toán next_cursor
    has_next = len(organic_videos) > limit
    if has_next:
        organic_videos = organic_videos[:limit]
        last_video = organic_videos[-1]
        next_cursor = encode_cursor(last_video.created_at, last_video.id)
    else:
        next_cursor = None
        
    # 5. Tạo Feed từ video thường (Đã tắt việc trộn quảng cáo/campaigns)
    mixed_items = []
    for i, video in enumerate(organic_videos):
        video.is_liked = video.id in liked_video_ids
        if video.reviewer:
            video.reviewer.is_following = video.reviewer_id in followed_user_ids
        mixed_items.append(video)
            
    return {
        "items": mixed_items,
        "next_cursor": next_cursor,
        "campaigns_to_track": []
    }

from backend.common.pagination import decode_cursor, encode_cursor

def increment_campaign_impressions(campaign_ids: list[int]):
    """
    Tăng impressions_count của các chiến dịch quảng cáo được hiển thị trong tiến trình nền.
    Tạo và đóng kết nối riêng biệt để tránh tranh chấp khoá (lock) SQLite.
    """
    if not campaign_ids:
        return
    db = SessionLocal()
    try:
        db.query(Campaign).filter(Campaign.id.in_(campaign_ids)).update(
            {Campaign.impressions_count: Campaign.impressions_count + 1},
            synchronize_session=False
        )
        db.commit()
        print(f"[CONTENT] Đã tăng impressions cho các chiến dịch: {campaign_ids}")
    except Exception as e:
        db.rollback()
        print(f"[CONTENT] Lỗi khi tăng impressions trong background task: {e}")
    finally:
        db.close()

def delete_video(db: Session, video_id: int, current_user) -> dict:
    """
    Xóa video review (bài viết) cùng toàn bộ dữ liệu liên quan (likes, comments, R2 files).
    """
    # 1. Tìm video cùng thông tin nhà hàng được gắn thẻ
    video = db.query(Video).options(joinedload(Video.tagged_merchant)).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết/Video không tồn tại trong hệ thống."
        )

    # Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của nhà hàng được gắn thẻ hay không
    is_merchant_owner = False
    if video.tagged_merchant and video.tagged_merchant.owner_id == current_user.id:
        is_merchant_owner = True

    # 2. Kiểm tra quyền sở hữu (chính chủ review, chủ nhà hàng được tag, hoặc admin)
    if video.reviewer_id != current_user.id and not is_merchant_owner and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa bài viết/đánh giá này."
        )

    delete_video_record_internal(db, video)

    return {
        "status": "success",
        "message": "Đã xóa bài viết và toàn bộ dữ liệu liên quan thành công."
    }

def delete_video_record_internal(db: Session, video: Video):
    video_id = video.id
    tagged_merchant_id = video.tagged_merchant_id
    merchant = video.tagged_merchant

    # 3. Trích xuất key lưu trữ Cloudflare R2 từ video_url và thumbnail_url để xóa file vật lý
    r2_public_url = settings.CLOUDFLARE_R2_PUBLIC_URL
    
    def extract_r2_key(url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        # Nếu url chứa r2_public_url
        if r2_public_url and r2_public_url in url:
            parts = url.split(r2_public_url)
            if len(parts) > 1:
                return parts[1].lstrip("/")
        # fallback tìm folder "general", "videos", "images", "thumbnails"
        for folder in ["general", "videos", "images", "thumbnails"]:
            if f"/{folder}/" in url:
                parts = url.split(f"/{folder}/")
                if len(parts) > 1:
                    return f"{folder}/{parts[1]}"
        return None

    # Xóa file video/image trên R2
    video_key = extract_r2_key(video.video_url)
    if video_key:
        try:
            s3_client = get_r2_client()
            s3_client.delete_object(Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME, Key=video_key)
            print(f"[CONTENT] Đã xóa file video trên R2: {video_key}")
        except Exception as e:
            print(f"[CONTENT] Lỗi khi xóa file video trên R2: {str(e)}")

    # Xóa file thumbnail trên R2 (nếu có)
    if video.thumbnail_url:
        thumbnail_key = extract_r2_key(video.thumbnail_url)
        if thumbnail_key:
            try:
                s3_client = get_r2_client()
                s3_client.delete_object(Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME, Key=thumbnail_key)
                print(f"[CONTENT] Đã xóa file thumbnail trên R2: {thumbnail_key}")
            except Exception as e:
                print(f"[CONTENT] Lỗi khi xóa file thumbnail trên R2: {str(e)}")

    # 4. Xóa video khỏi CSDL (Cascade tự động xóa likes, comments, replies, comment_likes)
    db.delete(video)
    db.commit()

    # Cập nhật lại điểm rating_avg cho Merchant dựa trên tất cả bài đánh giá còn lại
    if tagged_merchant_id is not None and merchant is not None:
        ratings = db.query(Video.rating).filter(
            Video.tagged_merchant_id == tagged_merchant_id,
            Video.rating.isnot(None),
            Video.id != video_id  # Đảm bảo video hiện tại đã bị loại khỏi tính toán (hoặc đã delete)
        ).all()
        if ratings:
            avg_rating = sum(r[0] for r in ratings) / len(ratings)
            merchant.rating_avg = round(avg_rating, 1)
        else:
            merchant.rating_avg = 0.0
        db.commit()
