## Thiết kế Nút Truy cập Trang Thương nhân trên Trang Chủ

Để tạo một nút tạm thời giúp bạn dễ dàng kiểm tra giao diện trang thương nhân, tôi đề xuất thiết kế sau, tuân thủ chặt chẽ phong cách hiện có của ứng dụng FoodieGram:

### 1. Vị trí

Nút sẽ được đặt trong **cột bên phải (phần gợi ý/aside)** của trang chủ (`frontend/app/page.tsx`), cụ thể là ngay **bên dưới tiêu đề "Quán ngon gợi ý"** và phía trên danh sách các nhà hàng được gợi ý. Vị trí này đảm bảo nút dễ thấy trên các màn hình desktop mà không làm gián đoạn luồng nội dung chính.

```mermaid
graph TD
    A[Trang Chủ (frontend/app/page.tsx)] --> B{Cột bên phải - Gợi ý (lg:col-span-3)}
    B --> B1(Heading: Quán ngon gợi ý)
    B1 --> B2[Nút: Đi đến Trang Thương nhân (ID: 1)]
    B2 --> B3(Danh sách Quán ngon gợi ý)
    B3 --> B4(Heading: Blogger nổi bật)
    B4 --> B5(Danh sách Blogger nổi bật)
    B5 --> B6(Chân trang)

    style B1 fill:#FFECB3,stroke:#333,stroke-width:1px;
    style B2 fill:#FF8C00,stroke:#333,stroke-width:2px;
```

### 2. Phong cách Trực quan

*   **Thành phần cơ sở:** Sử dụng `Button` từ Shadcn UI (`@/components/ui/button`).
*   **Màu sắc:** Màu nhấn chính của ứng dụng (cam/hổ phách).
*   **Hình dạng:** Nút hình viên thuốc hoàn toàn tròn (`rounded-full`).
*   **Kích thước & Khoảng đệm:** `px-6 py-3` để có kích thước vừa phải, dễ bấm.
*   **Văn bản:** "Đi đến Trang Thương nhân (ID: 1)" để rõ ràng mục đích kiểm thử.
*   **Kiến trúc "Button-in-Button":** Tích hợp biểu tượng mũi tên (`ChevronRight`) bên trong một hình tròn nhỏ, lồng vào nút chính, tạo hiệu ứng thị giác cao cấp.

### 3. Tương tác & Chuyển động (Motion Choreography)

*   **Hiệu ứng di chuột (Hover):**
    *   Nút chính: Nền thay đổi từ cam sang cam đậm hơn (`hover:bg-orange-600`).
    *   Biểu tượng lồng ghép: Sẽ dịch chuyển nhẹ sang phải và lên trên, tạo hiệu ứng "từ tính" (`group-hover:translate-x-1 group-hover:-translate-y-[1px]`).
*   **Hiệu ứng khi nhấn (Active):** Nút sẽ co lại nhẹ (`active:scale-95`) để mô phỏng phản hồi vật lý.
*   **Chuyển đổi (Transition):** Tất cả các hiệu ứng sẽ sử dụng `transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]` để đảm bảo chuyển động mượt mà, tự nhiên, nhất quán với các chuyển động khác trong ứng dụng.

### 4. Code Snippet (Dự kiến)

```tsx
<Link href="/merchant/1" className="block mt-6">
  <Button className="w-full px-6 py-3 rounded-full text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors active:scale-95 group">
    Đi đến Trang Thương nhân (ID: 1)
    <span className="ml-2 w-7 h-7 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      <ChevronRight className="w-4 h-4" />
    </span>
  </Button>
</Link>
```

Kế hoạch này đảm bảo nút mới sẽ phù hợp hoàn hảo với thẩm mỹ của FoodieGram và cung cấp một cách rõ ràng để truy cập trang thương nhân để kiểm tra. Bạn có hài lòng với thiết kế này không?