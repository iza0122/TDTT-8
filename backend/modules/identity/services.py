import json
import urllib
from typing import Optional
import urllib.request
import urllib.error
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from firebase_admin import auth

from backend.core.config import settings
from backend.core.all_models import User, Video, UserFollow, HiddenVideo
from backend.modules.identity.schemas import RegisterRequest, LoginRequest, UserProfileResponse, GoogleLoginRequest, UserProfileUpdateRequest

def register_user(db: Session, data: RegisterRequest) -> User:
    """
    Đăng ký người dùng mới.
    - Cố gắng đăng ký tài khoản trên Firebase Auth trước.
    - Sau đó, lưu trữ/đồng bộ thông tin xuống Database local.
    - Hỗ trợ chế độ Mock/Local fallback nếu không cấu hình Firebase.
    """
    # 1. Xác định email
    email = data.email
    if not email and data.phone_number:
        # Hỗ trợ đăng ký bằng SĐT qua email giả lập để tương thích với Email/Password của Firebase
        email = f"{data.phone_number}@foodspot.local"
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yêu cầu cung cấp Email hoặc Số điện thoại để đăng ký."
        )

    # Đảm bảo email viết thường để tránh trùng lặp do hoa/thường
    email = email.strip().lower()
    
    # Mặc định họ tên
    full_name = data.full_name or email.split("@")[0].capitalize()

    # Kiểm tra xem email đã tồn tại trong DB local chưa
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email hoặc số điện thoại '{email}' đã được đăng ký trong hệ thống."
        )

    firebase_uid = None
    
    # 2. Cố gắng tạo tài khoản trên Firebase
    try:
        # Nếu Firebase SDK chưa được cấu hình hoặc bị lỗi, khối try này sẽ nhảy sang except
        user_record = auth.create_user(
            email=email,
            password=data.password,
            display_name=full_name
        )
        firebase_uid = user_record.uid
        print(f"[IDENTITY] Đăng ký thành công trên Firebase Auth. UID: {firebase_uid}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Đăng ký tài khoản trên Firebase Auth thất bại: {str(e)}"
        )

    # 3. Tạo tài khoản trong Database local
    db_user = User(
        firebase_uid=firebase_uid,
        email=email,
        full_name=full_name,
        avatar_url=data.avatar_url,
        role=data.role or "reviewer",
        meta_data={"phone_number": data.phone_number} if data.phone_number else None
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        # Nếu đã tạo trên Firebase mà lưu DB local lỗi, ta nên dọn dẹp Firebase (trong môi trường thực tế)
        # Ở đây ta báo lỗi hệ thống
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu thông tin người dùng vào database local: {str(e)}"
        )


