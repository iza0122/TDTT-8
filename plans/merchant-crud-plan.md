# Kế hoạch Kết nối Frontend và Backend cho Chức năng CRUD của Merchant

## Mục tiêu
Cho phép người dùng merchant tạo mới quán ăn, chỉnh sửa hồ sơ quán ăn hiện có và hiển thị thông tin các quán ăn này trên ứng dụng.

## 1. Xem xét/Xác nhận Tích hợp "Tạo Quán ăn Mới" (Đã thực hiện phần lớn)

**Mục tiêu:** Đảm bảo rằng chức năng tạo quán ăn mới đã được kết nối đúng cách giữa frontend và backend.

*   **1.1. Xác minh `frontend/app/merchant/add-restaurant/page.tsx`:**
    *   **Trạng thái:** Đang chờ xác minh
    *   **Chi tiết:** Đảm bảo trang này gửi dữ liệu biểu mẫu đến hàm dịch vụ `createMerchant`.
*   **1.2. Xác minh `frontend/lib/services/merchant.ts`:**
    *   **Trạng thái:** Đang chờ xác minh
    *   **Chi tiết:** Đảm bảo hàm `createMerchant` gọi đúng endpoint `POST /api/merchant/` với dữ liệu quán ăn mới và token xác thực.
*   **1.3. Xác minh `backend/modules/merchant/router.py`:**
    *   **Trạng thái:** Đang chờ xác minh
    *   **Chi tiết:** Đảm bảo có endpoint `POST /merchant/` đã được định nghĩa để xử lý việc tạo quán ăn mới, bao gồm kiểm tra vai trò merchant.
*   **1.4. Xác minh `backend/modules/merchant/services.py`:**
    *   **Trạng thái:** Đang chờ xác minh
    *   **Chi tiết:** Đảm bảo logic `create_merchant` xử lý việc lưu quán ăn vào cơ sở dữ liệu và liên kết với người dùng sở hữu.
*   **1.5. Xác minh `backend/modules/merchant/schemas.py`:**
    *   **Trạng thái:** Đang chờ xác minh
    *   **Chi tiết:** Đảm bảo các schema `MerchantCreate` (đầu vào) và `MerchantResponse` (đầu ra) được định nghĩa chính xác.

## 2. Triển khai Chức năng "Chỉnh sửa Hồ sơ Quán ăn"

**Mục tiêu:** Cho phép người dùng merchant cập nhật thông tin chi tiết của quán ăn mà họ sở hữu, tích hợp trực tiếp trên dashboard hoặc trang profile của quán.

### 2.1. Backend: Triển khai API Endpoint để Cập nhật Merchant

*   **2.1.1. Thêm endpoint `PATCH /merchant/{merchant_id}` trong `backend/modules/merchant/router.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Endpoint này sẽ cho phép cập nhật từng phần (`PATCH`) thông tin của một quán ăn hiện có. Cần đảm bảo chỉ chủ sở hữu hoặc admin mới có quyền thực hiện.
*   **2.1.2. Triển khai hàm dịch vụ `update_merchant` trong `backend/modules/merchant/services.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Logic để cập nhật dữ liệu quán ăn trong cơ sở dữ liệu dựa trên `merchant_id` và dữ liệu được cung cấp.
*   **2.1.3. Định nghĩa `MerchantUpdate` và cập nhật `MerchantResponse` schemas trong `backend/modules/merchant/schemas.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** `MerchantUpdate` sẽ chứa các trường có thể cập nhật. `MerchantResponse` cần phản ánh cấu trúc dữ liệu sau khi cập nhật.

### 2.2. Frontend: Tích hợp "Chỉnh sửa Hồ sơ Quán ăn" vào Dashboard/Profile của Merchant

*   **2.2.1. Sửa đổi `frontend/app/merchant/profile/page.tsx` (hoặc một modal/drawer trong `frontend/app/merchant/[id]/page.tsx`):**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Thêm một biểu mẫu để chỉnh sửa chi tiết merchant trực tiếp trên trang profile hoặc trong một modal/drawer.
*   **2.2.2. Điền trước dữ liệu hiện có vào biểu mẫu:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Biểu mẫu sẽ được điền trước dữ liệu hiện tại của quán (lấy từ `GET /merchant/{merchant_id}`).
*   **2.2.3. Triển khai logic gửi biểu mẫu đến `PATCH /api/merchant/{merchant_id}` thông qua một hàm dịch vụ mới:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Hàm này sẽ gửi yêu cầu cập nhật đến backend và xử lý phản hồi.
*   **2.2.4. Xử lý trạng thái tải, thành công, lỗi và cập nhật giao diện:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Hiển thị trạng thái tải, thông báo thành công hoặc lỗi, và cập nhật thông tin hồ sơ hiển thị ngay lập tức sau khi chỉnh sửa thành công.
*   **2.2.5. Thêm nút "Chỉnh sửa Hồ sơ" để kích hoạt giao diện chỉnh sửa:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Nút này sẽ mở biểu mẫu chỉnh sửa (có thể là modal/drawer hoặc hiển thị trực tiếp trên trang).

## 3. Triển khai "Hiển thị Quán ăn trên Ứng dụng" (Xem các quán ăn sở hữu)

**Mục tiêu:** Cho phép người dùng merchant xem danh sách các quán ăn họ sở hữu và truy cập vào trang chi tiết của từng quán.

### 3.1. Backend: Triển khai API Endpoint để Liệt kê các Merchant do User Sở hữu

*   **3.1.1. Thêm endpoint `GET /merchant/me` trong `backend/modules/merchant/router.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Endpoint này sẽ trả về một danh sách các quán ăn mà người dùng hiện tại sở hữu (dựa trên `owner_id`).
*   **3.1.2. Triển khai hàm dịch vụ `get_merchants_by_owner` trong `backend/modules/merchant/services.py`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Logic để truy vấn cơ sở dữ liệu và trả về các merchant có `owner_id` khớp với user ID hiện tại.

### 3.2. Frontend: Hiển thị Danh sách các Merchant do User Sở hữu

*   **3.2.1. Tạo một component để lấy và hiển thị danh sách từ `GET /api/merchant/me`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Component này sẽ gọi API backend để lấy danh sách các quán ăn và hiển thị chúng (ví dụ: trong một dropdown menu hoặc danh sách).
*   **3.2.2. Tích hợp component này vào [`frontend/app/merchant/page.tsx`](frontend/app/merchant/page.tsx) (dashboard chính của merchant):**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Đặt component này ở một vị trí dễ thấy trên dashboard để merchant có thể chọn quán.
*   **3.2.3. Đối với mỗi merchant, cung cấp liên kết đến `frontend/app/merchant/[id]/page.tsx`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Mỗi mục trong danh sách sẽ là một liên kết đến trang chi tiết của quán ăn đó, cho phép merchant xem và quản lý cụ thể từng quán.

### 3.3. Frontend: Hiển thị Động trên [`frontend/app/merchant/[id]/page.tsx`](frontend/app/merchant/[id]/page.tsx)

*   **3.3.1. Đảm bảo `frontend/app/merchant/[id]/page.tsx` lấy và hiển thị dữ liệu cho merchant tương ứng với `[id]`:**
    *   **Trạng thái:** Đang chờ
    *   **Chi tiết:** Trang này cần sử dụng `useRouter` của Next.js để lấy `id` từ URL và sau đó gọi API `GET /merchant/{id}` để hiển thị thông tin chi tiết của quán đó.
