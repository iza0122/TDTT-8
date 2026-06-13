from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from typing import List, Optional
from backend.core.all_models import Like, Comment, Video, Merchant, CommentLike, User, UserFollow, HiddenVideo
from backend.modules.search_interact.schemas import LikeToggleResponse, CommentCreate, CommentLikeToggleResponse

def toggle_like(db: Session, video_id: int, user_id: int) -> LikeToggleResponse:
    # 1. Verify video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video with ID {video_id} does not exist"
        )

    # 2. Check if already liked
    existing_like = db.query(Like).filter(Like.video_id == video_id, Like.user_id == user_id).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        if video.likes_count > 0:
            video.likes_count -= 1
        db.commit()
        liked = False
        message = "Unliked video successfully"
    else:
        # Like
        new_like = Like(video_id=video_id, user_id=user_id)
        db.add(new_like)
        video.likes_count += 1
        db.commit()
        liked = True
        message = "Liked video successfully"

    # 3. Get total likes count
    likes_count = video.likes_count

    return LikeToggleResponse(
        liked=liked,
        likes_count=likes_count,
        message=message
    )

def create_comment(db: Session, video_id: int, user_id: int, comment_data: CommentCreate) -> Comment:
    # 1. Verify video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video with ID {video_id} does not exist"
        )

    # 2. Verify parent comment if parent_id is supplied
    if comment_data.parent_id is not None:
        parent_comment = db.query(Comment).filter(Comment.id == comment_data.parent_id).first()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent comment with ID {comment_data.parent_id} does not exist"
            )
        if parent_comment.video_id != video_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment must belong to the same video"
            )

    # 3. Create comment
    new_comment = Comment(
        user_id=user_id,
        video_id=video_id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    db.add(new_comment)
    
    # Tăng số lượng bình luận của video
    video.comments_count = (video.comments_count or 0) + 1
    
    db.commit()
    db.refresh(new_comment)
    return new_comment

def get_video_comments(db: Session, video_id: int) -> List[Comment]:
    # Verify video exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video with ID {video_id} does not exist"
        )
        
    # Lấy các bình luận gốc (parent_id IS NULL) để Pydantic sinh cây bình luận đệ quy tuyệt đẹp
    return db.query(Comment).filter(
        Comment.video_id == video_id,
        Comment.parent_id == None
    ).order_by(Comment.created_at.asc()).all()

def toggle_comment_like(db: Session, comment_id: int, user_id: int) -> CommentLikeToggleResponse:
    # 1. Verify comment exists
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} does not exist"
        )

    # 2. Check if already liked
    existing_like = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == user_id
    ).first()

    if existing_like:
        # Unlike
        db.delete(existing_like)
        if comment.likes_count > 0:
            comment.likes_count -= 1
        db.commit()
        liked = False
        message = "Unliked comment successfully"
    else:
        # Like
        new_like = CommentLike(comment_id=comment_id, user_id=user_id)
        db.add(new_like)
        comment.likes_count += 1
        db.commit()
        liked = True
        message = "Liked comment successfully"

    return CommentLikeToggleResponse(
        liked=liked,
        likes_count=comment.likes_count,
        message=message
    )

def geo_search_merchants(
    db: Session,
    q: Optional[str],
    lat: float,
    lng: float,
    radius: float,
    limit: int,
    offset: int,
    category: Optional[str] = None
) -> List[dict]:
    """
    Search merchants using Haversine formula on SQL.
    Dialect-aware for both SQLite and PostgreSQL.
    """
    # Define Case Insensitivity Operator based on Dialect
    dialect = db.bind.dialect.name
    like_op = "ILIKE" if dialect == "postgresql" else "LIKE"
    
    # Base parts of SQL query
    conditions = ["1=1"]
    params = {
        "lat": lat,
        "lng": lng,
        "radius": radius,
        "limit": limit,
        "offset": offset
    }

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        conditions.append(f"(name {like_op} :q OR description {like_op} :q)")
        params["q"] = search_pattern

    if category and category.strip():
        # Ánh xạ từ các slug Frontend gửi lên thành các từ khóa tiếng Việt chuẩn
        category_map = {
            "pho": "phở",
            "bun": "bún",
            "com": "cơm",
            "banh": "bánh",
            "cafe": "cà phê",
            "tra": "trà sữa",
            "lau": "lẩu"
        }
        mapped_cat = category_map.get(category.strip().lower(), category.strip())
        cat_pattern = f"%{mapped_cat}%"
        conditions.append(f"(category {like_op} :category OR name {like_op} :category)")
        params["category"] = cat_pattern

    # Haversine distance subquery in SQL:
    haversine_sql = """
        (6371 * acos(
            cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(latitude))
        ))
    """

    filter_clause = " AND ".join(conditions)

    query_str = f"""
        SELECT id, name, address, category, latitude, longitude, description, rating_avg, created_at, image_url,
               {haversine_sql} AS distance
        FROM merchants
        WHERE {filter_clause}
          AND {haversine_sql} <= :radius
        ORDER BY distance ASC
        LIMIT :limit OFFSET :offset
    """

    result = db.execute(text(query_str), params)
    
    merchants_list = []
    for row in result:
        merchants_list.append({
            "id": row.id,
            "name": row.name,
            "address": row.address,
            "category": row.category,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "description": row.description,
            "rating_avg": row.rating_avg,
            "distance": round(row.distance, 3), # Round to 3 decimal places (meters precision)
            "image_url": row.image_url,
            "created_at": row.created_at
        })
        
    return merchants_list

