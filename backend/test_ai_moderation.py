import os
import sys
from huggingface_hub import InferenceClient

# Đảm bảo import được backend từ thư mục cha
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Tránh lỗi font tiếng Việt trên console Windows
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from backend.core.config import settings
from backend.modules.content.services import moderate_content_huggingface

def test_moderation(index: int, text: str, expected_status: str):
    if not settings.HUGGINGFACE_API_KEY or "your_" in settings.HUGGINGFACE_API_KEY.lower():
        print(f'{index}. Văn bản: "{text}"\n   -> Kết quả AI: PENDING (Chưa cấu hình API Key)')
        print("-" * 60)
        return

    try:
        status = moderate_content_huggingface(title="", description=text)
        is_pass = status.lower() == expected_status.lower()
        pass_text = "✅ PASS (CHÍNH XÁC)" if is_pass else "❌ FAIL (SAI LỆCH)"
        print(f'{index}. Văn bản: "{text}"\n   -> Kết quả AI: {status.upper()} | Kỳ vọng: {expected_status.upper()} => {pass_text}')
        print("-" * 60)
    except Exception as e:
        print(f'{index}. Văn bản: "{text}"\n   -> Kết quả AI: PENDING (Lỗi: {str(e)})')
        print("-" * 60)

if __name__ == "__main__":
    print("=========================================================")
    print("🚀 BẮT ĐẦU CHẠY 20 TEST CASE XÁC MINH AI MODERATION 🚀")
    print("=========================================================")
    
    print(f"HUGGINGFACE_MODEL_ID: {settings.HUGGINGFACE_MODEL_ID}")
    print(f"HUGGINGFACE_API_KEY: {settings.HUGGINGFACE_API_KEY[:10]}... (Độ dài: {len(settings.HUGGINGFACE_API_KEY) if settings.HUGGINGFACE_API_KEY else 0})")
    print("=========================================================")

    posts = [
        # 1-5
        {"text": "Hôm nay mình đi ăn bún đậu mắm tôm ở Khương Trung ngon xuất sắc, lòng dồi rán giòn rụm, mắm tôm pha cực vừa miệng.", "expected": "approved"},
        {"text": "Cần bán xe máy Honda Vision cũ đời 2020 màu trắng, chính chủ biển Hà Nội, giá 25 triệu, ai mua liên hệ.", "expected": "rejected"},
        {"text": "Tuyển nhân viên làm ca tối cho shop quần áo thời trang, lương 22k/h, môi trường năng động.", "expected": "rejected"},
        {"text": "Quán lẩu thái riêu cua này siêu đông khách, nước lẩu chua cay đậm đà, hải sản tươi rói ăn kèm rau muống giòn ngọt.", "expected": "approved"},
        {"text": "Cửa hàng trà sữa Koi Thé đang có chương trình mua 1 tặng 1 cho tất cả các loại trà sữa trân châu hoàng kim.", "expected": "approved"},
        
        # 6-10
        {"text": "Bán nhà 3 tầng mặt phố Cầu Giấy, diện tích 50m2, mặt tiền rộng 4m, sổ đỏ chính chủ, giá thương lượng.", "expected": "rejected"},
        {"text": "Điện thoại iPhone 13 Pro Max 128GB màu xanh dung lượng pin 90% cần bán lại cho ai có nhu cầu, máy dùng giữ gìn.", "expected": "rejected"},
        {"text": "Bánh mì dân tổ ở đây ăn lạ miệng ghê, nhân bánh gồm trứng, pate, lạp xưởng xào chung sền sệt, ăn lúc nóng ngon tuyệt.", "expected": "approved"},
        {"text": "Tuyển gấp đầu bếp và nhân viên phụ bếp làm việc tại nhà hàng quận 1, lương thỏa thuận theo tay nghề.", "expected": "rejected"},
        {"text": "Review chi tiết quán nướng buffet 199k ở Hà Nội. Đồ ăn ướp đậm vị, thịt bò ba chỉ cuộn nấm kim châm ngon xỉu.", "expected": "approved"},
        
        # 11-15
        {"text": "Dịch vụ thông tắc cống hút bể phốt giá rẻ tại Hà Nội, phục vụ 24/7, có mặt sau 15 phút gọi.", "expected": "rejected"},
        {"text": "Cho thuê phòng trọ khép kín đầy đủ đồ dùng điều hòa, nóng lạnh, giường tủ tại khu vực Đê La Thành.", "expected": "rejected"},
        {"text": "Món canh chua cá lóc miền Tây chuẩn vị phải có vị chua nhẹ của me, thơm ngát của ngò gai và vị ngọt thanh của cá lóc đồng.", "expected": "approved"},
        {"text": "Nhận order giày Adidas, Nike chính hãng từ Nhật Bản và Hàn Quốc, cam kết đầy đủ bill mua hàng.", "expected": "rejected"},
        {"text": "Lớp học tiếng Anh giao tiếp cho người mất gốc, khai giảng khóa mới vào tuần sau, đăng ký ngay nhận ưu đãi 20% học phí.", "expected": "rejected"},
        
        # 16-20
        {"text": "Mì quảng ếch đường Lê Hồng Phong ăn đứt mấy chỗ khác. Thịt ếch dai ngon thấm gia vị nấu trong thố đất nóng hổi khói nghi ngút.", "expected": "approved"},
        {"text": "Khóa học lập trình Python web Django/FastAPI cho người mới bắt đầu từ con số 0, cam kết hỗ trợ việc làm sau tốt nghiệp.", "expected": "rejected"},
        {"text": "Lần đầu ăn thử phở cuốn Ngũ Xã, bánh phở mềm mướt cuộn thịt bò xào lăn thơm phức, chấm nước mắm tỏi ớt chua ngọt siêu cuốn.", "expected": "approved"},
        {"text": "Thanh lý tủ lạnh Panasonic 250 lít không đóng tuyết, máy còn mới 95%, bảo hành 6 tháng tại nhà.", "expected": "rejected"},
        {"text": "Quán cà phê view hồ Tây này nước uống cũng tạm ổn nhưng được cái không gian chụp ảnh sống ảo rất đẹp, nhiều góc decor xịn sò.", "expected": "approved"}
    ]

    for i, post in enumerate(posts, 1):
        test_moderation(i, post["text"], post["expected"])
