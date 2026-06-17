import math
import os
import sys
import unittest

# Đảm bảo các thư mục cần thiết nằm trong sys.path để import
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
workspace_dir = os.path.dirname(backend_dir)
if workspace_dir not in sys.path:
    sys.path.append(workspace_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Tránh lỗi bảng mã ký tự trên console Windows
if sys.platform.startswith("win"):
    import io
    if getattr(sys.stdout, "encoding", "").lower() != "utf-8":
        try:
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        except (AttributeError, ValueError):
            pass

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.core.database import Base, get_db
from backend.core.all_models import User, Merchant, Menu, Campaign
from backend.modules.merchant import services, schemas
from backend.main import app

class BaseMerchantTest(unittest.TestCase):
    def setUp(self):
        # 1. Khởi tạo file SQLite test chuyên biệt để chia sẻ giữa các session/connections
        self.db_file = os.path.join(backend_dir, "test_merchant.db")
        self.engine = create_engine(f"sqlite:///{self.db_file}", connect_args={"check_same_thread": False})
        
        # 2. Đăng ký các hàm lượng giác cho SQLite để tương thích với các logic liên quan khoảng cách
        @event.listens_for(self.engine, "connect")
        def connect(dbapi_connection, connection_record):
            if hasattr(dbapi_connection, "create_function"):
                dbapi_connection.create_function("radians", 1, lambda x: math.radians(x) if x is not None else None)
                dbapi_connection.create_function("cos", 1, lambda x: math.cos(x) if x is not None else None)
                dbapi_connection.create_function("sin", 1, lambda x: math.sin(x) if x is not None else None)
                dbapi_connection.create_function("acos", 1, lambda x: math.acos(x) if x is not None else None)

        self.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # 3. Tạo tất cả bảng cấu trúc DB
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        
        # 4. Tạo một session DB cho các hàm test trực tiếp
        self.db = self.TestingSessionLocal()
        
        # 5. Khởi tạo dữ liệu người dùng mẫu trong DB
        self.owner = User(
            firebase_uid="test_owner_uid",
            email="owner@test.com",
            full_name="Test Owner",
            role="merchant"
        )
        self.non_owner = User(
            firebase_uid="test_non_owner_uid",
            email="non_owner@test.com",
            full_name="Test Regular User",
            role="reviewer"
        )
        self.other_merchant = User(
            firebase_uid="test_other_merchant_uid",
            email="other_merchant@test.com",
            full_name="Other Merchant",
            role="merchant"
        )
        self.admin = User(
            firebase_uid="test_admin_uid",
            email="admin@test.com",
            full_name="Test Admin",
            role="admin"
        )
        self.db.add(self.owner)
        self.db.add(self.non_owner)
        self.db.add(self.other_merchant)
        self.db.add(self.admin)
        self.db.commit()
        self.db.refresh(self.owner)
        self.db.refresh(self.non_owner)
        self.db.refresh(self.other_merchant)
        self.db.refresh(self.admin)

        # 6. Override dependency get_db của FastAPI để trả về Session DB test độc lập
        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()
        
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # 7. Mock Firebase auth.verify_id_token cho các token test
        from unittest.mock import patch
        def mock_verify_id_token(token, *args, **kwargs):
            if token == "mock_token_test_owner_uid":
                return {"uid": "test_owner_uid", "email": "owner@test.com", "name": "Test Owner"}
            elif token == "mock_token_test_non_owner_uid":
                return {"uid": "test_non_owner_uid", "email": "non_owner@test.com", "name": "Test Regular User"}
            elif token == "mock_token_test_other_merchant_uid":
                return {"uid": "test_other_merchant_uid", "email": "other_merchant@test.com", "name": "Other Merchant"}
            elif token == "mock_token_test_admin_uid":
                return {"uid": "test_admin_uid", "email": "admin@test.com", "name": "Test Admin"}
            raise Exception("Invalid mock token in test")
            
        self.verify_patcher = patch("backend.core.security.auth.verify_id_token", side_effect=mock_verify_id_token)
        self.verify_patcher.start()

    def tearDown(self):
        self.verify_patcher.stop()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        app.dependency_overrides.clear()
        
        # Xóa file DB test sau khi hoàn tất
        if hasattr(self, "db_file") and os.path.exists(self.db_file):
            try:
                os.remove(self.db_file)
            except Exception:
                pass


class TestMerchantServices(BaseMerchantTest):
    """
    Kiểm thử trực tiếp các hàm logic nghiệp vụ (Business logic) trong services.py
    """
    def test_create_merchant_success(self):
        merchant_in = schemas.MerchantCreate(
            name="Quán Ăn Ngon",
            address="123 Nguyễn Huệ, Q1",
            latitude=10.775,
            longitude=106.690,
            description="Món ăn Việt Nam truyền thống"
        )
        # Thực thi tạo merchant
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Kiểm tra kết quả lưu vào DB
        self.assertIsNotNone(db_merchant.id)
        self.assertEqual(db_merchant.name, "Quán Ăn Ngon")
        self.assertEqual(db_merchant.owner_id, self.owner.id)
        self.assertEqual(db_merchant.rating_avg, 0.0)
        self.assertTrue(db_merchant.is_active)
        
        # Kiểm tra hệ thống tự động tạo campaign mặc định
        campaign = self.db.query(Campaign).filter(Campaign.merchant_id == db_merchant.id).first()
        self.assertIsNotNone(campaign)
        self.assertEqual(campaign.title, f"QC Quán Ăn Ngon")
        self.assertFalse(campaign.is_active)
        
    def test_get_merchant_success(self):
        merchant_in = schemas.MerchantCreate(
            name="Quán Lẩu Dê",
            latitude=10.78,
            longitude=106.68
        )
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Lấy thông tin
        fetched = services.get_merchant(self.db, db_merchant.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.name, "Quán Lẩu Dê")
        
        # Thử lấy ID không tồn tại
        fetched_none = services.get_merchant(self.db, 9999)
        self.assertIsNone(fetched_none)

    def test_create_menu_item_success(self):
        merchant_in = schemas.MerchantCreate(name="Quán Chè", latitude=10.78, longitude=106.68)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        menu_in = schemas.MenuCreate(
            dish_name="Chè Thái",
            price=25000,
            is_available=True
        )
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)
        
        self.assertIsNotNone(db_menu.id)
        self.assertEqual(db_menu.dish_name, "Chè Thái")
        self.assertEqual(db_menu.price, 25000)
        self.assertTrue(db_menu.is_available)
        self.assertEqual(db_menu.merchant_id, db_merchant.id)

    def test_toggle_campaign_success(self):
        merchant_in = schemas.MerchantCreate(name="Bánh Xèo Cần Thơ", latitude=10.78, longitude=106.68)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Bật campaign
        services.toggle_campaign(self.db, db_merchant.id, is_active=True)
        campaign = self.db.query(Campaign).filter(Campaign.merchant_id == db_merchant.id).first()
        self.assertTrue(campaign.is_active)
        
        # Tắt campaign
        services.toggle_campaign(self.db, db_merchant.id, is_active=False)
        campaign_off = self.db.query(Campaign).filter(Campaign.merchant_id == db_merchant.id).first()
        self.assertFalse(campaign_off.is_active)
        
        # Toggle campaign không tồn tại
        res = services.toggle_campaign(self.db, 9999, is_active=True)
        self.assertIsNone(res)

    def test_get_stats_success(self):
        merchant_in = schemas.MerchantCreate(name="Quán Kem", latitude=10.78, longitude=106.68)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Cập nhật số click & impression để giả lập
        campaign = self.db.query(Campaign).filter(Campaign.merchant_id == db_merchant.id).first()
        campaign.impressions_count = 100
        campaign.clicks_count = 12
        self.db.commit()
        
        # Xem stats
        fetched_merchant, clicks, impressions = services.get_stats(self.db, db_merchant.id)
        self.assertEqual(fetched_merchant.id, db_merchant.id)
        self.assertEqual(clicks, 12)
        self.assertEqual(impressions, 100)
        
        # Thử với ID không tồn tại
        none_m, clicks, impressions = services.get_stats(self.db, 9999)
        self.assertIsNone(none_m)
        self.assertEqual(clicks, 0)
        self.assertEqual(impressions, 0)

    def test_update_menu_item_success(self):
        merchant_in = schemas.MerchantCreate(name="Quán Bún", latitude=10.78, longitude=106.68)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Bún Bò", price=35000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        # Cập nhật món ăn
        update_in = schemas.MenuUpdate(dish_name="Bún Bò Huế Đặc Biệt", price=45000, is_available=False)
        updated = services.update_menu_item(self.db, db_menu, update_in)

        self.assertEqual(updated.dish_name, "Bún Bò Huế Đặc Biệt")
        self.assertEqual(updated.price, 45000)
        self.assertFalse(updated.is_available)

    def test_delete_menu_item_success(self):
        merchant_in = schemas.MerchantCreate(name="Quán Nước", latitude=10.78, longitude=106.68)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Trà Đá", price=5000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        # Xóa món ăn
        services.delete_menu_item(self.db, db_menu)
        fetched = services.get_menu_item(self.db, db_menu.id)
        self.assertIsNone(fetched)


