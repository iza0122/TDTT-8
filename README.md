# Food Review Application

Dự án Backend cho ứng dụng mạng xã hội và đánh giá ẩm thực (Food Review), được thiết kế theo kiến trúc **Modular Monolith** với khả năng nâng cấp lên Microservices trong tương lai. Hệ thống hỗ trợ lướt video ngắn, gợi ý món ăn theo vị trí địa lý, và hệ thống phân phối quảng cáo tự động.

## 📁 Cấu trúc thư mục (Project Structure)

```text
f:\FR\
├── frontend/                  # (Trống - Chờ code giao diện từ Figma)
└── backend/                   # Core Backend (Python / FastAPI)
    ├── main.py                # Điểm khởi chạy của ứng dụng (Entry point)
    ├── requirements.txt       # File chứa các thư viện cần cài đặt
    ├── core/                  # Chứa cấu hình cốt lõi (Database, Security, Config chung)
    │   ├── __init__.py
    │   ├── exceptions.py
    │   └── security.py
    ├── common/                # Các tiện ích dùng chung cho toàn bộ dự án
    │   ├── __init__.py
    │   ├── pagination.py
    │   └── utils.py
    ├── tests/                 # Thư mục chứa Unit Test & Integration Test
    │   └── __init__.py
    └── modules/               # 4 Module chính (Domains) hoạt động độc lập
        ├── identity/          # (BE1) Xử lý Auth, Role, User Profile
        │   ├── __init__.py
        │   ├── models.py      # Database Models (SQLAlchemy / Motor)
        │   ├── router.py      # Định nghĩa API (Endpoints)
        │   ├── schemas.py     # Pydantic schemas (Validate dữ liệu)
        │   └── services.py    # Business logic
        ├── merchant/          # (BE2) Xử lý Quán ăn, Thực đơn, Thiết lập Quảng cáo
        │   ├── ... (models, router, schemas, services)
        ├── content/           # (BE3) Xử lý Upload Video, Thuật toán trộn Feed (Organic + Ads)
        │   ├── ... (models, router, schemas, services)
        └── search_interact/   # (BE4) Xử lý Tìm kiếm (Elastic), Geo-Search (PostGIS), Queue Tương tác
            └── ... (models, router, schemas, services)
```

## 🛠 Tech Stack (Dự kiến)
- **Framework:** Python / FastAPI
- **Database (SQL):** PostgreSQL + PostGIS (Cho truy vấn không gian / Bản đồ)
- **Database (NoSQL):** MongoDB (Lưu trữ Metadata Video/Comment)
- **Search Engine:** Elasticsearch (Tìm kiếm Text + Đồng bộ CQRS)
- **Message Queue / Cache:** Redis hoặc Celery/RabbitMQ (Xử lý hàng đợi thả tim, comment)

## 🚀 Cách chạy dự án (Getting Started)

*(Đang cập nhật hướng dẫn cài đặt môi trường và Docker)*
