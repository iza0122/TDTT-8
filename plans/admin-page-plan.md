# Admin Page – Thiết Kế Chức Năng & Khung Giao Diện

> **Dự án:** Food Review App (TDTT-8) – Ứng dụng review đồ ăn dạng short-video (TikTok Food)
> **Tác giả:** Frontend Team
> **Phiên bản:** v1.0 – MVP

---

## 1. Tổng Quan

Trang Admin là giao diện quản trị nội bộ dành riêng cho người dùng có `role = "admin"`. Mục tiêu là cung cấp bộ công cụ để kiểm soát toàn bộ nền tảng: quản lý người dùng, kiểm duyệt nội dung, giám sát quán ăn và chiến dịch quảng cáo.

### Đối tượng sử dụng
- **Quản trị viên hệ thống** (role: `admin`)

### Điều kiện truy cập
- Đã đăng nhập, JWT token hợp lệ
- `role` của user phải là `"admin"`
- Nếu không hợp lệ → redirect về trang 403 hoặc trang chủ

---

## 2. Cấu Trúc Điều Hướng (Navigation Structure)

```
Admin Panel
├── 📊 Dashboard (Tổng quan)
├── 👥 Quản lý Người dùng
│   ├── Danh sách tất cả user
│   ├── Tìm kiếm / Lọc
│   └── Chi tiết & Phân quyền
├── 🍜 Quản lý Quán ăn (Merchants)
│   ├── Danh sách tất cả quán
│   ├── Duyệt / Khóa quán
│   └── Xem thực đơn
├── 🎬 Kiểm duyệt Nội dung (Videos/Posts)
│   ├── Hàng chờ duyệt (pending)
│   ├── Đã duyệt (approved)
│   └── Đã từ chối (rejected)
├── 📣 Quản lý Quảng cáo (Campaigns)
│   ├── Tất cả chiến dịch
│   ├── Đang chạy / Tạm dừng
│   └── Thống kê tổng hợp
└── ⚙️ Cài đặt hệ thống (tương lai)
```

---

## 3. Các Trang & Chức Năng Chi Tiết

---

### 3.1 Dashboard – Trang Tổng Quan

**Mục đích:** Nhìn tổng thể sức khỏe của nền tảng ngay lúc đăng nhập.

#### Các thẻ số liệu (Stat Cards)

| Thẻ | Mô tả | API nguồn |
|-----|-------|-----------|
| Tổng số người dùng | Đếm tất cả user trong bảng `users` | `GET /users` (admin filter) |
| Video chờ duyệt | Đếm video có `status = "pending"` | `GET /videos?status=pending` |
| Quán ăn đang hoạt động | Đếm merchant có `is_active = true` | `GET /merchants` |
| Chiến dịch đang chạy | Đếm campaign có `is_active = true` | `GET /campaigns` |

#### Biểu đồ (Charts)
- **Biểu đồ đường:** Lượt đăng ký người dùng mới theo 7 ngày / 30 ngày gần nhất
- **Biểu đồ cột:** Số video được đăng theo từng ngày trong tuần
- **Biểu đồ tròn:** Phân bổ loại nội dung (`video` vs `image`)

#### Feed hoạt động gần đây
- 5 video vừa được đăng (status: pending) cần duyệt
- 5 tài khoản mới đăng ký gần nhất

---

### 3.2 Quản Lý Người Dùng

**Mục đích:** Xem, lọc, phân quyền, hoặc vô hiệu hóa tài khoản người dùng.

#### Bảng danh sách User

| Cột | Dữ liệu |
|-----|---------|
| ID | `user.id` |
| Tên | `user.full_name` |
| Email | `user.email` |
| Role | `user.role` (badge: `admin` / `merchant` / `reviewer`) |
| Ngày tham gia | `user.created_at` |
| Trạng thái | Active / Disabled (qua `meta_data.disabled`) |
| Hành động | Xem chi tiết · Đổi role · Vô hiệu hóa |

#### Bộ lọc & Tìm kiếm
- Tìm theo tên hoặc email (input text)
- Lọc theo role: `All / reviewer / merchant / admin`
- Lọc theo trạng thái: `All / Active / Disabled`
- Sắp xếp: Mới nhất · Cũ nhất

#### Trang chi tiết User (Modal hoặc trang con)
- Thông tin cơ bản (avatar, tên, email, role)
- Danh sách video đã đăng (5 bài gần nhất)
- Quán ăn đang sở hữu (nếu là merchant)
- Nút hành động: **Đổi Role** | **Vô hiệu hóa tài khoản**

