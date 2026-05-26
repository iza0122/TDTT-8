import json
import os
from pathlib import Path
from typing import Any, Dict, List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# 1. Định vị chuẩn xác thư mục config/ tập trung
# Thư mục chứa file này: backend/core/
CORE_DIR = Path(__file__).resolve().parent 
# Nhảy lên 1 cấp (backend/) rồi đi vào thư mục config/
CONFIG_DIR = CORE_DIR.parent / "config"

ENV_FILE_PATH = CONFIG_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Food Review API"
    API_V1_STR: str = "/api"
    ENV: str = "development"
    ENABLE_MOCK: bool = True
    ENABLE_DB_FALLBACK: bool = True

    
    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = []

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except json.JSONDecodeError:
                    pass
            return [item.strip() for item in v.split(",") if item.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if item]
        return []

    # URL kết nối Cơ sở dữ liệu PostgreSQL
    DATABASE_URL: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fallback_to_sqlite(cls, v: str, info: Any) -> str:
        if not v or not v.strip():
            enable_fallback = info.data.get("ENABLE_DB_FALLBACK", True)
            if isinstance(enable_fallback, str):
                enable_fallback = enable_fallback.strip().lower() in ("true", "1", "yes", "on")
            if not enable_fallback:
                raise ValueError(
                    "Không tìm thấy DATABASE_URL trong .env và cơ chế tự động fallback về SQLite đang tắt (ENABLE_DB_FALLBACK=False)."
                )
            print("[DATABASE] Không tìm thấy DATABASE_URL trong .env! Tự động lùi về xài SQLite local.")
            return f"sqlite:///{str(CORE_DIR.parent / 'food_review.db')}"
        return v

    # ==========================================
    # CẤU HÌNH CLOUDFLARE R2 MỚI THÊM
    # ==========================================
    CLOUDFLARE_R2_ACCOUNT_ID: str = ""
    CLOUDFLARE_R2_ACCESS_KEY_ID: str = ""
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_BUCKET_NAME: str = ""
    CLOUDFLARE_R2_PUBLIC_URL: str = ""

    # ==========================================
    # CẤU HÌNH FIREBASE / GOOGLE JSON
    # ==========================================
    FIREBASE_CONFIG_PATH: str = str(CONFIG_DIR / "firebase_config.json")
    
    # Khai báo trường nhận chuỗi JSON từ Vercel
    GOOGLE_APPLICATION_CREDENTIALS_JSON: Optional[str] = None
    
    FIREBASE_CREDENTIALS: Dict[str, Any] = {}
    FIREBASE_WEB_API_KEY: str = ""

    @field_validator("FIREBASE_CREDENTIALS", mode="before")
    @classmethod
    def load_firebase_credentials(cls, v: Any, info: Any) -> Dict[str, Any]:
        # --- ƯU TIÊN 1: Đọc từ biến GOOGLE_APPLICATION_CREDENTIALS_JSON của Vercel ---
        # (Lấy thẳng từ hệ thống env hoặc giá trị đã nạp vào class qua .env local)
        vercel_env_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if vercel_env_json and vercel_env_json.strip():
            try:
                return json.loads(vercel_env_json)
            except json.JSONDecodeError:
                print("[FIREBASE] Chuỗi GOOGLE_APPLICATION_CREDENTIALS_JSON trên Vercel lỗi định dạng JSON!")

        # --- ƯU TIÊN 2: Đọc chuỗi JSON cấu hình trực tiếp từ biến nội bộ cũ ---
        if isinstance(v, str) and v.strip():
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                print("[FIREBASE] Chuỗi FIREBASE_CREDENTIALS trong .env không hợp lệ dạng JSON!")

        # --- ƯU TIÊN 3: Tìm đọc file vật lý theo đường dẫn chỉ định (Dành cho Local) ---
        config_path_str = os.getenv("FIREBASE_CONFIG_PATH", str(CONFIG_DIR / "firebase_config.json"))
        file_path = Path(config_path_str)

        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    print(f"[FIREBASE] Đã nạp thành công file cấu hình từ: config/{file_path.name}")
                    return json.loads(f.read())
            except Exception as e:
                print(f"[FIREBASE] Lỗi khi đọc file cấu hình tại {file_path}: {e}")
        else:
            # Chỉ cảnh báo nếu thực sự không tìm thấy bất kỳ cấu hình chuỗi JSON nào ở các bước trên
            if not vercel_env_json:
                print(f"[FIREBASE] ⚠️ CẢNH BÁO: Không thấy file cấu hình tại: {file_path.absolute()}")
                print("[FIREBASE] Vui lòng bỏ file 'firebase_config.json' hoặc cấu hình biến môi trường JSON.")

        return {}

    # Đọc file .env từ thư mục config/ tập trung nếu có
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()