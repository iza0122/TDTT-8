import uuid
import boto3
from huggingface_hub import InferenceClient
from botocore.config import Config
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from backend.core.config import settings
from backend.core.all_models import Video, Merchant, Campaign, HiddenVideo, UserFollow, get_vietnam_time
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

def moderate_content_huggingface(title: str, description: str) -> str:
    """
    Kiểm duyệt nội dung tự động bằng Hugging Face Serverless Inference API (Zero-Shot Classification).
    Sử dụng đối tượng InferenceClient của thư viện chính thức huggingface_hub để cấu hình,
    nhưng thực hiện request HTTP trực tiếp qua thư viện requests để tránh lỗi phân tích cú pháp của thư viện.
    Model: MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7 (hoặc cấu hình)
    """
    import requests

    # 1. Kiểm tra cấu hình API
    if not settings.HUGGINGFACE_API_KEY or "your_" in settings.HUGGINGFACE_API_KEY.lower():
        print("[AI MODERATION] HUGGINGFACE_API_KEY chưa được cấu hình. Chuyển sang duyệt thủ công.")
        return "pending"

    # 2. Gộp tiêu đề và mô tả
    text_to_classify = f"{title} {description}".strip()
    if not text_to_classify:
        return "rejected"

    try:
        # Khởi tạo InferenceClient với token, model và timeout từ config
        client = InferenceClient(
            model=settings.HUGGINGFACE_MODEL_ID,
            token=settings.HUGGINGFACE_API_KEY,
            timeout=5.0
        )
        
        # Định nghĩa lại phương thức zero_shot_classification động trên đối tượng client
        # để tránh bug TypeError: list indices must be integers or slices, not str của huggingface_hub SDK
        def custom_zero_shot_classification(text, candidate_labels, hypothesis_template=None, headers=None, **kwargs):
            url = f"https://router.huggingface.co/hf-inference/models/{client.model}"
            req_headers = {
                "Authorization": f"Bearer {client.token}",
                "Content-Type": "application/json"
            }
            if headers:
                req_headers.update(headers)
            payload = {
                "inputs": text,
                "parameters": {
                    "candidate_labels": candidate_labels,
                    "hypothesis_template": hypothesis_template
                }
            }
            res = requests.post(url, headers=req_headers, json=payload, timeout=client.timeout)
            if res.status_code != 200:
                raise Exception(f"HTTP Error {res.status_code}: {res.text}")
            result = res.json()
            
            # Hỗ trợ cả 2 định dạng trả về của Inference API và trả về dict map 
            if isinstance(result, list):
                labels_list = [item["label"] for item in result]
                scores_list = [item["score"] for item in result]
                return {"labels": labels_list, "scores": scores_list}
            elif isinstance(result, dict):
                return result
            else:
                raise ValueError(f"Định dạng phản hồi không hợp lệ: {type(result)}")

        client.zero_shot_classification = custom_zero_shot_classification

        text = text_to_classify
        # 1. Định nghĩa bộ 4 nhãn biệt lập (BẮT BUỘC)
        candidate_labels = [
            "food review or dining experience",
            "spam, commercial advertising or product selling",
            "job recruitment or hiring",
            "general unrelated spam text"
        ]

        try:
            # 2. Gọi API với cấu hình tối ưu tốc độ và timeout
            response = client.zero_shot_classification(
                text,
                candidate_labels=candidate_labels,
                hypothesis_template="This text is about {}",
                timeout=15.0,
                headers={"X-Wait-For-Model": "true"}
            )
            
            labels = response.get("labels", [])
            scores = response.get("scores", [])
            
            # In log debug ra Terminal đầy đủ 4 nhãn
            print(f'[AI DEBUG] Văn bản kiểm duyệt: "{text[:100]}..."')
            for l, s in zip(labels, scores):
                print(f"-> Nhãn [{l}]: {s:.4f}")
                
            # 3. Logic quyết định duyệt bài
            # Tạo dictionary để tra cứu điểm số cho nhanh
            score_dict = dict(zip(labels, scores))
            food_score = score_dict.get("food review or dining experience", 0.0)
            
            # Tìm điểm số cao nhất của các nhãn rác còn lại
            spam_score = score_dict.get("spam, commercial advertising or product selling", 0.0)
            job_score = score_dict.get("job recruitment or hiring", 0.0)
            general_score = score_dict.get("general unrelated spam text", 0.0)
            max_spam_score = max(spam_score, job_score, general_score)
            
            # Điều kiện duyệt bài nghiêm ngặt
            if food_score >= 0.5 and food_score > max_spam_score:
                status = "approved"
            else:
                status = "rejected"

        except Exception as e:
            print(f"[AI MODERATION] Lỗi hệ thống: {str(e)}")
            status = "pending"
            
        return status

    except Exception as e:
        print(f"[AI MODERATION] InferenceClient error or timeout failure: {e}")
        return "pending"

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
    
    # Tích hợp kiểm duyệt tự động bằng AI
    moderated_status = "pending"
    try:
        moderated_status = moderate_content_huggingface(video_in.title, video_in.description or "")
    except Exception as e:
        print(f"[CONTENT] AI Moderation exception: {e}")
        moderated_status = "pending"

    # Kiểm tra xem đã có đánh giá cũ chưa để ghi đè (Anti-Spam / Edit Review)
    existing_review = None
    if is_review and tagged_merchant_id is not None:
        existing_review = db.query(Video).filter(
            Video.reviewer_id == reviewer_id,
            Video.tagged_merchant_id == tagged_merchant_id,
            (Video.post_type == "review") | (Video.post_type == "text")
        ).first()

    if existing_review:
        existing_review.title = video_in.title
        existing_review.description = video_in.description
        existing_review.rating = video_in.rating if video_in.rating is not None else 5
        if video_in.thumbnail_url:
            existing_review.thumbnail_url = video_in.thumbnail_url
        existing_review.created_at = get_vietnam_time()
        existing_review.status = moderated_status
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
            status=moderated_status
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

