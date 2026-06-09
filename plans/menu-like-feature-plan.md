# Kế hoạch Triển khai Chức năng Thích Món ăn (Menu Like Feature Implementation Plan)

## Mục tiêu
Thêm khả năng người dùng thích (like) các món ăn trong menu của quán ăn, hiển thị số lượt thích và trạng thái thích của người dùng.

## 1. Backend: Triển khai chức năng Thích Món ăn (Menu Like)

**Mục tiêu:** Tạo cơ sở dữ liệu và API endpoints để quản lý lượt thích món ăn.

*   **1.1. Cập nhật Model `Menu` và Tạo Model `MenuLike` trong `backend/core/all_models.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   Thêm cột `likes_count` (Integer, default=0, nullable=False) vào model `Menu`.
        *   Định nghĩa một model `MenuLike` mới để lưu trữ mối quan hệ giữa người dùng và món ăn mà họ đã thích:
            *   `id` (Integer, primary_key=True, index=True)
            *   `user_id` (Integer, ForeignKey("users.id"), nullable=False)
            *   `menu_id` (Integer, ForeignKey("menus.id"), nullable=False)
            *   `created_at` (DateTime, default=datetime.utcnow, nullable=False)
            *   Thiết lập mối quan hệ (`relationship`) giữa `MenuLike` với `User` và `Menu`.
            *   Thêm `back_populates` vào `User` và `Menu` để quản lý mối quan hệ ngược lại.

*   **1.2. Định nghĩa Schemas trong `backend/modules/merchant/schemas.py` cho `MenuLike`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   Tạo schema `MenuLikeResponse` để đại diện cho một lượt thích món ăn, bao gồm `id`, `user_id`, `menu_id`, `created_at`.
        *   Cập nhật `MenuResponse` để bao gồm `likes_count` và một danh sách `menu_likes` (tùy chọn) hoặc một trường `is_liked_by_user` nếu cần hiển thị trạng thái thích cá nhân.

*   **1.3. Thêm API Endpoints trong `backend/modules/merchant/router.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   `POST /menu/{menu_id}/like`: Endpoint để người dùng thích một món ăn.
            *   Yêu cầu xác thực người dùng (`RoleChecker`).
            *   Kiểm tra xem món ăn có tồn tại không.
            *   Kiểm tra xem người dùng đã thích món này chưa.
            *   Nếu chưa, tạo một bản ghi `MenuLike` mới, tăng `Menu.likes_count` lên 1.
            *   Trả về `MenuLikeResponse` hoặc thông báo thành công.
        *   `DELETE /menu/{menu_id}/like`: Endpoint để người dùng bỏ thích một món ăn.
            *   Yêu cầu xác thực người dùng (`RoleChecker`).
            *   Kiểm tra xem món ăn có tồn tại không.
            *   Tìm bản ghi `MenuLike` tương ứng và xóa nó.
            *   Giảm `Menu.likes_count` đi 1.
            *   Trả về thông báo thành công.

*   **1.4. Triển khai các hàm dịch vụ trong `backend/modules/merchant/services.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   `create_menu_like(db: Session, menu_id: int, user_id: int)`: Logic để tạo lượt thích mới.
        *   `remove_menu_like(db: Session, menu_id: int, user_id: int)`: Logic để xóa lượt thích.
        *   `get_menu_likes_count(db: Session, menu_id: int)`: (Nếu không lưu trực tiếp trên `Menu` model, dùng để tính tổng).
        *   `has_user_liked_menu_item(db: Session, menu_id: int, user_id: int)`: Kiểm tra trạng thái thích của người dùng.

## 2. Frontend: Tích hợp nút "Thích Món ăn" vào Trang Menu của Merchant

**Mục tiêu:** Hiển thị nút thích trên giao diện người dùng và tương tác với backend.

*   **2.1. Đọc [`frontend/app/merchant/menu/page.tsx`](frontend/app/merchant/menu/page.tsx):**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Đọc nội dung file để hiểu cấu trúc và cách các món ăn được hiển thị.

*   **2.2. Thêm nút "Thích" và hiển thị số lượt thích cho mỗi món ăn:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   Trong mỗi mục món ăn, thêm một biểu tượng trái tim (ví dụ: `Heart` từ `lucide-react`) và một số hiển thị `likes_count`.
        *   Nút này sẽ có hai trạng thái: đã thích (biểu tượng màu đỏ/đầy) và chưa thích (biểu tượng viền).

*   **2.3. Triển khai logic frontend để tương tác với API backend:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:**
        *   Khi người dùng nhấp vào nút "Thích", gọi API `POST /menu/{menu_id}/like`.
        *   Khi người dùng nhấp lại (bỏ thích), gọi API `DELETE /menu/{menu_id}/like`.
        *   Sử dụng `useAuth()` để lấy token xác thực.

*   **2.4. Cập nhật UI để hiển thị trạng thái và số lượt thích:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Sau khi gọi API thành công, cập nhật trạng thái của nút "Thích" và số lượt thích ngay lập tức trên giao diện.