def login_user(db: Session, data: LoginRequest) -> dict:
    """
    Đăng nhập người dùng.
    - Nếu có cấu hình FIREBASE_WEB_API_KEY, thực hiện xác thực chính thức qua Firebase REST API.
    - Nếu không cấu hình, tự động chạy chế độ Mock/Local login dựa trên DB local.
    """
    # 1. Xác định username (Email hoặc Số điện thoại)
    username = data.username or data.email or data.phone_number
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng nhập Email hoặc Số điện thoại."
        )
    
    username = username.strip().lower()
    
    # Chuẩn hóa nếu user nhập Số điện thoại thô
    if username.isdigit():
        username = f"{username}@foodspot.local"

    # Kiểm tra xem tài khoản có tồn tại trong cơ sở dữ liệu hay không
    db_user = db.query(User).filter(User.email == username).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại."
        )

    # 2. Kiểm tra cấu hình Firebase Web API Key hoặc chế độ phát triển (Mock)
    if settings.ENV == "development":
        # Cho phép đăng nhập bằng tài khoản nội bộ bằng mật khẩu "password" hoặc "admin123"
        if data.password in ("password", "admin123"):
            mock_token = f"mock_token_{db_user.firebase_uid}"
            print(f"[IDENTITY] [DEV MOCK] Đăng nhập thành công tài khoản mock: {username}")
            return {
                "access_token": mock_token,
                "refresh_token": "mock_refresh_token",
                "user": db_user
            }

    api_key = settings.FIREBASE_WEB_API_KEY
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cấu hình FIREBASE_WEB_API_KEY bị thiếu. Không thể đăng nhập."
        )
        
    # --- LUỒNG XÁC THỰC CHÍNH THỨC QUA FIREBASE ---
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps({
        "email": username,
        "password": data.password,
        "returnSecureToken": True
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        # Đặt timeout=5 giây để tránh bị đơ/loop vô tận khi mạng gặp sự cố
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            id_token = res_json.get("idToken")
            local_id = res_json.get("localId") # firebase_uid
            
            # Tìm user tương ứng trong DB local
            db_user = db.query(User).filter(User.firebase_uid == local_id).first()
            if not db_user:
                # Tìm kiếm theo email xem đã tồn tại chưa để liên kết tài khoản
                db_user = db.query(User).filter(User.email == username).first()
                if db_user:
                    db_user.firebase_uid = local_id
                    db.commit()
                    db.refresh(db_user)
                    print(f"[IDENTITY] Đã liên kết tài khoản email '{username}' sẵn có với firebase_uid '{local_id}'.")
                else:
                    # Trường hợp hy hữu: có trên Firebase nhưng local chưa có -> tự động đồng bộ (auto-provision)
                    db_user = User(
                        firebase_uid=local_id,
                        email=username,
                        full_name=res_json.get("displayName") or username.split("@")[0].capitalize(),
                        role="reviewer"
                    )
                    db.add(db_user)
                    db.commit()
                    db.refresh(db_user)
                    print(f"[IDENTITY] Tự động đồng bộ tài khoản sau khi đăng nhập thành công. UID: {local_id}")
            
            return {
                "access_token": id_token,
                "refresh_token": res_json.get("refreshToken"),
                "user": db_user
            }
            
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_content)
            error_msg = error_json.get("error", {}).get("message", "")
        except Exception:
            error_msg = ""
        
        # Phân tích một số lỗi phổ biến của Firebase
        if "EMAIL_NOT_FOUND" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản không tồn tại."
            )
        elif "INVALID_PASSWORD" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mật khẩu không chính xác."
            )
        elif "INVALID_LOGIN_CREDENTIALS" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email/Số điện thoại hoặc mật khẩu không chính xác."
            )
        elif "USER_DISABLED" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản này đã bị tạm khóa."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Xác thực qua Firebase thất bại: {error_msg or error_content}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Kết nối tới Firebase REST API thất bại: {str(e)}"
        )


def get_user_profile(db: Session, user_id: int, current_user_id: Optional[int] = None) -> UserProfileResponse:
    # 1. Tìm user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Người dùng với ID {user_id} không tồn tại."
        )

    # 2. Truy vấn danh sách video review của user này
    user_videos = db.query(Video).filter(Video.reviewer_id == user_id).order_by(Video.created_at.desc()).all()

    # 3. Phân tích meta_data để lấy bio
    meta = user.meta_data or {}
    bio = meta.get("bio", "Blogger ẩm thực đầy nhiệt huyết.")
    
    # Tính số lượt follow thực tế từ database
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == user_id).count()
    following_count = db.query(UserFollow).filter(UserFollow.follower_id == user_id).count()
    
    # Kiểm tra trạng thái đang theo dõi của user hiện tại
    is_following = False
    if current_user_id and current_user_id != user_id:
        is_following = db.query(UserFollow).filter(
            UserFollow.follower_id == current_user_id,
            UserFollow.following_id == user_id
        ).first() is not None
        
    # 4. Tính toán likes nhận được
    likes_received = sum(video.likes_count for video in user_videos)

    # 5. Lấy danh sách video đã thích từ bảng Likes bằng JOIN
    from backend.core.all_models import Like
    liked_videos = db.query(Video).join(Like, Like.video_id == Video.id).filter(Like.user_id == user_id).all()

    # 6. Lấy danh sách video đã lưu (Lấy ngẫu nhiên vài video từ người khác để hiển thị)
    saved_videos = db.query(Video).filter(Video.reviewer_id != user_id).limit(4).all()
    saved_count = len(saved_videos)

    # 7. Lấy danh sách video đã ẩn từ bảng HiddenVideo bằng JOIN
    hidden_videos = db.query(Video).join(HiddenVideo, HiddenVideo.video_id == Video.id).filter(HiddenVideo.user_id == user_id).all()

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role=user.role,
        bio=bio,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        posts_count=len(user_videos),
        saved_count=saved_count,
        likes_received_count=likes_received,
        videos=user_videos,
        saved_videos=saved_videos,
        liked_videos=liked_videos,
        hidden_videos=hidden_videos
    )

