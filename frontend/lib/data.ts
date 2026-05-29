export const foodPosts: any[] = [];
export const reels: any[] = [];
export const restaurants: any[] = [];

export const categories = [
  { id: "all", name: "Tất cả", icon: "🍽️" },
  { id: "pho", name: "Phở", icon: "🍜" },
  { id: "bun", name: "Bún", icon: "🍲" },
  { id: "com", name: "Cơm", icon: "🍚" },
  { id: "banh", name: "Bánh", icon: "🥖" },
  { id: "cafe", name: "Cà phê", icon: "☕" },
  { id: "tra", name: "Trà sữa", icon: "🧋" },
  { id: "lau", name: "Lẩu", icon: "🫕" },
];

export const userProfile = {
  id: "",
  name: "Khách",
  username: "guest",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  bio: "Đam mê ẩm thực & Chia sẻ quán ngon",
  followers: 0,
  following: 0,
  posts: 0,
  saved: 0,
  reviews: [] as any[],
};
