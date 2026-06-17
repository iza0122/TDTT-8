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

from fastapi import HTTPException
from backend.core.database import SessionLocal
from backend.core.all_models import Video, Like, Comment, CommentLike, User, Merchant
from backend.modules.content.router import delete_video_post

def test_delete_cascade():
    db = SessionLocal()
    print("==================================================")
    print("🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM CHỨC NĂNG XÓA BÀI VIẾT (CASCADE DELETE - UNIT/ROUTER TEST) 🧪")
    print("==================================================")

    try:
        # Lấy 2 user thực tế trong CSDL để tránh vi phạm khoá ngoại
        users = db.query(User).limit(2).all()
        assert len(users) >= 2, "Cần ít nhất 2 người dùng trong cơ sở dữ liệu để thực hiện test!"
        owner = users[0]
        other_user = users[1]

        # Lấy 1 Merchant thực tế để gắn thẻ
        merchant = db.query(Merchant).first()
        merchant_id = merchant.id if merchant else None

        print(f"\n[BƯỚC 1] Khởi tạo bài viết thử nghiệm...")
        # Tạo bài viết thử nghiệm bằng SQLAlchemy ORM
        test_post = Video(
            title="Món ngon Quận 1 - Test Delete Cascade",
            video_url="https://pub-cf.foodiegram.dev/videos/test-delete-cascade.mp4",
            thumbnail_url="https://pub-cf.foodiegram.dev/thumbnails/test-delete-cascade.jpg",
            description="Mô tả bài viết thử nghiệm xóa cascade.",
            reviewer_id=owner.id,
            tagged_merchant_id=None,
            post_type="video",
            status="pending"
        )
        db.add(test_post)
        db.commit()
        db.refresh(test_post)
        post_id = test_post.id
        print(f"  - Đã tạo bài viết ID: {post_id} thành công.")

        print(f"\n[BƯỚC 2] Tạo các dữ liệu liên quan (Likes, Comments, CommentLikes, Replies)...")
        # 1. Tạo Like cho bài viết
        like1 = Like(user_id=owner.id, video_id=post_id)
        like2 = Like(user_id=other_user.id, video_id=post_id)
        db.add_all([like1, like2])
        test_post.likes_count = 2

        # 2. Tạo Comment cho bài viết
        comment = Comment(user_id=other_user.id, video_id=post_id, content="Nhìn ngon quá bạn ơi!")
        db.add(comment)
        db.commit()
        db.refresh(comment)

        # 3. Tạo Comment Like
        comment_like = CommentLike(user_id=owner.id, comment_id=comment.id)
        db.add(comment_like)
        comment.likes_count = 1

        # 4. Tạo Comment Reply (bình luận phản hồi)
        reply = Comment(user_id=owner.id, video_id=post_id, content="Cảm ơn bạn nhé!", parent_id=comment.id)
        db.add(reply)
        db.commit()

        print("  - Đã thêm thành công: 2 Likes, 1 Comment, 1 CommentLike, 1 Comment Reply vào bài viết.")

        # Xác thực dữ liệu đã nằm trong CSDL trước khi xóa
        assert db.query(Video).filter(Video.id == post_id).count() == 1
        assert db.query(Like).filter(Like.video_id == post_id).count() == 2
        assert db.query(Comment).filter(Comment.video_id == post_id).count() == 2  # Gồm comment gốc + reply
        assert db.query(CommentLike).filter(CommentLike.comment_id == comment.id).count() == 1
        print("  - ✅ Xác thực dữ liệu trước khi xóa hoàn toàn chính xác.")

        # --- KIỂM TRA BẢO MẬT PHÂN QUYỀN QUA DIRECT ROUTER CALL ---
        print(f"\n[BƯỚC 3] Thử nghiệm bảo mật: Xóa bài viết của người khác (Kỳ vọng 403)...")
        try:
            delete_video_post(video_id=post_id, current_user=other_user, db=db)
            assert False, "Lỗi: Lẽ ra phải chặn xóa bài viết trái phép bằng 403 Forbidden!"
        except HTTPException as e:
            print(f"  - Kết quả Router: Báo lỗi HTTPException, Status {e.status_code}, Chi tiết: {e.detail}")
            assert e.status_code == 403
            print("  - ✅ Chặn xóa bài viết trái phép thành công (403 Forbidden)!")

        print(f"\n[BƯỚC 4] Thực hiện xóa bài viết chính chủ (Kỳ vọng 200 và Cascade xóa sạch)...")
        res = delete_video_post(video_id=post_id, current_user=owner, db=db)
        print(f"  - Kết quả Router: Phản hồi thành công: {res}")
        assert res.get("status") == "success"
        print("  - ✅ Gọi Router xóa chính chủ thành công!")

        print(f"\n[BƯỚC 5] Xác thực cơ sở dữ liệu sau khi xóa (Cascade Verification)...")
        # 1. Đảm bảo bài viết đã biến mất
        assert db.query(Video).filter(Video.id == post_id).count() == 0, "Lỗi: Video vẫn tồn tại trong CSDL!"
        print("  - ✅ Bài viết đã bị xóa hoàn toàn khỏi cơ sở dữ liệu.")

        # 2. Đảm bảo toàn bộ Likes của bài viết đã bị xóa sạch (Cascade check)
        likes_count = db.query(Like).filter(Like.video_id == post_id).count()
        assert likes_count == 0, f"Lỗi: Vẫn còn {likes_count} lượt likes mồ côi!"
        print("  - ✅ Toàn bộ lượt Likes liên quan đã bị dọn sạch tự động.")

        # 3. Đảm bảo toàn bộ Comments (gồm comment gốc và replies con) đã bị xóa sạch
        comments_count = db.query(Comment).filter(Comment.video_id == post_id).count()
        assert comments_count == 0, f"Lỗi: Vẫn còn {comments_count} bình luận mồ côi!"
        print("  - ✅ Toàn bộ Comments và Replies liên quan đã bị dọn sạch tự động.")

        # 4. Đảm bảo toàn bộ Comment Likes liên quan đã bị xóa sạch
        comment_likes_count = db.query(CommentLike).filter(CommentLike.comment_id == comment.id).count()
        assert comment_likes_count == 0, f"Lỗi: Vẫn còn {comment_likes_count} CommentLikes mồ côi!"
        print("  - ✅ Toàn bộ Comment Likes liên quan đã bị dọn sạch tự động.")

        print("\n==================================================")
        print("🎉 TẤT CẢ CÁC BÀI TEST CHỨC NĂNG XÓA CASCADE ĐỀU ĐÃ ĐẠT! 🎉")
        print("==================================================")

    except AssertionError as e:
        print(f"\n❌ KIỂM THỬ THẤT BẠI: {e}")
        # Dọn dẹp phòng hờ nếu có lỗi assert
        try:
            db.rollback()
            post = db.query(Video).filter(Video.title == "Món ngon Quận 1 - Test Delete Cascade").first()
            if post:
                db.delete(post)
                db.commit()
        except:
            pass
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_delete_cascade()
