import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Chip,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  BookmarkBorder,
  Share,
  PlayArrow,
  VolumeUp,
  Star,
} from "@mui/icons-material";

const mockVideos = [
  {
    id: 1,
    title: "Review Phở Bò Tái Lăn",
    thumbnail: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    user: "Food Reviewer Pro",
    avatar: "F",
    views: "125K",
    duration: "3:45",
    rating: 4.9,
    tags: ["Review", "Phở"],
    likes: 3400,
    comments: 234,
  },
  {
    id: 2,
    title: "Làm Bánh Mì tại nhà",
    thumbnail: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
    user: "Chef Linh",
    avatar: "C",
    views: "89K",
    duration: "8:20",
    rating: 4.7,
    tags: ["Hướng dẫn", "Bánh Mì"],
    likes: 2100,
    comments: 156,
  },
  {
    id: 3,
    title: "Street Food Tour Sài Gòn",
    thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    user: "Saigon Eats",
    avatar: "S",
    views: "250K",
    duration: "12:15",
    rating: 4.8,
    tags: ["Street Food", "Tour"],
    likes: 5600,
    comments: 445,
  },
  {
    id: 4,
    title: "Top 10 Quán Ăn Vặt Quận 1",
    thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    user: "Foodie Hunter",
    avatar: "H",
    views: "180K",
    duration: "10:30",
    rating: 4.6,
    tags: ["Top 10", "Ăn Vặt"],
    likes: 4200,
    comments: 389,
  },
  {
    id: 5,
    title: "Bún Riêu Cua Đồng siêu ngon",
    thumbnail: "https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=800",
    user: "Vietnam Food",
    avatar: "V",
    views: "95K",
    duration: "5:40",
    rating: 4.5,
    tags: ["Review", "Bún Riêu"],
    likes: 2800,
    comments: 178,
  },
];

export default function Videos() {
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedVideos((prev) => {
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
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Video nổi bật
        </Typography>

        <Stack spacing={3}>
          {mockVideos.map((video) => (
            <Card key={video.id} sx={{ borderRadius: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={video.thumbnail}
                  alt={video.title}
                  sx={{
                    width: "100%",
                    height: 250,
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: "rgba(255,255,255,0.9)",
                      "&:hover": { bgcolor: "white" },
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 40, color: "#ff6b35" }} />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.8)",
                    color: "white",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {video.duration}
                </Box>
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                  }}
                  size="small"
                >
                  <VolumeUp fontSize="small" />
                </IconButton>
              </Box>

              <CardContent>
                <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#ff6b35" }}>{video.avatar}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {video.user} • {video.views} lượt xem
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: "#ffc107" }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {video.rating}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {video.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ bgcolor: "#e8f5e9", color: "#2e7d32" }}
                    />
                  ))}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleLike(video.id)}
                      sx={{ color: likedVideos.has(video.id) ? "#ff6b35" : "inherit" }}
                    >
                      {likedVideos.has(video.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Typography variant="body2" sx={{ alignSelf: "center" }}>
                      {likedVideos.has(video.id) ? video.likes + 1 : video.likes}
                    </Typography>
                    <IconButton size="small">
                      <ChatBubbleOutline />
                    </IconButton>
                    <Typography variant="body2" sx={{ alignSelf: "center" }}>
                      {video.comments}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small">
                      <Share />
                    </IconButton>
                    <IconButton size="small">
                      <BookmarkBorder />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