---

### 3.3 Quản Lý Quán Ăn (Merchants)

**Mục đích:** Giám sát toàn bộ quán ăn trên nền tảng, bật/tắt hoạt động.

#### Bảng danh sách Merchant

| Cột | Dữ liệu |
|-----|---------|
| ID | `merchant.id` |
| Tên quán | `merchant.name` |
| Địa chỉ | `merchant.address` |
| Danh mục | `merchant.category` |
| Đánh giá TB | `merchant.rating_avg` (sao) |
| Chủ sở hữu | `merchant.owner.full_name` |
| Trạng thái | `is_active` (badge xanh/đỏ) |
| Ngày tạo | `merchant.created_at` |
| Hành động | Xem · Bật/Tắt |

#### Bộ lọc
- Tìm kiếm theo tên quán, địa chỉ
- Lọc theo category (Phở, Bún, Cơm, Bánh, ...)
- Lọc theo trạng thái: `is_active = true / false`

#### Trang chi tiết Merchant (Modal)
- Thông tin đầy đủ + tọa độ bản đồ (hiển thị mini-map)
- Danh sách thực đơn (menu items)
- Danh sách video đã gắn tag quán này
- Thống kê: lượt click, impressions quảng cáo
- Nút: **Bật/Tắt hoạt động** (toggle `is_active`)

---

### 3.4 Kiểm Duyệt Nội Dung (Videos/Posts)

**Mục đích:** Duyệt hoặc từ chối các video/bài đăng trước khi xuất hiện trên Feed.

#### Ba tab chính
- **Chờ duyệt (Pending)** — Ưu tiên hiển thị đầu tiên, badge số lượng
- **Đã duyệt (Approved)**
- **Đã từ chối (Rejected)**

#### Card nội dung (dạng grid 3 cột)

Mỗi card hiển thị:
- Thumbnail hoặc ảnh đại diện
- Tiêu đề video
- Tên reviewer (kèm avatar nhỏ)
- Quán ăn được tag (nếu có)
- Loại nội dung: `video` / `image` (badge)
- Thời gian đăng (`created_at`)
- Nút: **✅ Duyệt** | **❌ Từ chối** | **👁 Xem trước**

#### Modal xem trước
- Phát video trực tiếp từ `video_url`
- Hiển thị mô tả, tag, thông tin reviewer
- 2 nút hành động: **Phê duyệt** / **Từ chối** (kèm lý do từ chối, optional)
- Lý do từ chối được lưu vào `meta_data` của video

---

### 3.5 Quản Lý Quảng Cáo (Campaigns)

**Mục đích:** Giám sát và kiểm soát tất cả chiến dịch quảng cáo của các Merchant.

#### Bảng danh sách Campaign

| Cột | Dữ liệu |
|-----|---------|
| ID | `campaign.id` |
| Tiêu đề | `campaign.title` |
| Quán ăn | `campaign.merchant.name` |
| Trạng thái | `is_active` (toggle switch) |
| Lượt hiển thị | `impressions_count` |
| Lượt click | `clicks_count` |
| CTR | Tính = `clicks / impressions * 100` (%) |
| Ngày tạo | `campaign.created_at` |
| Hành động | Xem video · Bật/Tắt |

#### Thống kê tổng hợp (trên đầu trang)
- Tổng chiến dịch đang chạy
- Tổng lượt hiển thị hôm nay
- Tổng lượt click hôm nay
- CTR trung bình toàn nền tảng

#### Bộ lọc
- Lọc theo quán ăn (dropdown hoặc search)
- Lọc theo trạng thái: `Đang chạy / Tạm dừng`

---

## 4. Thiết Kế Khung Giao Diện (Layout Design)