def get_video_feed(db: Session, cursor: Optional[str] = None, limit: int = 8, post_type: Optional[str] = None, current_user_id: Optional[int] = None, following_only: bool = False, tag: Optional[str] = None) -> dict:
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
        
    if tag:
        from sqlalchemy import or_
        from backend.core.all_models import Merchant
        
        # Outer join to filter by Merchant category if needed
        query = query.outerjoin(Merchant, Video.tagged_merchant_id == Merchant.id)
        
        tag_lower = f"%{tag.lower()}%"
        query = query.filter(
            or_(
                Video.title.ilike(tag_lower),
                Video.description.ilike(tag_lower),
                Merchant.category.ilike(tag_lower)
            )
        )
        
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
        
    # 4. Lấy các chiến dịch quảng cáo (Ads) đang hoạt động
    active_campaigns = db.query(Campaign).options(joinedload(Campaign.merchant)).filter(Campaign.is_active == True).all()
    
    # 5. Trộn Feed theo tỷ lệ 4 thường : 1 quảng cáo
    mixed_items = []
    campaigns_to_track = []
    ad_index = 0
    
    for i, video in enumerate(organic_videos):
        video.is_liked = video.id in liked_video_ids
        if video.reviewer:
            video.reviewer.is_following = video.reviewer_id in followed_user_ids
        mixed_items.append(video)
        
        # Cứ sau 4 video thường, nếu có QC hoạt động thì chèn vào
        if (i + 1) % 4 == 0 and active_campaigns:
            campaign = active_campaigns[ad_index % len(active_campaigns)]
            ad_index += 1
            
            # Đóng gói campaign giống cấu trúc của VideoResponse
            ad_item = {
                "id": campaign.id,
                "title": campaign.title,
                "video_url": campaign.video_url,
                "thumbnail_url": campaign.thumbnail_url,
                "description": f"Được tài trợ bởi {campaign.merchant.name if campaign.merchant else ''}",
                "status": "approved",
                "likes_count": 0,
                "reviewer_id": 0,
                "tagged_merchant_id": campaign.merchant_id,
                "created_at": campaign.created_at,
                "is_ads": True,
                "user": {
                    "id": 0,
                    "full_name": campaign.merchant.name if campaign.merchant else "Được tài trợ",
                    "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                    "username": "sponsored"
                },
                "restaurant": {
                    "id": campaign.merchant_id,
                    "name": campaign.merchant.name if campaign.merchant else "",
                    "address": campaign.merchant.address if campaign.merchant else "",
                    "latitude": campaign.merchant.latitude if campaign.merchant else 0.0,
                    "longitude": campaign.merchant.longitude if campaign.merchant else 0.0,
                    "owner_id": campaign.merchant.owner_id if campaign.merchant else 0
                } if campaign.merchant else None
            }
            mixed_items.append(ad_item)
            campaigns_to_track.append(campaign.id)
            
    return {
        "items": mixed_items,
        "next_cursor": next_cursor,
        "campaigns_to_track": campaigns_to_track
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

    return {
        "status": "success",
        "message": "Đã xóa bài viết và toàn bộ dữ liệu liên quan thành công."
    }

# ==============================================================================
# ĐỀ XUẤT HƯỚNG XỬ LÝ HÀNG ĐỢI "PENDING" DÀNH CHO TRANG ADMIN (DRAFT/DRAFT API)
# ==============================================================================
# Gợi ý: Khi hệ thống AI bị lỗi mạng, timeout hoặc quá tải, bài viết được lưu ở
# trạng thái "pending" để Admin phê duyệt thủ công. Các hàm dưới đây giúp quản trị
# viên truy vấn danh sách cần duyệt và cập nhật thủ công trạng thái của chúng.

def get_pending_videos(db: Session, skip: int = 0, limit: int = 50) -> list[Video]:
    """
    Quét danh sách các bài viết/video đang chờ phê duyệt (status='pending').
    Dành riêng cho dashboard của Admin để xử lý duyệt bằng tay.
    """
    return db.query(Video).filter(Video.status == "pending").offset(skip).limit(limit).all()

def update_video_status_manual(db: Session, video_id: int, new_status: str) -> dict:
    """
    Cho phép Admin phê duyệt hoặc từ chối bài viết thủ công.
    - new_status: 'approved' (Nút Approve) hoặc 'rejected' (Nút Reject)
    """
    if new_status not in ["approved", "rejected"]:
        raise ValueError("Trạng thái mới không hợp lệ. Chỉ chấp nhận 'approved' hoặc 'rejected'.")
        
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        return {"status": "error", "message": "Không tìm thấy bài viết."}
        
    video.status = new_status
    db.commit()
    db.refresh(video)
    
    return {
        "status": "success",
        "message": f"Đã cập nhật trạng thái bài viết sang '{new_status}' thành công.",
        "video_id": video.id,
        "new_status": video.status
    }
