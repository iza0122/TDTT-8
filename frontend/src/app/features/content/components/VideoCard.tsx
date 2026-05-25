import React, { useRef, useState } from "react";
import { Box, Typography, IconButton, Avatar, Stack } from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  BookmarkBorder,
  PlayArrow,
} from "@mui/icons-material";

export interface VideoData {
  id: number;
  title: string;
  thumbnail: string; // Tạm thời dùng làm ảnh nền giả lập video
  user: string;
  avatar: string;
  views: string;
  duration: string;
  rating: number;
  tags: string[];
  likes: number;
  comments: number;
}

interface VideoCardProps {
  video: VideoData;
  isLiked: boolean;
  onToggleLike: (id: number) => void;
  onOpenComments: (id: number) => void;
}

export default function VideoCard({ video, isLiked, onToggleLike, onOpenComments }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        scrollSnapAlign: "start", // Giữ khung cuộn khựng lại đúng vị trí ghim
        position: "relative",
        bgcolor: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => setIsPlaying(!isPlaying)}
    >
      {/* KHỐI HIỂN THỊ VIDEO/HÌNH ẢNH NỀN TRÀN MÀN HÌNH */}
      <Box
        component="img"
        src={video.thumbnail}
        alt={video.title}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0.85,
        }}
      />

      {/* ICON PLAY GIẢ LẬP KHI TẠM DỪNG */}
      {!isPlaying && (
        <Box
          sx={{
            position: "absolute",
            zIndex: 2,
            bgcolor: "rgba(0,0,0,0.3)",
            borderRadius: "50%",
            p: 1,
            pointerEvents: "none",
          }}
        >
          <PlayArrow sx={{ fontSize: 50, color: "white" }} />
        </Box>
      )}

      {/* LAYOUT NỘI DUNG CHỮ (GÓC TRÁI DƯỚI) */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 70, // Tránh đè lên dàn nút tương tác bên phải
          p: 3,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)",
          color: "white",
          zIndex: 3,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar sx={{ bgcolor: "#ff6b35", border: "2px solid white", width: 36, height: 36 }}>
            {video.avatar}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {video.user}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
              {video.views} lượt xem
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.4 }}>
          {video.title}
        </Typography>

        <Stack direction="row" spacing={1}>
          {video.tags.map((tag) => (
            <Typography
              key={tag}
              variant="caption"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}
            >
              #{tag}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* DÀN NÚT TƯƠNG TÁC DỌC (GÓC PHẢI DƯỚI) */}
      <Stack
        spacing={2.5}
        alignItems="center"
        sx={{
          position: "absolute",
          bottom: 40,
          right: 12,
          zIndex: 3,
        }}
        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click để không bị nhận nhầm là pause video
      >
        {/* THẢ TIM */}
        <Stack alignItems="center" spacing={0.2}>
          <IconButton
            onClick={() => onToggleLike(video.id)}
            sx={{
              bgcolor: isLiked ? "#ff6b35" : "rgba(255,255,255,0.15)",
              color: "white",
              backdropFilter: "blur(8px)",
              "&:hover": { bgcolor: isLiked ? "#e55a2b" : "rgba(255,255,255,0.3)" },
              width: 46,
              height: 46,
            }}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="caption" sx={{ color: "white", fontWeight: 700, dropShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            {isLiked ? video.likes + 1 : video.likes}
          </Typography>
        </Stack>

        {/* BÌNH LUẬN */}
        <Stack alignItems="center" spacing={0.2}>
          <IconButton
            onClick={() => onOpenComments(video.id)}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              backdropFilter: "blur(8px)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              width: 46,
              height: 46,
            }}
          >
            <ChatBubbleOutline />
          </IconButton>
          <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
            {video.comments}
          </Typography>
        </Stack>

        {/* CHIA SẺ */}
        <IconButton
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "white",
            backdropFilter: "blur(8px)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
          }}
        >
          <Share />
        </IconButton>

        {/* LƯU BÀI VIẾT */}
        <IconButton
          sx={{
            bgcolor: "rgba(255,255,255,0.15)",
            color: "white",
            backdropFilter: "blur(8px)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
          }}
        >
          <BookmarkBorder />
        </IconButton>
      </Stack>
    </Box>
  );
}