def update_user_profile(db: Session, user_id: int, data: UserProfileUpdateRequest) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại."
        )
        
    if data.full_name is not None:
        user.full_name = data.full_name.strip()
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url.strip()
    if data.bio is not None:
        meta = user.meta_data or {}
        meta["bio"] = data.bio.strip()
        user.meta_data = meta
        
    try:
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật hồ sơ: {str(e)}"
        )


def login_google_user(db: Session, data: GoogleLoginRequest) -> dict:
    """
    Xác thực Google ID Token gửi lên từ Frontend bằng Firebase Admin SDK.
    Tự động tạo mới tài khoản nếu chưa tồn tại (Auto-provision).
    """
    try:
        decoded_token = auth.verify_id_token(data.id_token, clock_skew_seconds=10)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Xác thực Google ID Token thất bại: {str(e)}"
        )
        
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không chứa Firebase UID hợp lệ."
        )
        
    # Tìm kiếm user trong local database bằng firebase_uid
    user = db.query(User).filter(User.firebase_uid == uid).first()
    
    # Tự động tạo mới hoặc cập nhật nếu chưa có
    if not user:
        email = decoded_token.get("email")
        if email:
            # Tìm theo email để liên kết nếu đã đăng ký email/password trước đó
            user = db.query(User).filter(User.email == email).first()
            
        if user:
            user.firebase_uid = uid
            db.commit()
            db.refresh(user)
            print(f"[IDENTITY] Đã liên kết tài khoản email '{email}' với google firebase_uid '{uid}'")
        else:
            # Tạo mới hoàn toàn
            user = User(
                firebase_uid=uid,
                email=email,
                full_name=decoded_token.get("name", email.split("@")[0] if email else "Blogger Google"),
                avatar_url=decoded_token.get("picture"),
                role="reviewer"
            )
            try:
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[IDENTITY] Tự động đồng bộ tài khoản Google mới. UID: {uid}")
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Lỗi khi lưu thông tin người dùng Google vào local database: {str(e)}"
                )
                
    return {
        "access_token": data.id_token,
        "token_type": "bearer",
        "user": user
    }

def delete_user_account(db: Session, user: User):
    """
    Xóa tài khoản người dùng và thực hiện cascade delete toàn bộ dữ liệu liên quan
    để tránh vi phạm ràng buộc khoá ngoại (Merchants, Menus, Campaigns, Videos, Likes, Comments, v.v.).
    """
    from backend.core.all_models import Merchant, Video, UserFollow, HiddenVideo, Like, Comment, CommentLike, UserShare

    # 1. Với các quán ăn (Merchants) của người dùng:
    # Set tagged_merchant_id = None cho các video gắn thẻ các quán này
    merchant_ids = [m.id for m in user.merchants]
    if merchant_ids:
        db.query(Video).filter(Video.tagged_merchant_id.in_(merchant_ids)).update({Video.tagged_merchant_id: None}, synchronize_session=False)

    # 2. Với các bài viết (Videos) của người dùng:
    # Set reup_from_id = None cho bất kỳ video nào reup từ video của người dùng này
    user_video_ids = [v.id for v in user.videos]
    if user_video_ids:
        db.query(Video).filter(Video.reup_from_id.in_(user_video_ids)).update({Video.reup_from_id: None}, synchronize_session=False)

    # 3. Xóa các bản ghi liên kết trung gian
    db.query(HiddenVideo).filter(HiddenVideo.user_id == user.id).delete(synchronize_session=False)
    db.query(UserFollow).filter((UserFollow.follower_id == user.id) | (UserFollow.following_id == user.id)).delete(synchronize_session=False)
    db.query(UserShare).filter(UserShare.user_id == user.id).delete(synchronize_session=False)

    # 4. Xóa các bài viết của người dùng (nó sẽ cascade xóa likes, comments tương ứng)
    for video in user.videos:
        db.delete(video)

    # 5. Xóa các quán ăn của người dùng (nó sẽ cascade xóa menus, campaigns tương ứng)
    for merchant in user.merchants:
        db.delete(merchant)

    # 6. Xóa khỏi Firebase Auth nếu có UID
    if user.firebase_uid:
        try:
            auth.delete_user(user.firebase_uid)
            print(f"[IDENTITY] Đã xóa user {user.email} khỏi Firebase Auth.")
        except Exception as e:
            print(f"[IDENTITY] Cảnh báo: Không thể xóa user khỏi Firebase Auth: {e}")

    # 7. Cuối cùng, xóa chính user đó
    db.delete(user)
    db.commit()

    return {"status": "success", "message": "Tài khoản và dữ liệu liên quan đã được xóa sạch."}
