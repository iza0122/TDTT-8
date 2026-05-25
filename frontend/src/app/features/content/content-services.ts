import { ReviewPost, ExtendedShortVideo } from '../../types';

// 🌟 BƯỚC 1: Khai báo ExtendedShortVideo ngay tại đây để Service hiểu các thuộc tính mở rộng


const mockPosts: ReviewPost[] = [
  {
    id: "1",
    author: { id: "u1", name: "Người Sành Ăn", avatarUrl: "https://i.pravatar.cc/150?u=1" },
    content: "Chiều mưa sà vào hàng bún bò chuẩn Huế ngay góc đường Nguyễn Văn Cừ. Nước dùng thơm mùi sả mắm ruốc, thịt nạm thái dày siêu chất lượng! Highly recommend cho các bạn trường Tự Nhiên nha 🍜✨",
    imageUrl: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600",
    likes: 45,
    createdAt: "10 phút trước"
  },
  {
    id: "2",
    author: { id: "u2", name: "Chiến Thần Review", avatarUrl: "https://i.pravatar.cc/150?u=2" },
    content: "Phát hiện quán cà phê chạy deadline siêu yên tĩnh ngay An Dương Vương. Nước uống hơi ngọt một chút nhưng có ổ điện ở khắp nơi và nhạc rất chill nha mọi người ☕💻",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
    likes: 12,
    createdAt: "1 giờ trước"
  }
];

const mockVideos: ExtendedShortVideo[] = [
  {
    id: "v1",
    author: { id: "u10", name: "Food Vlogger", avatarUrl: "https://i.pravatar.cc/150?u=10" },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cooking-in-a-modern-kitchen-41876-large.mp4",
    description: "Món bún bò chuẩn vị Huế có một không hai ngay gần cơ sở Nguyễn Văn Cừ, topping ngập tràn siêu rẻ cho sinh viên nè! 🍜🔥",
    likes: 120,
    rating: 4.8,
    merchantName: "Bún Bò Huế US - Nguyễn Văn Cừ",
    tags: ["BunBoHue", "NgonGiaRe", "AnSapQuan5"],
    commentsCount: 15
  },
  {
    id: "v2",
    author: { id: "u11", name: "Thèm Ăn Đêm", avatarUrl: "https://i.pravatar.cc/150?u=11" },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-coffee-into-a-cup-42220-large.mp4",
    description: "Ê check-in ngay quán cà phê tone trắng đen chạy deadline xuyên đêm siêu hot mới mở nè mấy ní, ổ điện cực nhiều! ☕💻",
    likes: 85,
    rating: 4.5,
    merchantName: "Cà Phê Studio - An Dương Vương",
    tags: ["CaPheDeadline", "Chill", "AnDuongVuong"],
    commentsCount: 9
  },
  {
    id: "v3",
    author: { id: "u12", name: "Học Muộn Ăn Gì", avatarUrl: "https://i.pravatar.cc/150?u=12" },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-gourmet-burger-preparation-41566-large.mp4",
    description: "Hàng bánh mì xá xíu, xíu mại đêm đỉnh chóp lề đường mở tới 2h sáng. Nước sốt kẹo kẹo đậm đà ăn cuốn lôi cuốn luôn!",
    likes: 243,
    rating: 4.7,
    merchantName: "Bánh Mì Đêm Cô Ba",
    tags: ["BanhMi", "AnDem", "SaiGonFood"],
    commentsCount: 32
  },
  {
    id: "v4",
    author: { id: "u13", name: "Trà Sữa Holic", avatarUrl: "https://i.pravatar.cc/150?u=13" },
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fresh-iced-tea-with-lemon-42261-large.mp4",
    description: "Giải nhiệt trưa nắng với ly trà trái cây khổng lồ full thạch chỉ 25 cành ngay cổng ký túc xá. Sinh viên xếp hàng đông nghịt 🍋🍹",
    likes: 198,
    rating: 4.6,
    merchantName: "Trà Trái Cây Đô Thị",
    tags: ["TraTraiCay", "GiaiNhiet", "SinhVien"],
    commentsCount: 18
  }
];

export const ContentServices = {
  getHomePosts: async (): Promise<ReviewPost[]> => {
    return mockPosts;
  },

  // 🌟 BƯỚC 2: Đổi kiểu trả về thành ExtendedShortVideo[] để khớp hoàn toàn dữ liệu mảng mockVideos
  getShortVideos: async (): Promise<ExtendedShortVideo[]> => {
    return mockVideos;
  },

  likePost: async (postId: string): Promise<boolean> => {
    return true;
  }
};