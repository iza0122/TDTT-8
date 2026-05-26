import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.all_models import User
from backend.core.config import settings

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
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực người dùng hiện tại thông qua Firebase ID Token.
    Chỉ cho phép truy cập nếu Token hợp lệ và khớp với cấu hình Firebase.
    Tự động đồng bộ (auto-provision) thông tin người dùng vào DB local nếu là lần đầu tiên đăng nhập.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu hoặc không hợp lệ tiêu đề xác thực (Authorization Header). Yêu cầu định dạng 'Bearer <Token>'."
        )
        
    token = authorization.split(" ")[1]
    
    # Hỗ trợ Mock Token trong môi trường phát triển (Development)
    if token.startswith("mock_token_"):
        if not settings.ENABLE_MOCK:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Chế độ Mock Token đang bị tắt. Vui lòng sử dụng Firebase ID Token chính thức."
            )
        uid = token.replace("mock_token_", "")
        user = db.query(User).filter(User.firebase_uid == uid).first()
        if not user:
            # Tự động tạo tài khoản giả lập nếu chưa có
            email = f"{uid}@mock.local" if "@" not in uid else uid
            user = User(
                firebase_uid=uid,
                email=email,
                full_name=uid.split("@")[0].replace("mock_", "").capitalize(),
                avatar_url=None,
                role="reviewer"
            )
            try:
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[SECURITY] Đã tự động tạo tài khoản MOCK cho UID: {uid}")
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Lỗi khi đồng bộ tài khoản Mock: {str(e)}"
                )
        return user
    
    # Xác thực Firebase ID Token chính thức bằng Firebase Admin SDK
    try:
        decoded_token = auth.verify_id_token(token)
    except Exception as e:
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
