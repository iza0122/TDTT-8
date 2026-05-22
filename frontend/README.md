# 🍔 Food Review Frontend - Feature-Driven Web Application

Ứng dụng giao diện (Frontend) của hệ thống Mạng xã hội & Khám phá ẩm thực **Food Review**, được xây dựng trên framework **React (Vite)** và quy hoạch theo mô hình **Feature-Driven Architecture** (Cấu trúc hướng tính năng). 

Mô hình này bóc tách toàn bộ mã nguồn giao diện và logic theo từng Domain nghiệp vụ cụ thể, giúp tăng tính độc lập giữa các module, đồng bộ 1:1 với cấu trúc Backend Modular Monolith và tối ưu hóa tối đa năng suất khi phát triển song song theo nhóm.

---

## 🏗️ Cấu Trúc Mã Nguồn (Project Structure)

```text
frontend/
├── index.html              # File HTML gốc của ứng dụng
├── vite.config.ts          # Cấu hình đóng gói và biên dịch hệ thống (Vite)
├── tailwind.config.js      # Cấu hình mở rộng và tùy chỉnh giao diện Tailwind CSS
├── package.json            # Quản lý các thư viện phụ thuộc và lệnh script
└── src/
    ├── main.tsx            # Điểm khởi chạy chính (Entry point) của React
    │
    ├── assets/             # Quản lý tài nguyên tĩnh bóc tách từ Figma
    │   ├── icons/          # Các file định dạng vector .svg (Trái tim, kính lúp, ghim vị trí...)
    │   └── images/         # Ảnh nền, logo hệ thống, banner, avatar mặc định
    │
    ├── styles/             # Cấu hình phong cách và giao diện toàn cục
    │   ├── fonts.css       # Cấu hình phông chữ hệ thống
    │   ├── globals.css     # CSS nền tảng áp dụng cho toàn bộ website
    │   └── theme.css       # Định nghĩa bảng mã màu chủ đạo từ Design Tokens (Figma)
    │
    └── app/                # LUỒNG LOGIC VÀ ĐIỀU HƯỚNG CỦA ỨNG DỤNG
        ├── App.tsx         # Nơi bọc các Provider hệ thống (AuthContext, Theme, QueryClient)
        ├── routes.ts       # Quản lý danh sách đường dẫn tập trung sử dụng React Router v7
        │
        ├── core/           # HỆ THỐNG LÕI (CORE SYSTEM) - Cấu hình cấu trúc nền tảng
        │   ├── api/
        │   │   └── axios-client.ts # Cấu hình Axios Client, tự động ghim JWT Bearer Token vào Header
        │   └── utils/
        │       └── tokens.ts       # Tiện ích helper quản lý Access Token trong LocalStorage
        │
        ├── common/         # THÀNH PHẦN DÙNG CHUNG (SHARED SYSTEM)
        │   ├── components/
        │   │   └── Layout.tsx      # Khung sườn cố định (Sidebar + Header tìm kiếm + Footer)
        │   ├── ui/                 # Các component nguyên tử dùng chung từ thư viện Shadcn UI
        │   │   ├── button.tsx
        │   │   ├── input.tsx
        │   │   └── dialog.tsx
        │   └── figma/              # Các UI Kit mẫu dùng để đối chiếu trực tiếp từ bản vẽ thiết kế
        │
        └── features/       # CHIẾN TRƯỜNG CHÍNH - PHÂN CHIA THEO 4 DOMAIN TÍNH NĂNG
            ├── identity/       # [BE1 Sync] Đăng nhập, Đăng ký, Quản lý Hồ sơ cá nhân
            │   ├── pages/
            │   │   ├── AuthPage.tsx    # Trang Đăng nhập / Đăng ký hệ thống
            │   │   └── ProfilePage.tsx # Trang cá nhân hiển thị thông tin bài đăng
            │   ├── components/
            │   │   ├── LoginForm.tsx
            │   │   └── ProtectedRoute.tsx # Lớp bọc bảo vệ quyền truy cập các trang nội bộ
            │   └── identity-services.ts   # Xử lý gọi API Authentication (login, register)
            │
            ├── merchant/       # [BE2 Sync] Danh sách Cửa hàng & Thực đơn món ăn
            │   ├── pages/
            │   │   ├── MerchantListPage.tsx # Trang hiển thị toàn bộ cửa hàng, quán ăn
            │   │   └── MerchantDetailPage.tsx # Trang chi tiết thông tin và Menu của quán
            │   ├── components/
            │   │   ├── MerchantCard.tsx # Thẻ hiển thị nhanh quán ăn (Ảnh, tên, khoảng cách...)
            │   │   └── MenuList.tsx     # Danh sách món ăn thuộc cửa hàng
            │   └── merchant-services.ts # Xử lý gọi API lấy thông tin quán và thực đơn
            │
            ├── content/        # [BE3 Sync] Luồng bài viết & Trình phát Video tương tác ngắn
            │   ├── pages/
            │   │   ├── HomePage.tsx   # Trang chủ hiển thị dòng thời gian bài viết (Feed)
            │   │   └── VideosPage.tsx # Màn hình trải nghiệm lướt video ngắn (TikTok-like UI)
            │   ├── components/
            │   │   ├── VideoPlayer.tsx # Trình điều khiển và phát video ngắn bắt sự kiện cuộn
            │   │   ├── CommentSection.tsx # Khung hiển thị tương tác, bình luận
            │   │   └── HeartButton.tsx    # Xử lý logic thả tim bài viết/video
            │   └── content-services.ts    # Xử lý tương tác thả tim, bình luận, trộn feed
            │
            └── discovery/      # [BE4 Sync] Bản đồ không gian & Định vị tìm kiếm theo bán kính
                ├── pages/
                │   └── MapPage.tsx    # Giao diện bản đồ lớn kết hợp tìm kiếm vị trí thực tế
                ├── components/
                │   ├── MapView.tsx    # Component tích hợp nền tảng bản đồ (Google Maps / Mapbox)
                │   ├── MapMarker.tsx  # Xử lý hiển thị ghim tọa độ của các nhà hàng
                │   └── SearchBar.tsx  # Thanh công cụ tìm kiếm và lọc nâng cao theo bán kính
                └── discovery-services.ts # Xử lý truyền tọa độ GPS và lọc không gian địa lý
```
  # Social Media Restaurant Finder

  This is a code bundle for Social Media Restaurant Finder. The original project is available at https://www.figma.com/design/h8LFF0XnB4UMBxSbaGrBTL/Social-Media-Restaurant-Finder.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  