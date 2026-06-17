import os
import sys

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

def run_hf_test():
    print("=========================================================")
    print("🚀 BẮT ĐẦU KIỂM TRA AI MODERATION HUGGING FACE 🚀")
    print("=========================================================")
    
    print(f"HUGGINGFACE_API_KEY: {settings.HUGGINGFACE_API_KEY[:10]}... (Độ dài: {len(settings.HUGGINGFACE_API_KEY) if settings.HUGGINGFACE_API_KEY else 0})")
    print(f"HUGGINGFACE_MODEL_ID: {settings.HUGGINGFACE_MODEL_ID}")
    
    if not settings.HUGGINGFACE_API_KEY or "your_" in settings.HUGGINGFACE_API_KEY.lower():
        print("❌ LỖI: Chưa cấu hình HUGGINGFACE_API_KEY hợp lệ trong file config/.env")
        return

    # Kịch bản 1: Nội dung đồ ăn/ẩm thực (Nên được Approved)
    print("\n[TEST 1] Kiểm tra bài đăng VỀ ĐỒ ĂN (Kỳ vọng: approved)...")
    title_food = "Phở Bò Gia Truyền thơm ngon nức tiếng Hà Nội"
    desc_food = "Hôm nay mình đi ăn thử quán phở gia truyền này ngon lắm, nước dùng ngọt xương bò, thịt bò tươi mềm."
    
    result_food = moderate_content_huggingface(title=title_food, description=desc_food)
    print(f"=> Kết quả trả về: '{result_food}'")
    if result_food == "approved":
        print("✅ ĐẠT: AI đã nhận diện đúng chủ đề ẩm thực và DUYỆT (approved)!")
    elif result_food == "pending":
        print("⚠️ CẢNH BÁO: AI đang ở trạng thái pending (Lỗi mạng hoặc API quá tải).")
    else:
        print("❌ LỖI: AI đã TỪ CHỐI bài viết đồ ăn!")

    # Kịch bản 2: Rao vặt bất động sản (Kỳ vọng: rejected)
    print("\n[TEST 2] Kiểm tra bài đăng RAO VẶT BẤT ĐỘNG SẢN (Kỳ vọng: rejected)...")
    title_real_estate = "Bán đất nền dự án trung tâm thành phố giá cực sốc"
    desc_real_estate = "Cơ hội đầu tư sinh lời cao, đất nền phân lô diện tích 100m2, sổ đỏ chính chủ, vị trí đắc địa gần trung tâm thương mại."
    
    result_real_estate = moderate_content_huggingface(title=title_real_estate, description=desc_real_estate)
    print(f"=> Kết quả trả về: '{result_real_estate}'")
    if result_real_estate == "rejected":
        print("✅ ĐẠT: AI đã từ chối bài viết bất động sản thành công (rejected)!")
    elif result_real_estate == "pending":
        print("⚠️ CẢNH BÁO: AI đang ở trạng thái pending.")
    else:
        print("❌ LỖI: AI đã DUYỆT bài viết bất động sản không liên quan!")

    # Kịch bản 3: Tuyển dụng (Kỳ vọng: rejected)
    print("\n[TEST 3] Kiểm tra bài đăng TUYỂN DỤNG (Kỳ vọng: rejected)...")
    title_job = "Tuyển dụng Lập trình viên Python lương cao ngất ngưởng"
    desc_job = "Chúng tôi đang tìm kiếm 2 lập trình viên Python Backend có từ 2 năm kinh nghiệm, làm việc trong môi trường chuyên nghiệp, chế độ đãi ngộ tốt."
    
    result_job = moderate_content_huggingface(title=title_job, description=desc_job)
    print(f"=> Kết quả trả về: '{result_job}'")
    if result_job == "rejected":
        print("✅ ĐẠT: AI đã từ chối bài viết tuyển dụng thành công (rejected)!")
    elif result_job == "pending":
        print("⚠️ CẢNH BÁO: AI đang ở trạng thái pending.")
    else:
        print("❌ LỖI: AI đã DUYỆT bài viết tuyển dụng không liên quan!")

if __name__ == "__main__":
    run_hf_test()
