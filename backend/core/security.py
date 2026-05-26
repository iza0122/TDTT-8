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
