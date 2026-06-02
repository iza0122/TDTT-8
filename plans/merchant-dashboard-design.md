## Phương án Thiết kế Giao diện Quản lý Thương nhân (Merchant Dashboard)

Dựa trên cấu trúc và phong cách thiết kế hiện có của ứng dụng FoodieGram, tôi đề xuất phương án thiết kế giao diện quản lý dành cho nhóm người dùng thương nhân. Mục tiêu là tạo ra một môi trường hiệu quả, rõ ràng và dễ sử dụng để các nhà hàng/quán ăn có thể quản lý thông tin, thực đơn, khuyến mãi và tương tác với khách hàng.

### 1. Nguyên tắc Thiết kế Tổng thể

*   **Phong cách:** Chuyên nghiệp, gọn gàng, hiệu quả, mang hơi hướng cao cấp (kết hợp Soft Structuralism và Ethereal Glass), đồng bộ với ứng dụng FoodieGram.
*   **Bảng màu:** Sử dụng nhất quán bảng màu `oklch` hiện có, với màu cam/hổ phách là màu nhấn chính cho các hành động và thông tin quan trọng.
*   **Kiểu chữ:** Phông chữ `Geist` cho tiêu đề và nội dung chính; `Geist Mono` cho các dữ liệu hoặc thông tin kỹ thuật (nếu có).
*   **Bố cục:** Bố cục dạng dashboard, phản hồi tốt trên mọi thiết bị, ưu tiên thanh điều hướng cố định bên trái trên desktop và chuyển thành nav dưới/hamburger menu trên di động.
*   **Thành phần UI:** Tận dụng tối đa các thành phần Shadcn UI hiện có (Cards, Tables, Forms, Inputs, Buttons, Dialogs, etc.).
*   **Tương tác:** Phản hồi rõ ràng cho mọi hành động, chuyển đổi mượt mà nhưng tập trung vào hiệu quả hơn là hiệu ứng điện ảnh quá mức.

### 2. Các Chức năng Cốt lõi

1.  **Tổng quan Dashboard (Dashboard Overview):**
    *   Hiển thị tóm tắt các số liệu chính: Đánh giá trung bình, các món ăn phổ biến nhất (dựa trên số lượt "like").
    *   Các liên kết nhanh đến các tác vụ thường xuyên: Thêm món mới, tạo khuyến mãi, xem đánh giá mới.
    *   Khu vực thông báo/cảnh báo: Đánh giá mới, nhắc nhở khuyến mãi sắp hết hạn.

2.  **Quản lý Hồ sơ Nhà hàng (Restaurant Profile Management):**
    *   **Thông tin chung:** Chỉnh sửa tên, slogan, mô tả, danh mục ẩm thực, giờ hoạt động.
    *   **Thông tin liên hệ:** Quản lý địa chỉ, số điện thoại, email.
    *   **Hình ảnh:** Tải lên và quản lý ảnh đại diện, ảnh hero, ảnh thư viện của nhà hàng.
    *   **Vị trí:** Cập nhật tọa độ (latitude/longitude) cho tích hợp bản đồ chính xác.

3.  **Quản lý Thực đơn (Menu Management):**
    *   **Danh sách món ăn:** Thêm, chỉnh sửa, xóa các món ăn/thức uống.
    *   **Chi tiết món ăn:** Tên, mô tả, giá, hình ảnh, danh mục (ví dụ: món khai vị, món chính, đồ uống).
    *   **Sắp xếp:** Kéo và thả để sắp xếp lại thứ tự món ăn (tùy chọn nâng cao).
    *   **Danh mục thực đơn:** Quản lý các danh mục để phân loại món ăn.

4.  **Quản lý Khuyến mãi & Ưu đãi (Promotions & Offers Management):**
    *   Tạo, chỉnh sửa, xóa các chương trình khuyến mãi.
    *   Chi tiết khuyến mãi: Tiêu đề, mô tả, thời gian hiệu lực (ngày bắt đầu/kết thúc).
    *   Kích hoạt/Hủy kích hoạt khuyến mãi.

5.  **Quản lý Đánh giá & Xếp hạng (Review & Rating Management):**
    *   Xem tất cả các đánh giá và xếp hạng của khách hàng.
    *   Phản hồi đánh giá (tùy chọn).
    *   Lọc/sắp xếp đánh giá theo sao, ngày.

