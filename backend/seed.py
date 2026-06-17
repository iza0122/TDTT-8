import os
import sys
import random
from datetime import datetime

# Cấu hình path
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

from backend.core.database import SessionLocal, engine, Base
from backend.core.all_models import User, Merchant, Menu, Video, Like, Comment, Campaign

# Tự động nâng cấp các cột mới nếu đã có bảng cũ mà không làm mất dữ liệu
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN shares_count INTEGER DEFAULT 0 NOT NULL"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN reup_from_id INTEGER REFERENCES videos(id)"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN rating INTEGER DEFAULT 5 NOT NULL"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE videos ADD COLUMN merchant_response TEXT"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN description TEXT"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN start_date TIMESTAMP"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN end_date TIMESTAMP"))
except Exception:
    pass

# Tạo các bảng mới (như user_shares, user_follows, hidden_videos) nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        print("--- Clearing existing database data ---")
        db.query(Campaign).delete()
        db.query(Comment).delete()
        db.query(Like).delete()
        db.query(Video).delete()
        db.query(Menu).delete()
        db.query(Merchant).delete()
        db.query(User).delete()
        db.commit()
        print("Database cleanup completed.")

        print("\n--- Creating mock users ---")
        users = [
            User(email="admin@foodreview.com", full_name="Nguyễn Admin", role="admin", firebase_uid="g_admin_123", avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"),
            User(
                email="reviewer1@foodreview.com", 
                full_name="Khoa Pug Review", 
                role="reviewer", 
                firebase_uid="g_rev_1", 
                avatar_url="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
                meta_data={
                    "bio": "Reviewer ẩm thực tự do 🍜 | Khám phá ngõ ngách Sài Gòn | Hợp tác quảng cáo liên hệ inbox.",
                    "followers_count": 24500,
                    "following_count": 340,
                    "saved_count": 182
                }
            ),
            User(
                email="reviewer2@foodreview.com", 
                full_name="Ninh Titop", 
                role="reviewer", 
                firebase_uid="g_rev_2", 
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                meta_data={
                    "bio": "Food lover 🍕 | Đam mê nấu nướng và lê la quán xá | Kênh Youtube Ninh Titop.",
                    "followers_count": 89000,
                    "following_count": 120,
                    "saved_count": 420
                }
            ),
            User(email="merchant1@foodreview.com", full_name="Chủ Quán Ba Đạt", role="merchant", firebase_uid="g_mer_1", avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"),
            User(email="merchant2@foodreview.com", full_name="Bà Sáu Bán Chè", role="merchant", firebase_uid="g_mer_2", avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150")
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)
        print(f"Created {len(users)} users.")

        # Định nghĩa các món ăn thực tế và mô tả tương ứng
        vietnamese_food_categories = [
            {
                "category": "Phở",
                "name_tpl": "Phở Bò {suffix}",
                "desc": "Phở bò truyền thống Hà Nội với nước dùng ninh xương ống bò trong 12 tiếng, thơm vị quế hồi thảo quả.",
                "menu_items": [("Phở Tái Nạm", 55000), ("Phở Gân Sách", 60000), ("Phở Đặc Biệt", 75000), ("Quẩy Giòn", 5000)]
            },
            {
                "category": "Bún chả",
                "name_tpl": "Bún Chả {suffix}",
                "desc": "Bún chả Hà Nội nướng than hoa thơm lừng ăn kèm nước mắm đu đủ chua ngọt thanh mát.",
                "menu_items": [("Bún Chả Cổ Truyền", 45000), ("Bún Chả Đặc Biệt", 60000), ("Nem Cua Bể", 15000)]
            },
            {
                "category": "Cơm tấm",
                "name_tpl": "Cơm Tấm {suffix}",
                "desc": "Cơm tấm Sài Gòn chuẩn vị hạt cơm tơi xốp, sườn nướng mật ong thơm phức kết hợp chả trứng nấm tai mèo.",
                "menu_items": [("Cơm Tấm Sườn Bì Chả", 40000), ("Cơm Tấm Sườn Ốp La", 45000), ("Cơm Tấm Đặc Biệt", 65000)]
            },
            {
                "category": "Bánh mì",
                "name_tpl": "Bánh Mì {suffix}",
                "desc": "Bánh mì Việt Nam giòn tan bên ngoài, ruột xốp thơm pate gan heo tự làm và bơ trứng béo ngậy.",
                "menu_items": [("Bánh Mì Thập Cẩm", 25000), ("Bánh Mì Heo Quay", 30000), ("Bánh Mì Chả Cá", 20000)]
            },
            {
                "category": "Bún",
                "name_tpl": "Bún Bò Huế {suffix}",
                "desc": "Bún bò Huế đậm đà hương mắm ruốc, sả thơm, sa tế cay nồng kèm chân giò, giò heo, bò tái.",
                "menu_items": [("Bún Bò Giò Chả", 50000), ("Bún Bò Thập Cẩm", 65000), ("Chả Cua Thêm", 10000)]
            },
            {
                "category": "Bún",
                "name_tpl": "Hủ Tiếu Nam Vang {suffix}",
                "desc": "Hủ tiếu Nam Vang chuẩn vị với tôm, gan heo, thịt băm, trứng cút, nước lèo ngọt thanh từ xương ống.",
                "menu_items": [("Hủ Tiếu Khô Đặc Biệt", 55000), ("Hủ Tiếu Nước Trống", 45000)]
            },
            {
                "category": "Bánh",
                "name_tpl": "Chè {suffix} Nam Bộ",
                "desc": "Chè ngọt thanh thanh béo ngậy nước cốt dừa tươi nấu cùng chuối, khoai môn, đậu ngự.",
                "menu_items": [("Chè Thái", 25000), ("Chè Bưởi An Giang", 20000), ("Sâm Bổ Lượng", 25000)]
            }
        ]

        # Tọa độ trung tâm Quận 1 HCMC: lat=10.775, lng=106.700
        # Chúng ta sẽ phân phối 50 quán ăn trong bán kính xung quanh trung tâm HCMC (Quận 1, 3, 5, 10)
        # Bán kính khoảng 0.05 độ (~5.5 km)
        print("\n--- Creating 50 merchants and menus ---")
        merchants = []
        for i in range(1, 51):
            category = random.choice(vietnamese_food_categories)
            suffix = random.choice(["Gia Truyền", "Cô Sáu", "Bà Tám", "Hà Nội", "Sài Gòn", "Đống Đa", "Bến Thành"])
            name = category["name_tpl"].format(suffix=suffix)
            
            # Phân bố ngẫu nhiên xung quanh khu vực ăn uống TP.HCM
            # Center: 10.775, 106.690 (giữa Q1 và Q3)
            lat_offset = random.uniform(-0.04, 0.04)
            lng_offset = random.uniform(-0.04, 0.04)
            lat = 10.775 + lat_offset
            lng = 106.690 + lng_offset
            
            # Chọn quận dựa trên tọa độ lệch để địa chỉ thêm thực tế
            district = "Quận 1"
            if lat_offset < -0.01:
                district = "Quận 5"
            elif lat_offset > 0.015:
                district = "Quận 3"
            elif lng_offset < -0.015:
                district = "Quận 10"

            merchant = Merchant(
                name=f"{name} - Chi nhánh {i}",
                address=f"Số {random.randint(1, 450)} Đường {random.choice(['Nguyễn Trãi', 'Lê Lợi', 'Cách Mạng Tháng 8', 'Ba Tháng Hai', 'Nguyễn Thị Minh Khai'])}, {district}, TP. Hồ Chí Minh",
                category=category["category"],
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                description=category["desc"],
                rating_avg=round(random.uniform(3.5, 5.0), 1),
                owner_id=random.choice([users[3].id, users[4].id])
            )
            db.add(merchant)
            merchants.append((merchant, category["menu_items"]))

        db.commit()

        # Nạp Menu cho từng quán
        total_menus = 0
        for merchant_obj, menu_items in merchants:
            db.refresh(merchant_obj) # Get generated ID
            for name, price in menu_items:
                menu = Menu(
                    merchant_id=merchant_obj.id,
                    dish_name=name,
                    price=int(price),
                    is_available=True
                )
                db.add(menu)
                total_menus += 1
        db.commit()
        print(f"Successfully created 50 merchants with {total_menus} menu items.")

        print("\n--- Creating 10 video reviews ---")
        # Chọn ngẫu nhiên quán ăn để liên kết với video review
        sample_merchants = db.query(Merchant).limit(10).all()
        
        video_details = [
            ("Review Phở bò cực đỉnh Quận 1", "https://vjs.zencdn.net/v/oceans.mp4", "Nước dùng ngọt thanh cực kỳ ngon, sườn bò mềm tan.", "video"),
            ("Bánh mì giòn rụm chỉ 25k đông khách nhất Q3", "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800", "Chỗ này nổi tiếng giòn thơm ngon, ăn một ổ là no nê cả buổi sáng.", "image"),
            ("Cơm Tấm sườn nướng siêu to khổng lồ", "https://assets.mixkit.co/videos/preview/mixkit-pouring-sauce-on-a-meal-41584-large.mp4", "Sườn nướng thơm phức mật ong ăn kèm chả trứng dai giòn sần sật.", "video"),
            ("Hủ tiếu khô độc lạ Nam Bộ cực kỳ đắt khách", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800", "Nước sốt khô sền sệt đậm đà, tôm tươi giòn ngọt lịm.", "image"),
            ("Bún chả Hà Nội chuẩn vị giữa lòng Sài Gòn", "https://assets.mixkit.co/videos/preview/mixkit-grilling-chicken-skewers-on-a-barbecue-41597-large.mp4", "Chả viên nướng cháy cạnh thơm lừng mùi than củi cực chất lượng.", "video"),
            ("Quán chè ngon giá học sinh sinh viên tại Q5", "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800", "Nước cốt dừa thơm béo ngậy sánh mịn không quá ngọt.", "image"),
            ("Bún bò Huế đầy ắp topping siêu ngon", "https://assets.mixkit.co/videos/preview/mixkit-chef-slicing-cooked-beef-on-board-41590-large.mp4", "Bún bò nhiều thịt sườn giò heo siêu béo, sa tế tự làm cay xé lưỡi.", "video"),
            ("Địa điểm hẹn hò lãng mạn lẩu bò cực chất", "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800", "Không gian sang xịn mịn đồ ăn tươi roi rói nên thử nha các bạn.", "image"),
            ("Đột nhập bếp phở gia truyền nổi tiếng 30 năm", "https://assets.mixkit.co/videos/preview/mixkit-cooking-fresh-pasta-in-boiling-water-41588-large.mp4", "Mắt thấy tai nghe quy trình ninh xương bò gia truyền cực kỳ sạch sẽ ngon miệng.", "video"),
            ("Gợi ý ăn trưa nhanh gọn lẹ cho dân văn phòng", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", "Nhanh gọn tiện lợi đầy đủ dinh dưỡng chi phí lại vô cùng hợp lý.", "image")
        ]

        videos = []
        for idx, (title, url, desc, p_type) in enumerate(video_details):
            video = Video(
                title=title,
                video_url=url,
                thumbnail_url=url if p_type == "image" else f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?w=400",
                description=desc,
                post_type=p_type,
                likes_count=0,
                rating=random.randint(3, 5),
                merchant_response=None,
                reviewer_id=random.choice([users[1].id, users[2].id]),
                tagged_merchant_id=sample_merchants[idx].id if idx < len(sample_merchants) else None,
                status="approved"
            )
            db.add(video)
            videos.append(video)

        db.commit()
        for v in videos:
            db.refresh(v)
        print(f"Created {len(videos)} reviews ({sum(1 for x in video_details if x[3]=='image')} images, {sum(1 for x in video_details if x[3]=='video')} videos).")

        print("\n--- Creating sample interactions (likes & comments) ---")
        # Reviewers và Admin thả tim các video
        likes_created = 0
        comments_created = 0
        
        for video in videos:
            # Ngẫu nhiên tạo 1-4 lượt thích cho mỗi video
            likers = random.sample(users, random.randint(1, 4))
            video.likes_count = len(likers)
            for liker in likers:
                like = Like(user_id=liker.id, video_id=video.id)
                db.add(like)
                likes_created += 1

            # Bình luận chính (parent_id = None)
            comment_templates = [
                "Nhìn ngon xỉu chủ thớt ơi, xin địa chỉ chính xác với nha!",
                "Quán này mình ăn rồi, ngon thật sự mà giá hơi cao xíu.",
                "Review có tâm ghê, lưu lại cuối tuần rủ gấu đi ăn ngay mới được.",
                "Nhìn hấp dẫn quá, nước dùng phở trong veo chuẩn gu mình luôn."
            ]
            
            c1 = Comment(
                user_id=random.choice(users).id,
                video_id=video.id,
                content=random.choice(comment_templates),
                parent_id=None
            )
            db.add(c1)
            db.commit()
            db.refresh(c1)
            comments_created += 1

            # Bình luận trả lời (parent_id = c1.id)
            reply_templates = [
                "Đồng quan điểm nha bạn, chuẩn vị luôn á!",
                "Địa chỉ ghi ngay trên phần mô tả hoặc bạn geo-search là ra nha.",
                "Giá đó Quận 1 là quá rẻ rồi bác ơi.",
                "Cuối tuần này mình cũng đi thử xem sao."
            ]
            
            c2 = Comment(
                user_id=random.choice(users).id,
                video_id=video.id,
                content=random.choice(reply_templates),
                parent_id=c1.id
            )
            db.add(c2)
            comments_created += 1

        db.commit()
        print(f"Created {likes_created} likes and {comments_created} comments.")

        print("\n--- Creating advertisement campaigns ---")
        # Phục vụ thuật toán trộn Feed ở tuần sau
        campaigns = [
            Campaign(
                merchant_id=sample_merchants[0].id, 
                title="Đại tiệc siêu sale phở tái nạm", 
                description="Giảm ngay 20% trên mỗi tô phở đặc biệt dành cho thực khách đặt hàng sớm nhất trong ngày.",
                video_url="https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41582-large.mp4", 
                thumbnail_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", 
                is_active=True, 
                impressions_count=120, 
                clicks_count=15,
                start_date=datetime(2026, 6, 1),
                end_date=datetime(2026, 6, 30)
            ),
            Campaign(
                merchant_id=sample_merchants[1].id, 
                title="Bánh mì tặng kèm trà đào giải nhiệt", 
                description="Combo giải nhiệt cực đã: Mua 1 ổ bánh mì thập cẩm lớn, tặng ngay 1 ly trà đào mát lạnh sảng khoái.",
                video_url="https://assets.mixkit.co/videos/preview/mixkit-cutting-slices-of-fresh-bread-41595-large.mp4", 
                thumbnail_url="https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400", 
                is_active=False, 
                impressions_count=85, 
                clicks_count=8,
                start_date=datetime(2026, 6, 1),
                end_date=datetime(2026, 8, 31)
            ),
            Campaign(
                merchant_id=sample_merchants[2].id, 
                title="Combo cơm tấm sườn chả chỉ 39k", 
                description="Khuyến mãi tưng bừng: Combo cơm tấm sườn chả chuẩn Sài Gòn kèm nước ngọt giải khát giá cực sốc chỉ 39.000đ.",
                video_url="https://assets.mixkit.co/videos/preview/mixkit-pouring-sauce-on-a-meal-41584-large.mp4", 
                thumbnail_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", 
                is_active=True, 
                impressions_count=230, 
                clicks_count=42,
                start_date=datetime(2026, 5, 1),
                end_date=datetime(2026, 5, 31)
            ),
        ]
        db.add_all(campaigns)
        db.commit()
        print(f"Created {len(campaigns)} ad campaigns.")

        print("\n==========================================")
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉")
        print("==========================================")

    except Exception as e:
        db.rollback()
        print(f"\n❌ SEED ERROR: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
