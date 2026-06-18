import asyncio
import datetime
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.core.all_models import Video
from backend.modules.content.services import delete_video_record_internal

def auto_delete_old_rejected_videos():
    print("[TASK] Đang chạy tác vụ tự động xóa video/bài viết bị từ chối...")
    db = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        limit_date = now - datetime.timedelta(days=1)
        
        # Lấy tất cả video bị từ chối
        rejected_videos = db.query(Video).filter(Video.status == "rejected").all()
        deleted_count = 0
        
        for video in rejected_videos:
            should_delete = False
            
            # Kiểm tra rejected_at trong meta_data
            if video.meta_data and isinstance(video.meta_data, dict) and "rejected_at" in video.meta_data:
                try:
                    rejected_at = datetime.datetime.fromisoformat(video.meta_data["rejected_at"])
                    if rejected_at < limit_date:
                        should_delete = True
                except Exception as e:
                    print(f"[TASK] Lỗi phân tích rejected_at cho video ID {video.id}: {e}")
                    # Fallback về created_at
                    if video.created_at < limit_date:
                        should_delete = True
            else:
                # Fallback về created_at nếu không có rejected_at
                if video.created_at < limit_date:
                    should_delete = True
            
            if should_delete:
                print(f"[TASK] Tự động xóa bài viết bị từ chối quá 1 ngày: ID {video.id} (Tiêu đề: '{video.title}')")
                delete_video_record_internal(db, video)
                deleted_count += 1
                
        if deleted_count > 0:
            print(f"[TASK] Hoàn tất! Đã xóa thành công {deleted_count} bài viết bị từ chối.")
    except Exception as e:
        print(f"[TASK] Lỗi khi chạy tác vụ tự động xóa: {e}")
    finally:
        db.close()

async def run_periodic_cleanup():
    """
    Vòng lặp chạy ngầm định kỳ mỗi 1 tiếng để kiểm tra và xóa các video bị từ chối.
    Chạy trên luồng phụ (asyncio.to_thread) để tránh chặn (block) Event Loop của FastAPI.
    """
    await asyncio.sleep(5)  # Trì hoãn khởi động 5 giây để app chính khởi chạy xong
    while True:
        try:
            await asyncio.to_thread(auto_delete_old_rejected_videos)
        except Exception as e:
            print(f"[TASK] Lỗi vòng lặp dọn dẹp định kỳ: {e}")
        # Chờ 1 tiếng (3600 giây) cho lần chạy tiếp theo
        await asyncio.sleep(3600)
