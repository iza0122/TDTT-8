from fastapi import APIRouter, Depends, Query, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.core.database import get_db
from backend.core.security import get_current_user, RoleChecker, get_current_user_optional
from backend.core.all_models import User
from backend.modules.content import services, schemas

router = APIRouter()

@router.get("/status", summary="Kiểm tra trạng thái Module Content")
def get_status():
    return {
        "module": "content",
        "status": "active",
        "description": "Quản lý media, tải video review & thuật toán Feed"
    }

@router.post(
    "/presigned-url",
    response_model=schemas.PresignedUrlResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Khởi tạo link upload trực tiếp lên Cloudflare R2",
    description="Nhận vào tên file và định dạng để backend sinh Presigned PUT URL. Yêu cầu đăng nhập."
)
def get_upload_url(
    payload: schemas.PresignedUrlRequest,
    current_user: User = Depends(get_current_user)
):
    return services.generate_presigned_upload_url(
        file_name=payload.file_name,
        content_type=payload.content_type,
        folder=payload.folder
    )

@router.post(
    "/videos",
    response_model=schemas.VideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Lưu trữ thông tin siêu dữ liệu (Metadata) của Video review",
    description="Sau khi Client upload file thành công lên R2 bằng Presigned URL, gọi API này để lưu metadata vào Postgres. Yêu cầu đăng nhập."
)
def create_video_metadata(
    payload: schemas.VideoCreate,
    current_user: User = Depends(RoleChecker(["reviewer", "merchant"])),
    db: Session = Depends(get_db)
):
    return services.create_video(
        db=db,
        video_in=payload,
        reviewer_id=current_user.id
    )

@router.get(
    "/videos",
    response_model=schemas.VideoFeedResponse,
    summary="Lấy danh sách các Video review (Feed)",
    description="Truy xuất danh sách video để hiển thị trên bảng tin (Feed) công cộng. Hỗ trợ phân trang bằng Cursor và tự động trộn QC."
)
def list_videos(
    cursor: Optional[str] = Query(None, description="Cursor của trang trước (base64 string)"),
    limit: int = Query(8, ge=1, le=100, description="Số lượng bản ghi tối đa trả về"),
    post_type: Optional[str] = Query(None, description="Lọc theo loại post (video hoặc image)"),
    following_only: bool = Query(False, description="Chỉ lấy các bài viết của những người dùng đang theo dõi"),
    tag: Optional[str] = Query(None, description="Lọc theo tag/danh mục món ăn"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    user_id = current_user.id if current_user else None
    feed_data = services.get_video_feed(
        db=db, 
        cursor=cursor, 
        limit=limit, 
        post_type=post_type, 
        current_user_id=user_id,
        following_only=following_only,
        tag=tag
    )
    
    # Kích hoạt tăng lượt impressions của campaign bất đồng bộ qua background task
    if feed_data.get("campaigns_to_track") and background_tasks:
        background_tasks.add_task(
            services.increment_campaign_impressions,
            feed_data["campaigns_to_track"]
        )
        
    return feed_data

@router.delete(
    "/videos/{video_id}",
    status_code=status.HTTP_200_OK,
    summary="Xóa Video review (Bài viết/Post)",
    description="Xóa bài viết/video cùng toàn bộ dữ liệu liên quan (likes, comments, files). Yêu cầu đăng nhập chính chủ hoặc quyền Admin."
)
def delete_video_post(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return services.delete_video(
        db=db,
        video_id=video_id,
        current_user=current_user
    )

@router.post(
    "/videos/{video_id}/reup",
    response_model=schemas.VideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Chia sẻ lại bài viết lên trang cá nhân (Reup)",
    description="Nhân bản bài viết/video của người khác thành bài viết của mình. Yêu cầu đăng nhập."
)
def reup_video_endpoint(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return services.reup_video(db=db, video_id=video_id, reviewer_id=current_user.id)