6.  **Quản lý người dùng nội bộ (Internal User Management - nếu có nhiều nhân viên quản lý một tài khoản):**
    *   Thêm/xóa nhân viên.
    *   Quản lý vai trò và quyền hạn.

7.  **Cài đặt (Settings):**
    *   Cài đặt tài khoản chung của thương nhân.
    *   Tùy chọn thông báo.

### 3. Cấu trúc Bố cục và Điều hướng

*   **Thanh điều hướng bên (Sidebar Navigation):** Luôn hiển thị ở bên trái trên desktop, chứa các mục điều hướng chính được liệt kê ở trên. Sử dụng các biểu tượng Lucide-react và các hiệu ứng hover nhất quán.
*   **Khu vực nội dung chính (Main Content Area):** Hiển thị các giao diện quản lý chi tiết. Sử dụng Shadcn `Card` và bố cục lưới để trình bày thông tin một cách có tổ chức.
*   **Thanh header:** Chứa tên nhà hàng đang quản lý, thông báo và có thể là một nút đăng xuất nhanh.

### 4. Lựa chọn Thành phần và Tương tác (Leveraging Shadcn UI)

*   **Dashboard:** `Card` cho các widget tổng quan, có thể dùng `Chart` cho các biểu đồ đơn giản.
*   **Form:** `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox` để quản lý thông tin nhà hàng, món ăn, khuyến mãi.
*   **Bảng:** `Table` để hiển thị danh sách món ăn, đánh giá. Hỗ trợ phân trang, sắp xếp và lọc.
*   **Thao tác dữ liệu:** `Button` cho các hành động thêm, chỉnh sửa, xóa. `AlertDialog` hoặc `Dialog` để xác nhận xóa hoặc hiển thị form chỉnh sửa chi tiết.
*   **Tải ảnh:** Sử dụng một input dạng file tùy chỉnh hoặc Shadcn `Input` với type `file` và xem trước hình ảnh.
*   **Chuyển đổi trạng thái:** `Switch` cho các tùy chọn kích hoạt/hủy kích hoạt.
*   **Thông báo:** `Toast` (`Sonner`) cho phản hồi hành động.

### 5. Minh họa Cấu trúc Dashboard (Mermaid Diagram)

```mermaid
graph TD
    A[Merchant Dashboard] --> B(Sidebar Navigation)
    A --> C(Header)
    A --> D(Main Content Area)

    subgraph Sidebar Navigation
        B1[Tổng quan Dashboard]
        B2[Quản lý Nhà hàng]
        B3[Đánh giá]
        B4[Cài đặt]
    end

    subgraph Quản lý Nhà hàng
        B2 --> B2a[Thông tin chung]
        B2 --> B2b[Thực đơn]
        B2 --> B2c[Hình ảnh]
        B2 --> B2d[Khuyến mãi]
    end

    subgraph Main Content Area
        D1{Dashboard Overview}
        D2{Thông tin chung}
        D3{Quản lý Thực đơn}
        D4{Quản lý Hình ảnh}
        D5{Quản lý Khuyến mãi}
        D6{Quản lý Đánh giá}
        D7{Cài đặt}
    end

    B1 --> D1
    B2a --> D2
    B2b --> D3
    B2c --> D4
    B2d --> D5
    B3 --> D6
    B4 --> D7

    style A fill:#F0F2F5,stroke:#333,stroke-width:2px;
    style B fill:#E0E4E7,stroke:#333,stroke-width:1px;
    style C fill:#D9E2E8,stroke:#333,stroke-width:1px;
    style D fill:#FFFFFF,stroke:#333,stroke-width:1px;

    style B1 fill:#C8E6C9,stroke:#333,stroke-width:1px;
    style B2 fill:#BBDEFB,stroke:#333,stroke-width:1px;
    style B3 fill:#BBDEFB,stroke:#333,stroke-width:1px;
    style B4 fill:#BBDEFB,stroke:#333,stroke-width:1px;

    style B2a fill:#FFECB3,stroke:#333,stroke-width:1px;
    style B2b fill:#FFECB3,stroke:#333,stroke-width:1px;
    style B2c fill:#FFECB3,stroke:#333,stroke-width:1px;
    style B2d fill:#FFECB3,stroke:#333,stroke-width:1px;
