import os
import sys
import unittest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Đảm bảo các thư mục cần thiết nằm trong sys.path để import
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
workspace_dir = os.path.dirname(backend_dir)
if workspace_dir not in sys.path:
    sys.path.append(workspace_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from backend.core.database import Base, get_db
from backend.core.all_models import User, Merchant, Video
from backend.main import app

class BaseContentTest(unittest.TestCase):
    def setUp(self):
        # 1. Khởi tạo SQLite in-memory test chuyên biệt với StaticPool để tránh lỗi file lock trên Windows
        from sqlalchemy.pool import StaticPool
        self.engine = create_engine(
            "sqlite://", 
            connect_args={"check_same_thread": False}, 
            poolclass=StaticPool
        )
        self.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # 2. Tạo cấu trúc DB
        Base.metadata.create_all(bind=self.engine)
        self.db = self.TestingSessionLocal()
        
        # 3. Seed người dùng test
        self.user = User(
            firebase_uid="test_user_uid",
            email="user@test.com",
            full_name="Test User",
            role="reviewer"
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

        # 4. Override dependency get_db
        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()
                
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # 5. Mock Firebase authentication token
        def mock_verify_id_token(token, *args, **kwargs):
            if token == "mock_token_test_user_uid":
                return {"uid": "test_user_uid", "email": "user@test.com", "name": "Test User"}
            raise Exception("Invalid mock token in test")
            
        self.verify_patcher = patch("backend.core.security.auth.verify_id_token", side_effect=mock_verify_id_token)
        self.verify_patcher.start()

    def tearDown(self):
        self.verify_patcher.stop()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        app.dependency_overrides.clear()

class TestContentRouter(BaseContentTest):
    def test_get_status(self):
        response = self.client.get("/api/content/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["module"], "content")
        
    @patch("backend.modules.content.services.get_r2_client")
    def test_generate_presigned_url_success(self, mock_get_client):
        # Mock hàm generate_presigned_url của S3 client
        mock_s3 = mock_get_client.return_value
        mock_s3.generate_presigned_url.return_value = "https://mock-r2-upload-url.com/put"
        
        headers = {"Authorization": "Bearer mock_token_test_user_uid"}
        payload = {
            "file_name": "review.mp4",
            "content_type": "video/mp4",
            "folder": "videos"
        }
        
        # Patch thêm config settings cho R2
        with patch("backend.core.config.settings.CLOUDFLARE_R2_PUBLIC_URL", "https://media.foodspot.club"), \
             patch("backend.core.config.settings.CLOUDFLARE_R2_BUCKET_NAME", "my-bucket"):
            
            response = self.client.post("/api/content/presigned-url", json=payload, headers=headers)
            self.assertEqual(response.status_code, 201)
            
            data = response.json()
            self.assertEqual(data["upload_url"], "https://mock-r2-upload-url.com/put")
            self.assertIn("https://media.foodspot.club/videos/", data["public_url"])
            self.assertTrue(data["key"].startswith("videos/"))

    def test_create_video_success(self):
        headers = {"Authorization": "Bearer mock_token_test_user_uid"}
        payload = {
            "title": "Bún chả siêu ngon",
            "video_url": "https://media.foodspot.club/videos/review1.mp4",
            "thumbnail_url": "https://media.foodspot.club/thumbnails/review1.jpg",
            "description": "Nước dùng đậm đà, thịt nướng thơm phức."
        }
        
        response = self.client.post("/api/content/videos", json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertEqual(data["title"], "Bún chả siêu ngon")
        self.assertEqual(data["reviewer_id"], self.user.id)
        self.assertEqual(data["status"], "pending")
        self.assertIsNone(data["tagged_merchant_id"])
        
        # Kiểm tra trực tiếp dữ liệu lưu trong DB
        video = self.db.query(Video).filter(Video.id == data["id"]).first()
        self.assertIsNotNone(video)
        self.assertEqual(video.title, "Bún chả siêu ngon")

    def test_create_video_merchant_not_found(self):
        headers = {"Authorization": "Bearer mock_token_test_user_uid"}
        payload = {
            "title": "Bún chả siêu ngon",
            "video_url": "https://media.foodspot.club/videos/review1.mp4",
            "tagged_merchant_id": 9999
        }
        
        response = self.client.post("/api/content/videos", json=payload, headers=headers)
        self.assertEqual(response.status_code, 404)
        self.assertIn("không tồn tại", response.json()["detail"])

    def test_create_video_merchant_id_zero(self):
        """Kiểm tra khi gửi tagged_merchant_id=0, hệ thống tự hiểu là không gắn thẻ và lưu thành công"""
        headers = {"Authorization": "Bearer mock_token_test_user_uid"}
        payload = {
            "title": "Bún chả siêu ngon",
            "video_url": "https://media.foodspot.club/videos/review1.mp4",
            "tagged_merchant_id": 0
        }
        
        response = self.client.post("/api/content/videos", json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertIsNone(data["tagged_merchant_id"])
        
    def test_list_videos_success(self):
        # Tạo sẵn các video trong DB test
        video1 = Video(title="Video 1", video_url="https://...", reviewer_id=self.user.id, status="approved")
        video2 = Video(title="Video 2", video_url="https://...", reviewer_id=self.user.id, status="approved")
        self.db.add_all([video1, video2])
        self.db.commit()
        
        response = self.client.get("/api/content/videos")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("items", data)
        self.assertIn("next_cursor", data)
        self.assertEqual(len(data["items"]), 2)
        
        titles = [v["title"] for v in data["items"]]
        self.assertIn("Video 1", titles)
        self.assertIn("Video 2", titles)

if __name__ == "__main__":
    unittest.main()
