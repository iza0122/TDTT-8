import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Chip,
  InputBase,
  Paper,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  BookmarkBorder,
  Share,
  Search,
  Star,
} from "@mui/icons-material";

const mockRestaurants = [
  {
    id: 1,
    name: "Phở Hà Nội",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
    user: "Minh Nguyen",
    avatar: "M",
    location: "Quận 1, TP.HCM",
    rating: 4.8,
    cuisine: ["Phở", "Việt Nam"],
    likes: 234,
    comments: 45,
    description: "Phở bò truyền thống Hà Nội, nước dùng ngọt từ xương",
  },
  {
    id: 2,
    name: "Sushi Tokyo",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
    user: "Linh Tran",
    avatar: "L",
    location: "Quận 3, TP.HCM",
    rating: 4.9,
    cuisine: ["Sushi", "Nhật Bản"],
    likes: 567,
    comments: 89,
    description: "Sushi tươi ngon, đầu bếp người Nhật chính gốc",
  },
  {
    id: 3,
    name: "Bánh Mì Saigon",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800",
    user: "Huy Le",
    avatar: "H",
    location: "Quận 5, TP.HCM",
    rating: 4.7,
    cuisine: ["Bánh Mì", "Street Food"],
    likes: 892,
    comments: 124,
    description: "Bánh mì thịt nguội, pate tự làm, giòn tan",
  },
  {
    id: 4,
    name: "Bún Chả Hương",
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
    user: "Thu Pham",
    avatar: "T",
    location: "Quận 10, TP.HCM",
    rating: 4.6,
    cuisine: ["Bún Chả", "Việt Nam"],
    likes: 445,
    comments: 67,
    description: "Bún chả Hà Nội đúng vị, chả nướng thơm phức",
  },
];

export default function Home() {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", pb: 2 }}>
      <Paper
        component="form"
        sx={{
          p: "8px 16px",
          display: "flex",
          alignItems: "center",
          m: 2,
          borderRadius: 3,
        }}
      >
        <Search sx={{ color: "text.secondary", mr: 1 }} />
        <InputBase
          sx={{ flex: 1 }}
          placeholder="Tìm kiếm quán ăn, món ăn..."
          inputProps={{ "aria-label": "search restaurants" }}
        />
      </Paper>

      <Stack spacing={2} sx={{ px: 2 }}>
        {mockRestaurants.map((restaurant) => (
          <Card key={restaurant.id} sx={{ borderRadius: 3 }}>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ bgcolor: "#ff6b35" }}>{restaurant.avatar}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {restaurant.user}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {restaurant.location}
                </Typography>
              </Box>
            </Box>

            <CardMedia
              component="img"
              height="300"
              image={restaurant.image}
              alt={restaurant.name}
              sx={{ cursor: "pointer" }}
            />

            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleLike(restaurant.id)}
                    sx={{ color: likedPosts.has(restaurant.id) ? "#ff6b35" : "inherit" }}
                  >
                    {likedPosts.has(restaurant.id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton size="small">
                    <ChatBubbleOutline />
                  </IconButton>
                  <IconButton size="small">
                    <Share />
                  </IconButton>
                </Box>
                <IconButton size="small">
                  <BookmarkBorder />
                </IconButton>
              </Box>

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                {likedPosts.has(restaurant.id)
                  ? restaurant.likes + 1
                  : restaurant.likes}{" "}
                lượt thích
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {restaurant.name}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <Star sx={{ fontSize: 16, color: "#ffc107" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {restaurant.rating}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {restaurant.description}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {restaurant.cuisine.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ bgcolor: "#fff3e0", color: "#e65100" }}
                  />
                ))}
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Xem tất cả {restaurant.comments} bình luận
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
