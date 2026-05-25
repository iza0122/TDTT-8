import os
import sys

# Thêm thư mục cha vào sys.path để hỗ trợ chạy từ cả thư mục backend và thư mục gốc của dự án
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

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

# Mount thư mục static phục vụ file upload ở môi trường local development
static_dir = os.path.join(current_dir, "static")
os.makedirs(os.path.join(static_dir, "uploads", "videos"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "uploads", "menus"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Cấu hình CORS để frontend có thể gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên giới hạn domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký Router tổng dưới prefix chung (ví dụ: /api)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get(settings.API_V1_STR, tags=["General"])
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get(f"{settings.API_V1_STR}/health", tags=["General"])
def health_check():
    return {"status": "ok", "environment": "Local/Vercel"}
