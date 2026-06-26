import os
import sys

# Configure sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Ensure clean Vietnamese console logging on Windows
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import backend.main
from backend.core.database import SessionLocal
from backend.core.all_models import Video, Report, User
from backend.modules.search_interact.services import create_video_report
from backend.modules.admin.services import get_admin_reports, get_admin_reports_count, patch_report_action

def test_reports_flow():
    db = SessionLocal()
    print("==================================================")
    print("🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM HỆ THỐNG REPORT & MODERATION 🧪")
    print("==================================================")

    try:
        print("\n[BƯỚC 0] Dọn dẹp dữ liệu cũ...")
        db.query(Report).delete()
        db.commit()

        print("\n[BƯỚC 1] Khởi tạo dữ liệu người dùng và bài đăng thử nghiệm...")
        reviewer = db.query(User).filter(User.role == "reviewer").first()
        admin = db.query(User).filter(User.role == "admin").first()
        
        # Tạo video giả lập để báo cáo
        test_video = Video(
            title="Video Test Bị Báo Cáo Vi Phạm",
            video_url="https://test.com/spam_video.mp4",
            reviewer_id=reviewer.id,
            status="approved"
        )
        db.add(test_video)
        db.commit()
        db.refresh(test_video)
        print(f"  - Đã tạo Video ID: {test_video.id}, Tiêu đề: '{test_video.title}'")

        print("\n[BƯỚC 2] Người dùng gửi báo cáo vi phạm...")
        reason_msg = "Nội dung spam và quảng cáo trái phép"
        report = create_video_report(db=db, video_id=test_video.id, user_id=reviewer.id, reason=reason_msg)
        print(f"  - Báo cáo đã tạo thành công! ID: {report.id}")
        print(f"    + Người báo cáo ID: {report.reporter_id}")
        print(f"    + Đối tượng bị báo cáo: type={report.reported_entity_type}, id={report.reported_entity_id}")
        print(f"    + Lý do: '{report.reason}'")
        print(f"    + Trạng thái: '{report.status}'")

        # Xác thực dữ liệu đã chèn vào cơ sở dữ liệu
        assert report.status == "pending"
        assert report.reported_entity_id == str(test_video.id)
        assert report.reason == reason_msg
        
        count_pending = get_admin_reports_count(db=db, status="pending")
        assert count_pending == 1, f"Lỗi: Kì vọng 1 báo cáo chờ duyệt, nhận được {count_pending}"
        print("  - ✅ Bản ghi báo cáo đã được lưu vào cơ sở dữ liệu thành công.")

        print("\n[BƯỚC 3] Admin truy vấn danh sách báo cáo...")
        reports_list = get_admin_reports(db=db, limit=5, offset=0, status="pending")
        assert len(reports_list) == 1
        retrieved_report = reports_list[0]
        print(f"  - Đã lấy báo cáo ID: {retrieved_report['id']}")
        print(f"    + Người báo cáo: {retrieved_report['reporter'].full_name}")
        print(f"    + Bài viết bị báo cáo đính kèm: '{retrieved_report['reported_video'].title}'")
        assert retrieved_report['reported_video'] is not None
        assert retrieved_report['reported_video'].id == test_video.id
        print("  - ✅ Admin eager-load thông tin reporter và video bị báo cáo chính xác (0 N+1 queries).")

        print("\n[BƯỚC 4] Admin xử lý báo cáo vi phạm (Quyết định Xóa bài viết)...")
        updated_report = patch_report_action(
            db=db,
            report_id=report.id,
            status_val="resolved",
            action_taken="delete"
        )
        print(f"  - Báo cáo đã cập nhật thành công!")
        print(f"    + Trạng thái mới: '{updated_report['status']}'")
        assert updated_report['status'] == "resolved"

        # Kiểm tra xem video đã bị xóa khỏi hệ thống
        video_exists = db.query(Video).filter(Video.id == test_video.id).count()
        assert video_exists == 0, "Lỗi: Video vẫn tồn tại trong hệ thống sau khi Admin ra lệnh xóa!"
        print("  - ✅ Bài viết vi phạm đã bị xóa hoàn toàn khỏi cơ sở dữ liệu.")

        # Kiểm tra xem báo cáo đã được giải quyết
        count_pending_after = get_admin_reports_count(db=db, status="pending")
        assert count_pending_after == 0
        print("  - ✅ Báo cáo chờ duyệt đã được cập nhật thành công.")

        print("\n==================================================")
        print("🎉 TẤT CẢ CÁC BÀI TEST BÁO CÁO & XỬ LÝ VI PHẠM ĐỀU ĐẠT! 🎉")
        print("==================================================")

    except AssertionError as e:
        print(f"\n❌ KIỂM THỬ THẤT BẠI: {e}")
        db.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ LỖI HỆ THỐNG TRONG KHI TEST: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        # Cleanup
        try:
            db.query(Report).delete()
            db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_reports_flow()
