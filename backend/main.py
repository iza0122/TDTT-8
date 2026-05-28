import os
import sys

# Thêm thư mục hiện tại vào sys.path và giả lập package 'backend' khi chạy trên Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Hỗ trợ chạy từ cả thư mục backend và thư mục gốc của dự án
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Nếu chạy trên Vercel với Root Directory là 'backend', thư mục 'backend' cha không tồn tại.
# Ta giả lập module 'backend' trỏ thẳng vào thư mục hiện tại để các import 'from backend.xxx' hoạt động bình thường.
try:
    import backend
except ModuleNotFoundError:
    import types
    backend_mock = types.ModuleType('backend')
    backend_mock.__path__ = [current_dir]
    sys.modules['backend'] = backend_mock

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.core.database import engine, Base
from backend.core import all_models  # Đảm bảo tất cả models đã được import để tự động tạo bảng
from backend.core.config import settings
from backend.modules.router import api_router

# Tự động tạo các bảng cơ sở dữ liệu nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Food Review API",
    description="Hệ thống Backend MVP cho mạng xã hội & Đánh giá ẩm thực Food Review",
    version="1.0.0",
    docs_url=f"{settings.API_V1_STR}/docs",          # Ép về đường dẫn /api/docs
    openapi_url=f"{settings.API_V1_STR}/openapi.json" # Ép về đường dẫn /api/openapi.json
)
# Cấu hình CORS để frontend có thể gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên giới hạn domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký Router tổng dưới prefix chung
# Khi chạy trên Vercel, Vercel đã rewrite /api/(.*) và loại bỏ prefix /api trong path truyền tới ASGI.
# Do đó ta sử dụng prefix rỗng trên Vercel và prefix "/api" ở local.
import os
prefix = "" if os.environ.get("VERCEL") else settings.API_V1_STR

app.include_router(api_router, prefix=prefix)

@app.get(prefix or "/", tags=["General"])
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get(f"{prefix}/health" if prefix else "/health", tags=["General"])
def health_check():
    return {"status": "ok", "environment": "Local/Vercel"}