### 4.1 Bố Cục Tổng Thể

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR  [ Logo Admin ]         [ Avatar + Tên admin ▾ ] │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │           MAIN CONTENT AREA               │
│            │                                            │
│  📊 Dashboard        ┌──────── Page Header ──────────┐  │
│  👥 Users            │  Tiêu đề trang   [Nút hành động]│  │
│  🍜 Merchants        └────────────────────────────────┘  │
│  🎬 Videos           ┌──────── Content Block ────────┐  │
│  📣 Campaigns        │  Bộ lọc / Tìm kiếm            │  │
│                      │  Bảng dữ liệu / Card Grid      │  │
│  ─────────           │  Phân trang                   │  │
│  ⚙️  Cài đặt         └────────────────────────────────┘  │
│                                                          │
└────────────┴────────────────────────────────────────────┘
```

### 4.2 Sidebar

- **Chiều rộng:** 240px (desktop), thu gọn thành icon 64px khi nhỏ hơn 1024px
- **Trạng thái active:** Highlight nền + thanh màu bên trái
- **Footer sidebar:** Nút đăng xuất + phiên bản app

### 4.3 Topbar

- Chiều cao: 56px, sticky
- Bên trái: Logo / tên hệ thống "🍜 FoodAdmin"
- Bên phải: Avatar admin + tên + dropdown (Profile / Đăng xuất)

### 4.4 Bảng dữ liệu (Data Table)

```
┌─── Bộ lọc & Tìm kiếm ──────────────────────────────────┐
│  🔍 [ Tìm kiếm... ]    [Lọc Role ▾]   [Trạng thái ▾]  │
└──────────────────────────────────────────────────────────┘
┌─── Bảng ────────────────────────────────────────────────┐
│  ☐  │  ID  │  Tên        │  Role    │  Ngày   │ Hành động│
│────────────────────────────────────────────────────────  │
│  ☐  │  1   │  Nguyễn A   │ reviewer │ 01/06   │  ✏️ 🚫  │
│  ☐  │  2   │  Trần B     │ merchant │ 02/06   │  ✏️ 🚫  │
└─────────────────────────────────────────────────────────┘
[← Trước]  Trang 1 / 10   [Sau →]    Hiển thị: [20 ▾] /trang
```

### 4.5 Card Grid (cho trang kiểm duyệt)

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ [Thumbnail]│  │ [Thumbnail]│  │ [Thumbnail]│
│            │  │            │  │            │
│ Tiêu đề    │  │ Tiêu đề    │  │ Tiêu đề    │
│ @reviewer  │  │ @reviewer  │  │ @reviewer  │
│ 🏪 Quán A  │  │ 🏪 Quán B  │  │            │
│ [Duyệt][X] │  │ [Duyệt][X] │  │ [Duyệt][X] │
└────────────┘  └────────────┘  └────────────┘
```

---

## 5. Hệ Thống Màu Sắc & Giao Diện

### 5.1 Bảng màu chính

| Biến | Giá trị | Dùng cho |
|------|---------|----------|
| `--color-bg` | `#0F1117` | Nền toàn trang (dark mode) |
| `--color-surface` | `#1A1D27` | Nền sidebar, card, modal |
| `--color-border` | `#2A2D3E` | Đường viền |
| `--color-primary` | `#FF6B35` | Màu chủ đạo – cam đồ ăn, nút CTA |
| `--color-success` | `#22C55E` | Badge "Approved", "Active" |
| `--color-warning` | `#EAB308` | Badge "Pending" |
| `--color-danger` | `#EF4444` | Badge "Rejected", "Inactive", nút xóa |
| `--color-text-primary` | `#F1F5F9` | Chữ chính |
| `--color-text-secondary` | `#94A3B8` | Chữ phụ, label |

### 5.2 Badge trạng thái

```
[ pending ]   → nền vàng nhạt, chữ vàng đậm
[ approved ]  → nền xanh nhạt, chữ xanh đậm
[ rejected ]  → nền đỏ nhạt, chữ đỏ đậm
[ active ]    → nền xanh nhạt, chữ xanh đậm
[ inactive ]  → nền xám nhạt, chữ xám
```

### 5.3 Typography

- **Font chính:** `Inter` (body, table, button)
- **Font số liệu Dashboard:** `JetBrains Mono` hoặc `Inter Mono` (stat numbers)
- **Cỡ chữ:**
  - Heading trang: `24px / font-weight: 600`
  - Section title: `16px / font-weight: 600`
  - Body text: `14px / font-weight: 400`
  - Caption / label: `12px / font-weight: 500`

---

## 6. Luồng Xử Lý Chính (User Flows)

### 6.1 Duyệt Video

```
Admin vào trang "Kiểm duyệt"
  → Tab "Chờ duyệt" hiển thị danh sách
  → Click "Xem trước" → Modal mở, video phát
  → Chọn "Phê duyệt" → PATCH /videos/{id} với status="approved"
  → Toast: "Đã duyệt bài đăng ✅"
  → Video biến mất khỏi tab "Chờ duyệt", chuyển sang "Đã duyệt"
```

