import json
import urllib.request
import urllib.error
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from firebase_admin import auth

from backend.core.config import settings
from backend.core.all_models import User
from backend.modules.identity.schemas import RegisterRequest, LoginRequest

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
        role="reviewer",
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

    # 2. Kiểm tra cấu hình Firebase Web API Key
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
        with urllib.request.urlopen(req) as response:
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
        if "EMAIL_NOT_FOUND" in error_msg or "INVALID_PASSWORD" in error_msg or "INVALID_LOGIN_CREDENTIALS" in error_msg:
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