class TestMerchantRouter(BaseMerchantTest):
    """
    Kiểm thử tích hợp các endpoint HTTP trong router.py thông qua TestClient của FastAPI
    """
    def test_create_merchant_endpoint(self):
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        payload = {
            "name": "Bánh Mì Hà Nội",
            "address": "456 Lê Lợi, Q1",
            "latitude": 10.776,
            "longitude": 106.695,
            "description": "Bánh mì giòn rụm"
        }
        
        response = self.client.post("/api/merchant/", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        res_data = response.json()
        self.assertEqual(res_data["name"], "Bánh Mì Hà Nội")
        self.assertEqual(res_data["owner_id"], self.owner.id)
        self.assertEqual(res_data["location"]["lat"], 10.776)
        self.assertEqual(res_data["location"]["lng"], 106.695)

    def test_get_merchant_endpoint_success(self):
        # Tạo sẵn merchant trong DB test
        merchant_in = schemas.MerchantCreate(name="Bún Chả Cựu Kim Sơn", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        response = self.client.get(f"/api/merchant/{db_merchant.id}")
        self.assertEqual(response.status_code, 200)
        
        res_data = response.json()
        self.assertEqual(res_data["name"], "Bún Chả Cựu Kim Sơn")
        self.assertEqual(res_data["id"], db_merchant.id)

    def test_get_merchant_endpoint_not_found(self):
        response = self.client.get("/api/merchant/9999")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Merchant not found")

    def test_create_menu_endpoint_as_owner(self):
        # Tạo sẵn merchant trong DB test
        merchant_in = schemas.MerchantCreate(name="Trà Sữa KOI", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Thêm món với tài khoản của Owner -> thành công
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        menu_payload = {
            "dish_name": "Lục Trà Sữa",
            "price": 45000,
            "is_available": True
        }
        
        response = self.client.post(
            f"/api/merchant/{db_merchant.id}/menus", 
            json=menu_payload, 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertEqual(res_data["dish_name"], "Lục Trà Sữa")
        self.assertEqual(res_data["price"], 45000)

    def test_create_menu_endpoint_as_non_owner(self):
        # Tạo sẵn merchant trong DB test thuộc quyền của Owner
        merchant_in = schemas.MerchantCreate(name="Trà Sữa KOI", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Thêm món với tài khoản của một Merchant khác (không sở hữu quán này) -> Bị cấm (403)
        headers = {"Authorization": "Bearer mock_token_test_other_merchant_uid"}
        menu_payload = {
            "dish_name": "Trà Xanh Kỳ Lân",
            "price": 50000,
            "is_available": True
        }
        
        response = self.client.post(
            f"/api/merchant/{db_merchant.id}/menus", 
            json=menu_payload, 
            headers=headers
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Chỉ chủ quán mới có quyền thêm món")

    def test_create_menu_endpoint_as_reviewer_forbidden(self):
        # Tạo sẵn merchant trong DB test thuộc quyền của Owner
        merchant_in = schemas.MerchantCreate(name="Trà Sữa KOI", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Thêm món với tài khoản reviewer (không có role merchant) -> Bị chặn bởi RoleChecker (403)
        headers = {"Authorization": "Bearer mock_token_test_non_owner_uid"}
        menu_payload = {
            "dish_name": "Trà Xanh Kỳ Lân",
            "price": 50000,
            "is_available": True
        }
        
        response = self.client.post(
            f"/api/merchant/{db_merchant.id}/menus", 
            json=menu_payload, 
            headers=headers
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Quyền truy cập bị từ chối", response.json()["detail"])

    def test_create_menu_endpoint_merchant_not_found(self):
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        menu_payload = {
            "dish_name": "Trà Xanh Kỳ Lân",
            "price": 50000,
            "is_available": True
        }
        response = self.client.post(
            "/api/merchant/9999/menus", 
            json=menu_payload, 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Merchant not found")

    def test_toggle_campaign_endpoint(self):
        merchant_in = schemas.MerchantCreate(name="Quán Nướng ngói", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        # Bật chiến dịch qua endpoint
        response = self.client.patch(
            f"/api/merchant/{db_merchant.id}/campaigns/toggle?is_active=true", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Campaign updated")
        self.assertTrue(response.json()["is_active"])

    def test_toggle_campaign_endpoint_not_found(self):
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        response = self.client.patch(
            "/api/merchant/9999/campaigns/toggle?is_active=true", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Merchant not found")

    def test_get_stats_endpoint(self):
        merchant_in = schemas.MerchantCreate(name="Quán Sinh Tố", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        
        # Thêm hoạt động chiến dịch thủ công
        campaign = self.db.query(Campaign).filter(Campaign.merchant_id == db_merchant.id).first()
        campaign.impressions_count = 250
        campaign.clicks_count = 37
        self.db.commit()

        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        response = self.client.get(f"/api/merchant/{db_merchant.id}/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        res_data = response.json()
        self.assertEqual(res_data["total_clicks"], 37)
        self.assertEqual(res_data["total_ad_impressions"], 250)

    def test_get_stats_endpoint_not_found(self):
        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        response = self.client.get("/api/merchant/9999/stats", headers=headers)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Merchant not found")

    def test_create_merchant_endpoint_as_reviewer_forbidden(self):
        headers = {"Authorization": "Bearer mock_token_test_non_owner_uid"} # reviewer
        payload = {
            "name": "Quán Cơm Bình Dân",
            "latitude": 10.776,
            "longitude": 106.695
        }
        response = self.client.post("/api/merchant/", json=payload, headers=headers)
        self.assertEqual(response.status_code, 403)
        self.assertIn("Quyền truy cập bị từ chối", response.json()["detail"])

    def test_create_merchant_endpoint_as_admin_success(self):
        headers = {"Authorization": "Bearer mock_token_test_admin_uid"} # admin
        payload = {
            "name": "Quán Cơm Hoàn Mỹ",
            "latitude": 10.776,
            "longitude": 106.695
        }
        response = self.client.post("/api/merchant/", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Quán Cơm Hoàn Mỹ")

    def test_toggle_campaign_endpoint_as_admin_success(self):
        merchant_in = schemas.MerchantCreate(name="Trà Sữa Admin", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id) # Owned by Owner, not Admin

        headers = {"Authorization": "Bearer mock_token_test_admin_uid"} # Admin bypasses ownership
        response = self.client.patch(
            f"/api/merchant/{db_merchant.id}/campaigns/toggle?is_active=true", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Campaign updated")
        self.assertTrue(response.json()["is_active"])

    def test_update_menu_endpoint_as_owner(self):
        merchant_in = schemas.MerchantCreate(name="Bánh Mì Huỳnh Hoa", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Bánh Mì Đặc Biệt", price=55000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        payload = {
            "dish_name": "Bánh Mì Thượng Hạng",
            "price": 60000,
            "is_available": False
        }
        response = self.client.patch(
            f"/api/merchant/{db_merchant.id}/menus/{db_menu.id}",
            json=payload,
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertEqual(res_data["dish_name"], "Bánh Mì Thượng Hạng")
        self.assertEqual(res_data["price"], 60000)
        self.assertFalse(res_data["is_available"])

    def test_update_menu_endpoint_as_non_owner_forbidden(self):
        merchant_in = schemas.MerchantCreate(name="Bánh Mì Huỳnh Hoa", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Bánh Mì Đặc Biệt", price=55000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        headers = {"Authorization": "Bearer mock_token_test_other_merchant_uid"}
        payload = {
            "dish_name": "Bánh Mì Thượng Hạng",
            "price": 60000
        }
        response = self.client.patch(
            f"/api/merchant/{db_merchant.id}/menus/{db_menu.id}",
            json=payload,
            headers=headers
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Chỉ chủ quán mới có quyền cập nhật món ăn")

    def test_delete_menu_endpoint_as_owner(self):
        merchant_in = schemas.MerchantCreate(name="Hủ Tiếu Nam Vang", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Hủ Tiếu Khô", price=45000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        headers = {"Authorization": "Bearer mock_token_test_owner_uid"}
        response = self.client.delete(
            f"/api/merchant/{db_merchant.id}/menus/{db_menu.id}",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Menu item deleted successfully")

        # Kiểm tra không tìm thấy trong DB nữa
        fetched = services.get_menu_item(self.db, db_menu.id)
        self.assertIsNone(fetched)

    def test_delete_menu_endpoint_as_non_owner_forbidden(self):
        merchant_in = schemas.MerchantCreate(name="Hủ Tiếu Nam Vang", latitude=10.77, longitude=106.69)
        db_merchant = services.create_merchant(self.db, merchant_in, self.owner.id)
        menu_in = schemas.MenuCreate(dish_name="Hủ Tiếu Khô", price=45000, is_available=True)
        db_menu = services.create_menu_item(self.db, db_merchant.id, menu_in)

        headers = {"Authorization": "Bearer mock_token_test_other_merchant_uid"}
        response = self.client.delete(
            f"/api/merchant/{db_merchant.id}/menus/{db_menu.id}",
            headers=headers
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "Chỉ chủ quán mới có quyền xóa món ăn")


if __name__ == "__main__":
    unittest.main()