### 6.2 Vô Hiệu Hóa Tài Khoản

```
Admin vào trang "Người dùng"
  → Tìm user theo tên/email
  → Click "Vô hiệu hóa" → Confirm dialog
  → PATCH /users/{id} với meta_data.disabled=true
  → Toast: "Đã vô hiệu hóa tài khoản 🚫"
  → Badge trạng thái chuyển sang "Disabled"
```

### 6.3 Bật/Tắt Quảng Cáo

```
Admin vào trang "Quảng cáo"
  → Thấy campaign đang chạy
  → Toggle switch "is_active"
  → PATCH /merchants/{id}/campaigns/toggle
  → Toggle cập nhật tức thì (optimistic UI)
```

---

## 7. Ghi Chú Kỹ Thuật Frontend

### 7.1 Xác thực & Bảo vệ Route

```
Tất cả route /admin/* phải:
  1. Kiểm tra JWT token còn hợp lệ
  2. Decode token → lấy role
  3. Nếu role !== "admin" → redirect /403
  4. Lưu token vào httpOnly cookie hoặc memory (không dùng localStorage)
```

### 7.2 State Management

- Dùng **React Context** hoặc **Zustand** cho auth state và user info
- Dùng **React Query (TanStack Query)** để cache và fetch dữ liệu từ API
- Pagination: dùng `offset + limit` cho các bảng, `cursor` cho Feed

### 7.3 API Endpoints Cần Dùng

| Trang | HTTP Method | Endpoint |
|-------|-------------|----------|
| Dashboard | GET | `/api/v1/users`, `/api/v1/videos`, `/api/v1/merchants` |
| Danh sách User | GET | `/api/v1/users?limit=20&offset=0` |
| Đổi Role User | PATCH | `/api/v1/users/{id}` |
| Danh sách Merchant | GET | `/api/v1/merchants` |
| Bật/Tắt Merchant | PATCH | `/api/v1/merchants/{id}` (toggle `is_active`) |
| Video Pending | GET | `/api/v1/videos?status=pending` |
| Duyệt/Từ chối Video | PATCH | `/api/v1/videos/{id}` (update `status`) |
| Danh sách Campaign | GET | `/api/v1/campaigns` |
| Bật/Tắt Campaign | PATCH | `/api/v1/merchants/{id}/campaigns/toggle` |

> **Lưu ý:** Các endpoint chưa có trong backend cần BE bổ sung (Xem Mục 8).

### 7.4 Responsive

- Desktop ≥ 1280px: Sidebar mở đầy đủ
- Tablet 768px – 1279px: Sidebar thu thành icon
- Mobile < 768px: Sidebar ẩn, mở qua hamburger menu (Trang admin không ưu tiên mobile, nhưng vẫn cần hoạt động được)

---

## 8. Các API Backend Cần Bổ Sung

Những endpoint này **chưa có trong backend MVP** nhưng cần thiết cho Admin Page:

| STT | Endpoint | Mô tả |
|-----|----------|-------|
| 1 | `GET /admin/users` | Lấy danh sách toàn bộ user (phân trang, lọc) |
| 2 | `PATCH /admin/users/{id}/role` | Đổi role của user |
| 3 | `PATCH /admin/users/{id}/disable` | Vô hiệu hóa/kích hoạt user |
| 4 | `PATCH /admin/videos/{id}/status` | Cập nhật trạng thái kiểm duyệt video |
| 5 | `GET /admin/campaigns` | Lấy toàn bộ campaign (không lọc theo merchant) |
| 6 | `GET /admin/stats` | Trả về các số liệu tổng hợp cho Dashboard |

> Các endpoint này cần middleware `RoleChecker(["admin"])` để bảo vệ.

---

## 9. Phân Công Công Việc Frontend (Gợi Ý)

| Thành viên | Trang / Component |
|------------|-------------------|
| FE1 | Layout tổng thể (Sidebar, Topbar), Auth Guard, Routing |
| FE2 | Dashboard (Stat Cards, Charts) + Trang Quản lý User |
| FE3 | Trang Kiểm duyệt Nội dung (Video grid, Modal xem trước) |
| FE4 | Trang Quản lý Merchant + Trang Quản lý Campaign |

---

*Tài liệu này là bản thiết kế MVP – có thể mở rộng thêm tính năng log hoạt động (audit log), phân tích nâng cao và xuất báo cáo CSV trong các sprint sau.*