def delete_comment(db: Session, comment_id: int, current_user) -> dict:
    """
    Xóa bình luận cùng toàn bộ replies con và likes đi kèm.
    Chỉ cho phép tác giả bình luận, chủ quán của video được tag, hoặc Admin xóa.
    """
    # 1. Tìm comment cùng thông tin video và nhà hàng được gắn thẻ
    from sqlalchemy.orm import joinedload
    comment = db.query(Comment).options(
        joinedload(Comment.video).joinedload(Video.tagged_merchant)
    ).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bình luận không tồn tại."
        )

    # Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của nhà hàng được gắn thẻ trong bài viết hay không
    is_merchant_owner = False
    if comment.video and comment.video.tagged_merchant and comment.video.tagged_merchant.owner_id == current_user.id:
        is_merchant_owner = True

    # 2. Kiểm tra quyền sở hữu (chính chủ comment, chủ nhà hàng được tag, hoặc admin)
    if comment.user_id != current_user.id and not is_merchant_owner and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa bình luận này."
        )

    # 3. Thực hiện xóa bình luận (SQLite cascade tự động dọn comment_likes và replies con)
    # Tìm video tương ứng để giảm số lượng bình luận
    video = db.query(Video).filter(Video.id == comment.video_id).first()
    if video:
        # Đếm số lượng bình luận bị xóa (bình luận hiện tại và tất cả các phản hồi con)
        comments_to_delete_count = db.query(Comment).filter(
            (Comment.id == comment_id) | (Comment.parent_id == comment_id)
        ).count()
        video.comments_count = max(0, (video.comments_count or 0) - comments_to_delete_count)

    db.delete(comment)
    db.commit()

    return {
        "status": "success",
        "message": "Đã xóa bình luận thành công."
    }

def follow_user(db: Session, follower_id: int, following_id: int) -> dict:
    if follower_id == following_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự theo dõi chính mình."
        )
    # Check if target user exists
    target = db.query(User).filter(User.id == following_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng được chọn không tồn tại."
        )
    
    # Check if already followed
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if not existing:
        follow = UserFollow(follower_id=follower_id, following_id=following_id)
        db.add(follow)
        db.commit()
        
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == following_id).count()
    return {
        "is_following": True,
        "followers_count": followers_count,
        "message": "Đã theo dõi người dùng thành công."
    }

def unfollow_user(db: Session, follower_id: int, following_id: int) -> dict:
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == following_id).count()
    return {
        "is_following": False,
        "followers_count": followers_count,
        "message": "Đã hủy theo dõi người dùng."
    }

def hide_post(db: Session, user_id: int, video_id: int) -> dict:
    # Check if post exists
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết/Video không tồn tại."
        )
        
    existing = db.query(HiddenVideo).filter(
        HiddenVideo.user_id == user_id,
        HiddenVideo.video_id == video_id
    ).first()
    
    if not existing:
        hidden = HiddenVideo(user_id=user_id, video_id=video_id)
        db.add(hidden)
        db.commit()
        
    return {
        "status": "success",
        "message": "Đã ẩn bài viết khỏi bảng tin của bạn."
    }

def unhide_post(db: Session, user_id: int, video_id: int) -> dict:
    existing = db.query(HiddenVideo).filter(
        HiddenVideo.user_id == user_id,
        HiddenVideo.video_id == video_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        
    return {
        "status": "success",
        "message": "Đã hiển thị lại bài viết."
    }

def share_post(db: Session, video_id: int, user_id: Optional[int] = None) -> dict:
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bài viết/Video không tồn tại."
        )
        
    already_counted = False
    if user_id:
        from backend.core.all_models import UserShare
        existing_share = db.query(UserShare).filter(
            UserShare.user_id == user_id,
            UserShare.video_id == video_id
        ).first()
        if existing_share:
            already_counted = True
        else:
            new_share = UserShare(user_id=user_id, video_id=video_id)
            db.add(new_share)
            
    if not already_counted:
        video.shares_count = (video.shares_count or 0) + 1
        db.commit()
        db.refresh(video)
    else:
        db.commit()
        
    return {
        "shares_count": video.shares_count,
        "message": "Đã chia sẻ bài viết."
    }
