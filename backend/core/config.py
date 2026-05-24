import json
import os
from pathlib import Path
from typing import Any, Dict, List, Union
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
    def fallback_to_sqlite(cls, v: str) -> str:
        if not v or not v.strip():
            print("[DATABASE] Không tìm thấy DATABASE_URL trong .env! Tự động lùi về xài SQLite local.")
            # Đẩy file db ra ngoài thư mục gốc backend cho dễ nhìn, không làm bẩn thư mục config
            return f"sqlite:///{str(CORE_DIR.parent / 'food_review.db')}"
        return v

    # ==========================================
    # CẤU HÌNH ĐƯỜNG DẪN FIREBASE MỚI
    # ==========================================
    
    # Mặc định tìm file firebase_config.json ngay trong thư mục config/ mới tạo
    FIREBASE_CONFIG_PATH: str = str(CONFIG_DIR / "firebase_config.json")
    
    FIREBASE_CREDENTIALS: Dict[str, Any] = {}

    @field_validator("FIREBASE_CREDENTIALS", mode="before")
    @classmethod
    def load_firebase_credentials(cls, v: Any, info: Any) -> Dict[str, Any]:
        # Ưu tiên 1: Đọc chuỗi JSON cấu hình trực tiếp từ biến môi trường trong .env
        if isinstance(v, str) and v.strip():
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                print("[FIREBASE] Chuỗi FIREBASE_CREDENTIALS trong .env không hợp lệ dạng JSON!")

        # Ưu tiên 2: Tìm đọc file vật lý theo đường dẫn chỉ định
        # Lấy giá trị cấu hình từ file .env, nếu không có thì lấy mặc định trong thư mục config/
        config_path_str = os.getenv("FIREBASE_CONFIG_PATH", str(CONFIG_DIR / "firebase_config.json"))
        file_path = Path(config_path_str)

        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    print(f"[FIREBASE] Đã nạp thành công file cấu hình: config/{file_path.name}")
                    return json.loads(f.read())
            except Exception as e:
                print(f"[FIREBASE] Lỗi khi đọc file cấu hình tại {file_path}: {e}")
        else:
            print(f"[FIREBASE] ⚠️ CẢNH BÁO: Không thấy file cấu hình tại: {file_path.absolute()}")
            print("[FIREBASE] Vui lòng bỏ file 'firebase_config.json' vào thư mục 'config/'")

        return {}

    # Đọc file .env từ thư mục config/ tập trung
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()