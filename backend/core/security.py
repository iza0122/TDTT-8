import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from backend.core.database import get_db
from backend.core.all_models import User
from backend.core.config import settings

security_scheme = HTTPBearer(auto_error=False)


# Khởi tạo ứng dụng Firebase duy nhất một lần
if not firebase_admin._apps:
    try:
        if settings.FIREBASE_CREDENTIALS:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred)
            print("[FIREBASE] Đã khởi tạo Firebase Admin SDK thành công bằng service account.")
        else:
            firebase_admin.initialize_app()
            print("[FIREBASE] Đã khởi tạo Firebase Admin SDK bằng Default Credentials.")
    except Exception as e:
        print(f"[FIREBASE] Cảnh báo: Không thể khởi tạo Firebase Admin SDK: {e}")
        print("[FIREBASE] Vui lòng cấu hình biến môi trường hoặc file config để sử dụng chế độ chính thức.")

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực người dùng hiện tại thông qua Firebase ID Token.
    Chỉ cho phép truy cập nếu Token hợp lệ và khớp với cấu hình Firebase.
    Tự động đồng bộ (auto-provision) thông tin người dùng vào DB local nếu là lần đầu tiên đăng nhập.
    """
    print("[SECURITY DEBUG] Headers:", dict(request.headers))
    print("[SECURITY DEBUG] Credentials:", credentials)
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu hoặc không hợp lệ tiêu đề xác thực (Authorization Header). Vui lòng nhập token Bearer."
        )
    token = credentials.credentials
    
    # Ở chế độ phát triển, cho phép bỏ qua xác thực Firebase đối với token giả lập (Mock)
    if settings.ENV == "development" and token.startswith("mock_token_"):
        uid = token.replace("mock_token_", "")
        user = db.query(User).filter(User.firebase_uid == uid).first()
        if not user:
            user = db.query(User).filter(User.email == uid).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Không tìm thấy tài khoản cho token Mock này."
            )
        return user

    # Xác thực Firebase ID Token chính thức bằng Firebase Admin SDK
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)
    except Exception as e:
        # Kiểm tra lỗi hết hạn token để trả về thông báo thân thiện
        err_msg = str(e).lower()
        if "expired" in err_msg or "token expired" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token đã hết hạn, vui lòng đăng nhập lại."
            )
        # Các lỗi khác giữ nguyên thông báo gốc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Xác thực Firebase Token thất bại: {str(e)}"
        )
        
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase Token không chứa thông tin UID người dùng hợp lệ."
        )
        
    # Tìm kiếm người dùng trong cơ sở dữ liệu Postgres local bằng firebase_uid
    user = db.query(User).filter(User.firebase_uid == uid).first()
    
    # Tự động tạo mới tài khoản nếu chưa tồn tại
    if not user:
        email = decoded_token.get("email")
        if email:
            # Tìm kiếm theo email để liên kết tài khoản nếu có sẵn
            user = db.query(User).filter(User.email == email).first()
            
        if user:
            # Cập nhật firebase_uid mới cho tài khoản email sẵn có
            user.firebase_uid = uid
            try:
                db.commit()
                db.refresh(user)
                print(f"[SECURITY] Đã cập nhật firebase_uid '{uid}' cho tài khoản email '{email}' sẵn có.")
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Lỗi khi cập nhật thông tin tài khoản Firebase UID: {str(e)}"
                )
        else:
            # Tạo mới hoàn toàn nếu cả UID và Email đều chưa tồn tại
            user = User(
                firebase_uid=uid,
                email=email,
                full_name=decoded_token.get("name", email.split("@")[0] if email else "User"),
                avatar_url=decoded_token.get("picture"),
                role="reviewer"  # Vai trò mặc định cho tài khoản mới
            )
            try:
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[SECURITY] Đã tự động tạo tài khoản mới cho Firebase UID: {uid}")
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Lỗi khi đồng bộ tài khoản người dùng vào hệ thống: {str(e)}"
                )
            
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        # Quyền tối cao của Admin hệ thống
        if current_user.role == "admin":
            return current_user
            
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối. Vai trò '{current_user.role}' không được phép thực hiện hành động này. Yêu cầu: {self.allowed_roles}"
            )
        return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Xác thực tuỳ chọn người dùng.
    Trả về User nếu token hợp lệ, ngược lại trả về None mà không chặn request (no 401).
    """
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials
    
    if settings.ENV == "development" and token.startswith("mock_token_"):
        uid = token.replace("mock_token_", "")
        return db.query(User).filter(User.firebase_uid == uid).first() or db.query(User).filter(User.email == uid).first()

    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)
        uid = decoded_token.get("uid")
        if uid:
            return db.query(User).filter(User.firebase_uid == uid).first()
    except Exception as e:
        # Nếu token đã hết hạn, trả về None để cho phép xử lý tùy chỉnh ở phía client
        err_msg = str(e).lower()
        if "expired" in err_msg or "token expired" in err_msg:
            return None
        # Các lỗi khác bỏ qua để trả về None (không gây 500)
        pass
    return None
