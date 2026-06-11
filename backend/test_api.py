import os
import sys

# Configure sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Tránh UnicodeEncodeError trên console Windows khi in ký tự tiếng Việt
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import backend.main
from backend.core.database import SessionLocal
from backend.core.all_models import Video, Like, Comment, Merchant, User, CommentLike
from backend.modules.search_interact import services, schemas
from backend.modules.identity import services as identity_services

def run_tests():
    print("==================================================")
    print("🚀 BẮT ĐẦU CHẠY THỬ NGHIỆM HỆ THỐNG SERVICES BE4 🚀")
    print("==================================================")

    db = SessionLocal()
    try:
        # --- TEST 1: Geo-Search Service (Haversine SQL) ---
        print("\n[TEST 1] Thử nghiệm Geo-Search Service (Công thức Haversine SQL)...")
        # Central coordinates in District 1/3 HCMC: lat=10.775, lng=106.690
        lat, lng = 10.775, 106.690
        radius = 5.0 # 5 km
        
        merchants = services.geo_search_merchants(
            db=db,
            q=None,
            lat=lat,
            lng=lng,
            radius=radius,
            limit=5,
            offset=0
        )
        
        assert len(merchants) > 0, "Không tìm thấy quán ăn nào trong bán kính 5km!"
        print(f"-> Thành công! Tìm thấy {len(merchants)} quán ăn trong bán kính 5km:")
        
        for idx, merchant in enumerate(merchants):
            print(f"   {idx+1}. {merchant['name']} - Khoảng cách: {merchant['distance']} km (Vị trí: {merchant['latitude']}, {merchant['longitude']}) - Rating: {merchant['rating_avg']}")
            assert merchant['distance'] <= radius, "Khoảng cách vượt quá bán kính lọc!"
            assert "rating_avg" in merchant, "rating_avg không có trong kết quả tìm kiếm!"
            assert 3.5 <= merchant['rating_avg'] <= 5.0, "rating_avg không nằm trong khoảng hợp lệ!"
            # Verify distance is sorted ascending
            if idx > 0:
                assert merchant['distance'] >= merchants[idx-1]['distance'], "Thứ tự khoảng cách chưa được sắp xếp tăng dần!"

        # Test Geo-Search with keyword search
        kw = "Phở"
        merchants_kw = services.geo_search_merchants(
            db=db,
            q=kw,
            lat=lat,
            lng=lng,
            radius=15.0,
            limit=5,
            offset=0
        )
        print(f"-> Thành công! Tìm kiếm từ khóa '{kw}' trong bán kính 15km tìm thấy {len(merchants_kw)} quán:")
        for m in merchants_kw:
            print(f"   - {m['name']} ({m['distance']} km) - Mô tả: {m['description'][:60]}...")
            assert kw.lower() in m['name'].lower() or kw.lower() in m['description'].lower(), "Mô tả hoặc tên không chứa từ khóa tìm kiếm!"


        # --- TEST 2: Video Like Service ---
        print("\n[TEST 2] Thử nghiệm Thả tim Video (Like Service)...")
        video = db.query(Video).first()
        assert video is not None, "Không tìm thấy video nào trong DB để test!"
        # Lấy 2 user thực tế trong DB thay vì hardcode ID để tránh lỗi ForeignKey do ID tăng tự động
        users_in_db = db.query(User).limit(2).all()
        assert len(users_in_db) >= 2, "Không tìm thấy đủ 2 users trong DB để test!"
        user_id = users_in_db[0].id
        second_user_id = users_in_db[1].id
        
        # Check initial database state
        like_in_db_before = db.query(Like).filter(Like.video_id == video.id, Like.user_id == user_id).first()
        initially_liked = like_in_db_before is not None
        initial_likes = db.query(Like).filter(Like.video_id == video.id).count()
        print(f"   Số lượt thích ban đầu của video ID {video.id}: {initial_likes} (User {user_id} đã thích chưa: {initially_liked})")

        # Toggle Like 1
        res1 = services.toggle_like(db=db, video_id=video.id, user_id=user_id)
        print(f"-> Thích lần 1 (Toggle): liked={res1.liked}, likes_count={res1.likes_count}, msg='{res1.message}'")
        
        # Verify state is inverted
        assert res1.liked == (not initially_liked), "Trạng thái like không đổi khi toggle!"
        assert res1.likes_count == initial_likes + (-1 if initially_liked else 1), "Số lượt thích không đổi đúng cách!"

        # Toggle Like 2 (Toggle back)
        res2 = services.toggle_like(db=db, video_id=video.id, user_id=user_id)
        print(f"-> Thích lần 2 (Toggle lại): liked={res2.liked}, likes_count={res2.likes_count}, msg='{res2.message}'")
        
        # Verify state toggles back to initial
        assert res2.liked == initially_liked, "Trạng thái like không quay lại ban đầu!"
        assert res2.likes_count == initial_likes, "Số lượt thích không trả lại đúng ban đầu!"


        # --- TEST 3: Comment Service ---
        print("\n[TEST 3] Thử nghiệm Bình luận phẳng (Comment Service)...")
        comment_input = schemas.CommentCreate(
            content="Món phở bò này nhìn quá đã luôn chủ thớt!",
            parent_id=None
        )
        
        # Create comment
        new_comment = services.create_comment(db=db, video_id=video.id, user_id=user_id, comment_data=comment_input)
        print(f"-> Tạo bình luận thành công! ID: {new_comment.id}, Nội dung: '{new_comment.content}'")
        assert new_comment.content == comment_input.content
        assert new_comment.parent_id is None
        
        # Create nested reply
        reply_input = schemas.CommentCreate(
            content="Chuẩn luôn bạn ơi, nhất định phải thử nha!",
            parent_id=new_comment.id
        )
        reply_comment = services.create_comment(db=db, video_id=video.id, user_id=second_user_id, comment_data=reply_input)
        print(f"-> Trả lời bình luận thành công! ID: {reply_comment.id}, Parent ID: {reply_comment.parent_id}, Nội dung: '{reply_comment.content}'")
        assert reply_comment.parent_id == new_comment.id


        # --- TEST 4: Get Comments Service ---
        print("\n[TEST 4] Thử nghiệm Lấy danh sách bình luận (Get Comments Service)...")
        comments = services.get_video_comments(db=db, video_id=video.id)
        print(f"-> Lấy thành công {len(comments)} bình luận phẳng cho video ID {video.id}.")
        
        # Check order is ascending (oldest first)
        for i in range(1, len(comments)):
            assert comments[i].created_at >= comments[i-1].created_at, "Bình luận chưa được sắp xếp theo thời gian tăng dần!"

        # Verify our new comments are in the DB
        found_main = any(c.id == new_comment.id for c in comments)
        # Vì get_video_comments hiện tại chỉ trả về các bình luận gốc để phục vụ dạng cây đệ quy,
        # bình luận trả lời (reply) sẽ nằm trong thuộc tính replies của bình luận gốc tương ứng.
        found_reply = False
        for c in comments:
            if c.id == new_comment.id:
                found_reply = any(r.id == reply_comment.id for r in c.replies)
                break
        assert found_main, "Bình luận chính vừa tạo không nằm trong danh sách trả về!"
        assert found_reply, "Bình luận trả lời vừa tạo không nằm trong thuộc tính replies của bình luận gốc!"

        # --- TEST 5: Geo-Search with Category Filtering ---
        print("\n[TEST 5] Thử nghiệm Geo-Search kết hợp lọc Danh mục (Phở)...")
        lat, lng = 10.775, 106.690
        merchants_cat = services.geo_search_merchants(
            db=db,
            q=None,
            lat=lat,
            lng=lng,
            radius=15.0,
            limit=5,
            offset=0,
            category="pho"
        )
        assert len(merchants_cat) > 0, "Không tìm thấy quán phở nào!"
        print(f"-> Thành công! Tìm thấy {len(merchants_cat)} quán phở:")
        for m in merchants_cat:
            print(f"   - {m['name']} - Danh mục: {m['category']}")
            assert m['category'] == "Phở", "Danh mục không chính xác!"

        # --- TEST 6: Thả tim Bình luận (Comment Like Toggle) ---
        print("\n[TEST 6] Thử nghiệm Thả tim Bình luận...")
        comment = db.query(Comment).first()
        assert comment is not None, "Không tìm thấy bình luận nào để test!"
        
        # Check initial state
        initial_comment_likes = comment.likes_count
        comment_like_in_db = db.query(CommentLike).filter(CommentLike.comment_id == comment.id, CommentLike.user_id == user_id).first()
        comment_initially_liked = comment_like_in_db is not None
        print(f"   Số lượt thích bình luận ban đầu: {initial_comment_likes} (User {user_id} đã thích chưa: {comment_initially_liked})")

        # Toggle comment like 1
        res_c1 = services.toggle_comment_like(db=db, comment_id=comment.id, user_id=user_id)
        print(f"-> Thích bình luận lần 1: liked={res_c1.liked}, likes_count={res_c1.likes_count}, msg='{res_c1.message}'")
        assert res_c1.liked == (not comment_initially_liked)
        assert res_c1.likes_count == initial_comment_likes + (-1 if comment_initially_liked else 1)

        # Toggle comment like 2 (Toggle back)
        res_c2 = services.toggle_comment_like(db=db, comment_id=comment.id, user_id=user_id)
        print(f"-> Thích bình luận lần 2 (Toggle lại): liked={res_c2.liked}, likes_count={res_c2.likes_count}, msg='{res_c2.message}'")
        assert res_c2.liked == comment_initially_liked
        assert res_c2.likes_count == initial_comment_likes

        # --- TEST 7: Bình luận phân cấp cây đệ quy ---
        print("\n[TEST 7] Thử nghiệm Lấy cây bình luận phân cấp...")
        # Tạo một bình luận gốc mới cho video
        root_comment_input = schemas.CommentCreate(
            content="Bình luận gốc cho cây đệ quy",
            parent_id=None
        )
        root_comment = services.create_comment(db=db, video_id=video.id, user_id=user_id, comment_data=root_comment_input)
        
        # Tạo các bình luận con lồng nhau
        child_comment_input = schemas.CommentCreate(
            content="Bình luận con lồng cấp 1",
            parent_id=root_comment.id
        )
        child_comment = services.create_comment(db=db, video_id=video.id, user_id=second_user_id, comment_data=child_comment_input)

        # Lấy danh sách bình luận (services trả về bình luận gốc)
        tree_comments = services.get_video_comments(db=db, video_id=video.id)
        assert len(tree_comments) > 0
        
        # Kiểm tra xem bình luận gốc có chứa bình luận con trong danh sách quan hệ hay không
        found_root = None
        for c in tree_comments:
            if c.id == root_comment.id:
                found_root = c
                break
        
        assert found_root is not None, "Không tìm thấy bình luận gốc vừa tạo!"
        assert len(found_root.replies) > 0, "Bình luận gốc không tự động nạp các bình luận con!"
        print(f"-> Thành công! Tìm thấy bình luận gốc ID {found_root.id} có {len(found_root.replies)} phản hồi con.")
        for r in found_root.replies:
            print(f"   - Phản hồi con ID {r.id}: '{r.content}' (Parent ID: {r.parent_id})")
            assert r.parent_id == root_comment.id

        # --- TEST 8: Hồ sơ cá nhân blogger & Thống kê ---
        print("\n[TEST 8] Thử nghiệm Lấy thông tin Hồ sơ cá nhân blogger & Thống kê...")
        profile = identity_services.get_user_profile(db=db, user_id=user_id)
        print(f"-> Thành công! Hồ sơ Blogger '{profile.full_name}' (ID: {profile.id}):")
        print(f"   - Tiểu sử: {profile.bio}")
        print(f"   - Người theo dõi: {profile.followers_count}")
        print(f"   - Đang theo dõi: {profile.following_count}")
        print(f"   - Số bài viết: {profile.posts_count}")
        print(f"   - Lượt thích nhận được: {profile.likes_received_count}")
        
        assert profile.id == user_id
        assert profile.followers_count >= 0
        assert profile.posts_count == len(profile.videos)

        print("\n==================================================")
        print("🎉 TẤT CẢ CÁC BÀI THỬ NGHIỆM ĐÃ VƯỢT QUA THÀNH CÔNG! 🎉")
        print("      Hệ thống Backend đã bổ sung đầy đủ chức năng.")
        print("==================================================")

    except Exception as e:
        print(f"\n❌ LỖI KHI CHẠY THỬ NGHIỆM: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
