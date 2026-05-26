import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch, mock_open

# Thêm path để import backend
import sys
if sys.platform.startswith("win"):
    import io
    if getattr(sys.stdout, "encoding", "").lower() != "utf-8":
        try:
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        except (AttributeError, ValueError):
            pass

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
workspace_dir = os.path.dirname(backend_dir)
if workspace_dir not in sys.path:
    sys.path.append(workspace_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from backend.core.config import Settings, CORE_DIR


class TestConfigSettings(unittest.TestCase):
    
    def setUp(self):
        # Lưu trữ các biến môi trường để khôi phục sau mỗi test
        self.env_backup = dict(os.environ)

    def tearDown(self):
        # Khôi phục các biến môi trường ban đầu
        os.environ.clear()
        os.environ.update(self.env_backup)

    def test_cors_origins_comma_separated(self):
        """Test parse CORS_ORIGINS dạng chuỗi phân cách bởi dấu phẩy"""
        settings = Settings(CORS_ORIGINS="http://localhost:3000, http://example.com ,https://foo.bar")
        self.assertEqual(
            settings.CORS_ORIGINS,
            ["http://localhost:3000", "http://example.com", "https://foo.bar"]
        )

    def test_cors_origins_json_array(self):
        """Test parse CORS_ORIGINS dạng JSON array hợp lệ"""
        json_str = '["http://localhost:3000", "http://example.com", "https://foo.bar"]'
        settings = Settings(CORS_ORIGINS=json_str)
        self.assertEqual(
            settings.CORS_ORIGINS,
            ["http://localhost:3000", "http://example.com", "https://foo.bar"]
        )

    def test_cors_origins_invalid_json_fallback(self):
        """Test parse CORS_ORIGINS dạng JSON array không hợp lệ, fallback sang dấu phẩy"""
        invalid_json_str = '["http://localhost:3000", "http://example.com"'
        settings = Settings(CORS_ORIGINS=invalid_json_str)
        # Sẽ fallback sang split bằng dấu phẩy
        self.assertEqual(
            settings.CORS_ORIGINS,
            ['["http://localhost:3000"', '"http://example.com"']
        )

    def test_cors_origins_empty_string(self):
        """Test parse CORS_ORIGINS khi là chuỗi rỗng"""
        settings = Settings(CORS_ORIGINS="")
        self.assertEqual(settings.CORS_ORIGINS, [])
        
        settings_spaces = Settings(CORS_ORIGINS="   ")
        self.assertEqual(settings_spaces.CORS_ORIGINS, [])

    def test_cors_origins_list_input(self):
        """Test parse CORS_ORIGINS khi truyền trực tiếp một list"""
        settings = Settings(CORS_ORIGINS=[" http://localhost:3000 ", "  http://example.com  ", ""])
        self.assertEqual(
            settings.CORS_ORIGINS,
            ["http://localhost:3000", "http://example.com"]
        )

    def test_database_url_provided(self):
        """Test DATABASE_URL khi được cung cấp giá trị hợp lệ"""
        db_url = "postgresql://postgres:password@localhost:5432/food_review"
        settings = Settings(DATABASE_URL=db_url)
        self.assertEqual(settings.DATABASE_URL, db_url)

    def test_database_url_fallback(self):
        """Test DATABASE_URL lùi về SQLite khi giá trị rỗng hoặc None"""
        expected_sqlite_path = f"sqlite:///{str(CORE_DIR.parent / 'food_review.db')}"
        
        settings_empty = Settings(DATABASE_URL="")
        self.assertEqual(settings_empty.DATABASE_URL, expected_sqlite_path)
        
        settings_spaces = Settings(DATABASE_URL="   ")
        self.assertEqual(settings_spaces.DATABASE_URL, expected_sqlite_path)

    def test_firebase_credentials_json_string(self):
        """Test FIREBASE_CREDENTIALS được nạp trực tiếp qua chuỗi JSON trong biến môi trường"""
        cred_dict = {
            "type": "service_account",
            "project_id": "test-project-123",
            "private_key": "some-key"
        }
        cred_json = json.dumps(cred_dict)
        settings = Settings(FIREBASE_CREDENTIALS=cred_json)
        self.assertEqual(settings.FIREBASE_CREDENTIALS, cred_dict)

    def test_firebase_credentials_invalid_json_string(self):
        """Test FIREBASE_CREDENTIALS khi truyền chuỗi JSON lỗi (sẽ log cảnh báo và fallback về đọc file)"""
        with patch("pathlib.Path.exists", return_value=False):
            settings = Settings(FIREBASE_CREDENTIALS="invalid-json-string{")
            self.assertEqual(settings.FIREBASE_CREDENTIALS, {})

    def test_firebase_credentials_from_file_success(self):
        """Test nạp file Firebase credential thành công"""
        cred_dict = {
            "type": "service_account",
            "project_id": "file-project",
            "private_key": "file-key"
        }
        mock_file_content = json.dumps(cred_dict)
        
        # Mock file tồn tại và đọc thành công
        with patch("pathlib.Path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data=mock_file_content)):
            settings = Settings(FIREBASE_CREDENTIALS="")
            self.assertEqual(settings.FIREBASE_CREDENTIALS, cred_dict)

    def test_firebase_credentials_from_file_invalid_json(self):
        """Test nạp file Firebase credential nhưng file chứa JSON không hợp lệ"""
        with patch("pathlib.Path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data="invalid-json")):
            settings = Settings(FIREBASE_CREDENTIALS="")
            self.assertEqual(settings.FIREBASE_CREDENTIALS, {})

    def test_firebase_credentials_file_not_found(self):
        """Test nạp file Firebase credential khi file không tồn tại"""
        with patch("pathlib.Path.exists", return_value=False):
            settings = Settings(FIREBASE_CREDENTIALS="")
            self.assertEqual(settings.FIREBASE_CREDENTIALS, {})

    def test_firebase_credentials_custom_path_env(self):
        """Test tìm file Firebase config qua đường dẫn custom chỉ định bởi FIREBASE_CONFIG_PATH env"""
        custom_path = "/path/to/custom_firebase.json"
        os.environ["FIREBASE_CONFIG_PATH"] = custom_path
        
        cred_dict = {"project_id": "custom-path-project"}
        mock_file_content = json.dumps(cred_dict)

        original_exists = Path.exists
        def mock_exists(self):
            # Chuẩn hóa path so sánh cho cả Windows và Unix
            return str(self).replace("\\", "/") == custom_path.replace("\\", "/")

        with patch.object(Path, "exists", mock_exists), \
             patch("builtins.open", mock_open(read_data=mock_file_content)):
            settings = Settings(FIREBASE_CREDENTIALS="")
            self.assertEqual(settings.FIREBASE_CREDENTIALS, cred_dict)

    def test_database_url_fallback_disabled(self):
        """Test DATABASE_URL ném lỗi khi ENABLE_DB_FALLBACK=False và không có DATABASE_URL"""
        from pydantic import ValidationError
        with self.assertRaises(ValidationError) as context:
            Settings(DATABASE_URL="", ENABLE_DB_FALLBACK=False)
        self.assertIn("cơ chế tự động fallback về SQLite đang tắt", str(context.exception))


if __name__ == "__main__":
    unittest.main()
