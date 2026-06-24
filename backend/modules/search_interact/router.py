from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.security import get_current_user, get_current_user_optional
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
    description="Trả về danh sách tất cả bình luận của video được sắp xếp theo thời gian tăng dần, tự động lồng các câu trả lời dưới dạng cây đệ quy."
)
def get_video_comments_list(
    video_id: int,
    db: Session = Depends(get_db)
):
    return services.get_video_comments(db=db, video_id=video_id)

@router.post(
    "/comments/{comment_id}/like",
    response_model=schemas.CommentLikeToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Thả tim hoặc hủy thả tim bình luận (Toggle Comment Like)",
    description="Thích bình luận nếu chưa thích, ngược lại thì hủy thích. Trả về trạng thái và tổng số lượt thích bình luận hiện tại."
)
def toggle_comment_like(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.toggle_comment_like(db=db, comment_id=comment_id, user_id=current_user.id)

@router.get(
    "/search",
    response_model=List[schemas.MerchantSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Tìm kiếm địa lý quán ăn (Geo-Search)",
    description="Tìm kiếm quán ăn dựa trên tọa độ địa lý của người dùng, bán kính R (km), từ khóa và lọc theo danh mục món ăn (ví dụ: pho, bun, com, banh). Trả về khoảng cách chi tiết."
)
def search_merchants_by_geo(
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm tên quán hoặc mô tả quán"),
    category: Optional[str] = Query(None, description="Lọc theo danh mục món ăn (ví dụ: pho, bun, com, banh)"),
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
        offset=offset,
        category=category
    )


@router.get("/status", summary="Kiểm tra trạng thái Module Search & Interact")
def get_status():
    return {
        "module": "search_interact",
        "status": "active",
        "description": "Quản lý tìm kiếm không gian (Geo-Search) & tương tác (Like/Comment)"
    }

@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_200_OK,
    summary="Xóa bình luận cùng câu trả lời",
    description="Xóa bình luận và các câu trả lời kèm theo. Yêu cầu chính chủ hoặc admin."
)
def delete_comment_endpoint(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.delete_comment(db=db, comment_id=comment_id, current_user=current_user)

@router.post(
    "/users/{user_id}/follow",
    response_model=schemas.FollowToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Theo dõi người dùng",
    description="Theo dõi người dùng khác bằng ID. Yêu cầu đăng nhập."
)
def follow_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.follow_user(db=db, follower_id=current_user.id, following_id=user_id)

@router.delete(
    "/users/{user_id}/unfollow",
    response_model=schemas.FollowToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Hủy theo dõi người dùng",
    description="Hủy theo dõi người dùng khác bằng ID. Yêu cầu đăng nhập."
)
def unfollow_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.unfollow_user(db=db, follower_id=current_user.id, following_id=user_id)

@router.get(
    "/users/me/following",
    response_model=List[schemas.FollowedUserResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách người dùng đang theo dõi",
    description="Trả về danh sách người dùng mà tài khoản hiện tại đang theo dõi. Yêu cầu đăng nhập."
)
def get_following_users_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_followed_users(db=db, current_user_id=current_user.id)


@router.post(
    "/videos/{video_id}/hide",
    status_code=status.HTTP_200_OK,
    summary="Ẩn bài viết",
    description="Ẩn một bài viết/video để nó không xuất hiện trên feed của người dùng hiện tại nữa. Yêu cầu đăng nhập."
)
def hide_post_endpoint(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.hide_post(db=db, user_id=current_user.id, video_id=video_id)

@router.delete(
    "/videos/{video_id}/unhide",
    status_code=status.HTTP_200_OK,
    summary="Hủy ẩn bài viết",
    description="Hủy ẩn bài viết để nó xuất hiện lại trên feed. Yêu cầu đăng nhập."
)
def unhide_post_endpoint(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.unhide_post(db=db, user_id=current_user.id, video_id=video_id)

@router.post(
    "/videos/{video_id}/share",
    response_model=schemas.ShareResponse,
    status_code=status.HTTP_200_OK,
    summary="Chia sẻ bài viết",
    description="Tăng lượt đếm chia sẻ cho bài viết/video."
)
def share_post_endpoint(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    return services.share_post(db=db, video_id=video_id, user_id=user_id)

