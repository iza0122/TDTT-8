import sys
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Union, Optional
from pydantic import field_validator, model_validator
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

    @field_validator("FIREBASE_CREDENTIALS", mode="before")
    @classmethod
    def parse_firebase_credentials(cls, v: Any) -> Dict[str, Any]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return {}
            try:
                parsed = json.loads(v)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass
            return {}
        elif isinstance(v, dict):
            return v
        return {}
        
    FIREBASE_WEB_API_KEY: str = ""

    @model_validator(mode="after")
    def load_firebase_credentials(self) -> "Settings":
        # --- ƯU TIÊN 1: Đọc từ biến GOOGLE_APPLICATION_CREDENTIALS_JSON ---
        # Lấy từ hệ thống env hoặc từ file .env được pydantic load vào GOOGLE_APPLICATION_CREDENTIALS_JSON
        json_str = self.GOOGLE_APPLICATION_CREDENTIALS_JSON or os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if json_str and json_str.strip():
            try:
                self.FIREBASE_CREDENTIALS = json.loads(json_str)
                return self
            except json.JSONDecodeError:
                print("[FIREBASE] Chuỗi GOOGLE_APPLICATION_CREDENTIALS_JSON lỗi định dạng JSON!")

        # --- ƯU TIÊN 2: Tìm đọc file vật lý theo đường dẫn chỉ định ---
        config_path_str = self.FIREBASE_CONFIG_PATH or os.getenv("FIREBASE_CONFIG_PATH", str(CONFIG_DIR / "firebase_config.json"))
        file_path = Path(config_path_str)

        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    self.FIREBASE_CREDENTIALS = json.loads(f.read())
                    print(f"[FIREBASE] Đã nạp thành công file cấu hình từ: config/{file_path.name}")
                    return self
            except Exception as e:
                print(f"[FIREBASE] Lỗi khi đọc file cấu hình tại {file_path}: {e}")
        else:
            print(f"[FIREBASE] ⚠️ CẢNH BÁO: Không thấy file cấu hình tại: {file_path.absolute()}")
            print("[FIREBASE] Vui lòng bỏ file 'firebase_config.json' hoặc cấu hình biến môi trường JSON.")

        return self

    # Đọc file .env từ thư mục config/ tập trung nếu có
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()