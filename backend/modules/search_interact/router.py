from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.core.all_models import User
from backend.modules.search_interact import schemas, services

router = APIRouter(tags=["Search & Interaction"])

@router.post(
    "/videos/{video_id}/like",
    response_model=schemas.LikeToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Thả tim hoặc bỏ thả tim video (Toggle Like)",
    description="Thích video nếu chưa thích, ngược lại thì hủy thích. Trả về trạng thái và tổng số lượt thích hiện tại."
)
def toggle_video_like(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.toggle_like(db=db, video_id=video_id, user_id=current_user.id)

@router.post(
    "/videos/{video_id}/comments",
    response_model=schemas.CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng bình luận phẳng lên video",
    description="Đăng bình luận mới cho video. Hỗ trợ trường `parent_id` để trả lời một bình luận khác."
)
def create_video_comment(
    video_id: int,
    comment_data: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.create_comment(db=db, video_id=video_id, user_id=current_user.id, comment_data=comment_data)

@router.get(
    "/videos/{video_id}/comments",
    response_model=List[schemas.CommentResponse],
    status_code=status.HTTP_200_OK,
    summary="Lấy toàn bộ bình luận của video",
    description="Trả về danh sách tất cả bình luận phẳng của video được sắp xếp theo thời gian tăng dần (cũ nhất lên trước)."
)
def get_video_comments_list(
    video_id: int,
    db: Session = Depends(get_db)
):
    return services.get_video_comments(db=db, video_id=video_id)

@router.get(
    "/search",
    response_model=List[schemas.MerchantSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Tìm kiếm địa lý quán ăn (Geo-Search)",
    description="Tìm kiếm quán ăn dựa trên tọa độ địa lý của người dùng, bán kính R (km) và từ khóa tìm kiếm (ILIKE tên quán/mô tả quán). Trả về khoảng cách chi tiết."
)
def search_merchants_by_geo(
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm tên quán hoặc mô tả quán"),
    lat: float = Query(..., description="Vĩ độ hiện tại của người dùng (ví dụ: 10.762)"),
    lng: float = Query(..., description="Kinh độ hiện tại của người dùng (ví dụ: 106.682)"),
    radius: float = Query(5.0, description="Bán kính tìm kiếm tối đa tính bằng km (mặc định: 5.0)"),
    limit: int = Query(20, description="Giới hạn số lượng kết quả"),
    offset: int = Query(0, description="Vị trí bắt đầu lấy dữ liệu"),
    db: Session = Depends(get_db)
):
    return services.geo_search_merchants(
        db=db,
        q=q,
        lat=lat,
        lng=lng,
        radius=radius,
        limit=limit,
        offset=offset
    )


@router.get("/status", summary="Kiểm tra trạng thái Module Search & Interact")
def get_status():
    return {
        "module": "search_interact",
        "status": "active",
        "description": "Quản lý tìm kiếm không gian (Geo-Search) & tương tác (Like/Comment)"
    }
