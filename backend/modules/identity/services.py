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
        if not settings.ENABLE_MOCK:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đăng ký tài khoản trên Firebase Auth thất bại và chế độ Mock đang tắt: {str(e)}"
            )
        print(f"[IDENTITY] Cảnh báo: Không thể tạo tài khoản trên Firebase Auth ({str(e)}).")
        print("[IDENTITY] Tự động kích hoạt cơ chế Local Mock Fallback cho môi trường phát triển.")
        # Chế độ mock local: Sử dụng UUID giả dựa trên email
        firebase_uid = f"mock_{email.replace('@', '_').replace('.', '_')}"

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
    
    if not api_key and not settings.ENABLE_MOCK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cấu hình FIREBASE_WEB_API_KEY bị thiếu và chế độ Mock đang tắt. Không thể đăng nhập."
        )
        
    if api_key:
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
            if not settings.ENABLE_MOCK:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Kết nối tới Firebase REST API thất bại và chế độ Mock đang tắt: {str(e)}"
                )
            print(f"[IDENTITY] Kết nối Firebase REST API thất bại ({str(e)}). Chuyển sang luồng Mock Fallback.")
            # Nếu kết nối internet lỗi, tự động lùi về Mock
            pass

    # --- LUỒNG MOCK FALLBACK (DEVELOPMENT) ---
    if not settings.ENABLE_MOCK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đăng nhập qua Firebase thất bại và chế độ Mock đang tắt."
        )
    print("[IDENTITY] Chạy chế độ Mock Login / Bỏ qua xác thực Firebase mật khẩu.")
    # Tìm kiếm user trong DB local
    db_user = db.query(User).filter(User.email == username).first()
    if not db_user:
        # Nếu là số điện thoại và không tìm thấy, thử tìm theo meta_data (phone_number)
        db_user = db.query(User).filter(User.meta_data["phone_number"].as_string() == username.split("@")[0]).first()
        
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại trên hệ thống local. Vui lòng đăng ký trước."
        )
    
    # Để đơn giản trong mock, ta chấp nhận mọi mật khẩu dài từ 6 ký tự
    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu thử nghiệm phải từ 6 ký tự trở lên."
        )
        
    # Tạo mock token dựa trên firebase_uid của user
    mock_token = f"mock_token_{db_user.firebase_uid}"
    
    return {
        "access_token": mock_token,
        "user": db_user
    }
