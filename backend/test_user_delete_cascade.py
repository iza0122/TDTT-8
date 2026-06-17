import os
import sys

# Configure sys.path to resolve backend imports correctly
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

import backend.main  # Trigger startup migrations to ensure columns exist
from backend.core.database import SessionLocal
from backend.core.all_models import Video, Like, Comment, User, Merchant, Menu
from backend.modules.identity.services import delete_user_account

def test_user_delete_cascade():
    db = SessionLocal()
    print("==================================================")
    print("🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM XÓA TÀI KHOẢN CASCADE 🧪")
    print("==================================================")

    try:
        print("\n[BƯỚC 0] Dọn dẹp dữ liệu cũ nếu có...")
        db.query(User).filter(User.firebase_uid.in_(["test_owner_uid_12345", "test_reviewer_uid_12345"])).delete(synchronize_session=False)
        db.commit()

        print("\n[BƯỚC 1] Khởi tạo dữ liệu người dùng thử nghiệm...")
        # Tạo 2 người dùng: 1 merchant và 1 reviewer
        test_owner = User(
            firebase_uid="test_owner_uid_12345",
            email="owner_test@foodspot.local",
            full_name="Chủ quán ăn Test",
            role="merchant"
        )
        test_reviewer = User(
            firebase_uid="test_reviewer_uid_12345",
            email="reviewer_test@foodspot.local",
            full_name="Reviewer Test",
            role="reviewer"
        )
        db.add_all([test_owner, test_reviewer])
        db.commit()
        db.refresh(test_owner)
        db.refresh(test_reviewer)
        print(f"  - Đã tạo Owner ID: {test_owner.id}, Reviewer ID: {test_reviewer.id}")

        print("\n[BƯỚC 2] Tạo quán ăn, thực đơn và video gắn thẻ...")
        test_merchant = Merchant(
            name="Quán cơm tấm Test Cascade",
            address="123 Đường Test, Quận 1",
            latitude=10.7769,
            longitude=106.7009,
            description="Quán cơm tấm ngon thử nghiệm",
            owner_id=test_owner.id,
            slogan="Ngon hết nấc",
            hours="08:00 - 22:00",
            phone="0909090909",
            email="comtamtest@gmail.com"
        )
        db.add(test_merchant)
        db.commit()
        db.refresh(test_merchant)
        print(f"  - Đã tạo Merchant ID: {test_merchant.id} với slogan: '{test_merchant.slogan}'")

        test_menu_item = Menu(
            merchant_id=test_merchant.id,
            dish_name="Cơm tấm sườn bì chả",
            price=45000,
            category="Món chính",
            description="Món ăn chính của quán cơm tấm"
        )
        db.add(test_menu_item)
        db.commit()
        db.refresh(test_menu_item)
        print(f"  - Đã tạo Menu Item ID: {test_menu_item.id} thuộc danh mục '{test_menu_item.category}'")

        # Tạo video của reviewer gắn thẻ quán ăn này
        test_video = Video(
            title="Review Cơm Tấm ngon hết nấc",
            video_url="https://test.com/video.mp4",
            reviewer_id=test_reviewer.id,
            tagged_merchant_id=test_merchant.id,
            status="approved"
        )
        db.add(test_video)
        db.commit()
        db.refresh(test_video)
        print(f"  - Đã tạo Video ID: {test_video.id} của Reviewer gắn thẻ Merchant ID: {test_merchant.id}")

        # Xác thực mọi thứ đã được tạo thành công
        assert db.query(User).filter(User.id == test_owner.id).count() == 1
        assert db.query(Merchant).filter(Merchant.id == test_merchant.id).count() == 1
        assert db.query(Menu).filter(Menu.id == test_menu_item.id).count() == 1
        assert db.query(Video).filter(Video.id == test_video.id).count() == 1
        print("  - ✅ Xác thực dữ liệu đã tồn tại trước khi xóa thành công.")

        print("\n[BƯỚC 3] Thực hiện xóa tài khoản Owner (Chủ quán)...")
        res = delete_user_account(db=db, user=test_owner)
        print(f"  - Kết quả service: {res}")

        print("\n[BƯỚC 4] Xác thực cơ sở dữ liệu sau khi xóa tài khoản Owner...")
        # 1. Chủ quán phải bị xóa
        assert db.query(User).filter(User.id == test_owner.id).count() == 0, "Chủ quán vẫn tồn tại!"
        print("  - ✅ Tài khoản Owner đã bị xóa.")

        # 2. Quán ăn của chủ quán phải bị xóa
        assert db.query(Merchant).filter(Merchant.id == test_merchant.id).count() == 0, "Quán ăn vẫn tồn tại!"
        print("  - ✅ Quán ăn của Owner đã bị xóa tự động.")

        # 3. Thực đơn của quán phải bị xóa
        assert db.query(Menu).filter(Menu.id == test_menu_item.id).count() == 0, "Món ăn trong thực đơn vẫn tồn tại!"
        print("  - ✅ Thực đơn của quán đã bị xóa tự động.")

        # 4. Video của reviewer khác gắn thẻ quán này không được bị xóa, nhưng tagged_merchant_id phải bị set về NULL
        db.refresh(test_video)
        assert test_video.tagged_merchant_id is None, "tagged_merchant_id không được set về NULL!"
        assert db.query(Video).filter(Video.id == test_video.id).count() == 1, "Video của reviewer bị xóa oan!"
        print("  - ✅ Video gắn thẻ của người khác được giữ lại và tagged_merchant_id được cập nhật về NULL thành công.")

        # Dọn dẹp dữ liệu của reviewer
        db.delete(test_video)
        db.delete(test_reviewer)
        db.commit()
        print("  - ✅ Đã dọn dẹp dữ liệu của reviewer thử nghiệm.")

        print("\n==================================================")
        print("🎉 TẤT CẢ CÁC BÀI TEST CHỨC NĂNG XÓA TÀI KHOẢN CASCADE ĐỀU ĐẠT! 🎉")
        print("==================================================")

    except AssertionError as e:
        print(f"\n❌ KIỂM THỬ THẤT BẠI: {e}")
        db.rollback()
        # Dọn dẹp
        try:
            o = db.query(User).filter(User.email == "owner_test@foodspot.local").first()
            if o:
                db.delete(o)
            r = db.query(User).filter(User.email == "reviewer_test@foodspot.local").first()
            if r:
                db.delete(r)
            db.commit()
        except:
            pass
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_user_delete_cascade()
