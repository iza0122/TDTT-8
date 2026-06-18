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

# Tự động kiểm tra và thêm cột mới nếu chưa có (Hỗ trợ tự nâng cấp cấu trúc cho cả Postgres trên Vercel và SQLite local)
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN shares_count INTEGER DEFAULT 0 NOT NULL"))
        print("[MIGRATION] Đã tự động thêm cột shares_count vào bảng videos.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN reup_from_id INTEGER REFERENCES videos(id)"))
        print("[MIGRATION] Đã tự động thêm cột reup_from_id vào bảng videos.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN comments_count INTEGER DEFAULT 0 NOT NULL"))
        # Cập nhật số lượng bình luận hiện có cho các video đã tồn tại
        conn.execute(text("""
            UPDATE videos 
            SET comments_count = (
                SELECT COUNT(*) FROM comments WHERE comments.video_id = videos.id
            )
        """))
        print("[MIGRATION] Đã tự động thêm cột comments_count vào bảng videos và đồng bộ dữ liệu.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN rating INTEGER DEFAULT 5 NOT NULL"))
        print("[MIGRATION] Đã tự động thêm cột rating vào bảng videos.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN merchant_response TEXT"))
        print("[MIGRATION] Đã tự động thêm cột merchant_response vào bảng videos.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN description TEXT"))
        print("[MIGRATION] Đã tự động thêm cột description vào bảng campaigns.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN start_date TIMESTAMP"))
        print("[MIGRATION] Đã tự động thêm cột start_date vào bảng campaigns.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN end_date TIMESTAMP"))
        print("[MIGRATION] Đã tự động thêm cột end_date vào bảng campaigns.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE menus ADD COLUMN category VARCHAR DEFAULT 'Món ăn'"))
        print("[MIGRATION] Đã tự động thêm cột category vào bảng menus.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE merchants ADD COLUMN slogan VARCHAR"))
        print("[MIGRATION] Đã tự động thêm cột slogan vào bảng merchants.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE merchants ADD COLUMN hours VARCHAR"))
        print("[MIGRATION] Đã tự động thêm cột hours vào bảng merchants.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE merchants ADD COLUMN phone VARCHAR"))
        print("[MIGRATION] Đã tự động thêm cột phone vào bảng merchants.")
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE merchants ADD COLUMN email VARCHAR"))
        print("[MIGRATION] Đã tự động thêm cột email vào bảng merchants.")
except Exception:
    pass

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
# Backend luôn sử dụng prefix /api để đồng nhất giữa môi trường Local và Vercel.
prefix = settings.API_V1_STR

app.include_router(api_router, prefix=prefix)

# Đăng ký các route root hỗ trợ cả dạng có prefix /api và không có prefix
@app.get("/", tags=["General"])
@app.get(f"{prefix}", tags=["General"])
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Đăng ký các route health check hỗ trợ cả dạng có prefix /api và không có prefix
@app.get("/health", tags=["General"])
@app.get(f"{prefix}/health", tags=["General"])
def health_check():
    return {"status": "ok", "environment": "Local/Vercel"}

@app.on_event("startup")
async def startup_event():
    import asyncio
    from backend.core.tasks import run_periodic_cleanup
    asyncio.create_task(run_periodic_cleanup())
