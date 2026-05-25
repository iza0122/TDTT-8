import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Avatar, Stack, Chip } from "@mui/material";
import { Favorite, FavoriteBorder, ChatBubbleOutline, Share, BookmarkBorder, Star, LocationOn, PlayArrow, VolumeUp, VolumeOff } from "@mui/icons-material";
import CommentSection from "../components/CommentSection";
import { ContentServices } from "../content-services";
import { ExtendedShortVideo } from '../../../types';

export default function VideosPage() {
  const [videos, setVideos] = useState<ExtendedShortVideo[]>([]);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Trình duyệt bắt buộc muted ban đầu để auto-play

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    ContentServices.getShortVideos().then((data) => {
      setVideos(data);
      if (data.length > 0) {
        // Delay một xíu để DOM kịp render rồi phát video đầu tiên
        setTimeout(() => {
          handleScrollOrLoad(data[0].id);
        }, 100);
      }
    });
  }, []);

  // Hàm xử lý logic phát/dừng video chuẩn xác dựa trên ID chủ động
  const handleScrollOrLoad = (targetId: string) => {
    // Duyệt qua tất cả các video để dừng những video khác và phát video mục tiêu
    Object.keys(videoRefs.current).forEach((id) => {
      const vid = videoRefs.current[id];
      if (vid) {
        if (id === targetId) {
          vid.muted = isMuted;
          vid.play().then(() => {
            setPlayingVideoId(targetId);
          }).catch((err) => {
            console.log("Auto-play bị trình duyệt block, chờ tương tác user:", err);
          });
        } else {
          vid.pause();
          vid.currentTime = 0; // Reset thời gian về 0 để tối ưu RAM
        }
      }
    });
  };

  // 🌟 KHỬ LỖI CHƯA PHÁT ĐƯỢC VIDEO: Lắng nghe sự kiện cuộn để tính toán xem video nào đang chiếm màn hình
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    
    // Tính toán index của video đang nằm giữa khung hình nhìn thấy
    const activeIndex = Math.round(scrollTop / containerHeight);
    const currentVideo = videos[activeIndex];

    if (currentVideo && playingVideoId !== currentVideo.id) {
      handleScrollOrLoad(currentVideo.id);
    }
  };

  const handleVideoClick = (id: string) => {
    const videoElement = videoRefs.current[id];
    if (!videoElement) return;

    if (playingVideoId === id) {
      videoElement.pause();
      setPlayingVideoId(null);
    } else {
      videoElement.play().catch(() => {});
      setPlayingVideoId(id);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    
    if (playingVideoId && videoRefs.current[playingVideoId]) {
      videoRefs.current[playingVideoId]!.muted = nextMuteState;
    }
  };

  const handleToggleLike = (id: string) => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleOpenComments = (id: string) => {
    setActiveVideoId(id);
    setIsCommentOpen(true);
  };

  return (
    
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)",
        display: "flex",
        justifyContent: "center",
        bgcolor: "#0f172a",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* CONTAINER CHỨA VIDEO */}
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          overflowY: "scroll",
          // 🌟 LÀM CUỘN MƯỢT HƠN: Cấu hình snap chuẩn xác từng li theo trục đứng
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth", 
          scrollbarWidth: "none", // 🌟 ẨN THANH CUỘN CHO FIREFOX
          "&::-webkit-scrollbar": { display: "none" }, // 🌟 ẨN THANH CUỘN CHO CHROME/SAFARI
          bgcolor: "black",
          boxShadow: "0 0 40px rgba(0,0,0,0.6)",
          position: "relative"
        }}
      >
        {videos.map((video) => {
          const rating = video.rating || 4.5;
          const tags = video.tags || [];
          const merchantName = video.merchantName || "Địa điểm ăn uống";
          const isLiked = likedVideos.has(video.id);
          const commentsCount = video.commentsCount || 0;

          return (
            <Box 
              key={video.id} 
              onClick={() => handleVideoClick(video.id)}
              sx={{ 
                width: "100%", 
                height: "100%", 
                scrollSnapAlign: "start",
                scrollSnapStop: "always", // Ép trình duyệt dừng khựng lại đúng vị trí video, không bị trượt lố
                position: "relative",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}
            >
              {/* VIDEO ELEMENT CHUẨN AUTO-PLAY */}
              <video
                ref={(el) => { videoRefs.current[video.id] = el; }}
                src={video.videoUrl}
                loop
                playsInline
                autoPlay={playingVideoId === video.id}
                muted={isMuted} // Cần thiết để kích hoạt quyền tự động phát của trình duyệt
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* NÚT LOA BẬT/TẮT ÂM THANH NHANH */}
              <IconButton 
                onClick={toggleMute}
                sx={{ 
                  position: "absolute", 
                  top: 16, 
                  right: 16, 
                  bgcolor: "rgba(0,0,0,0.4)", 
                  color: "white",
                  zIndex: 20,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.6)" }
                }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>

              {/* ICON PLAY HIỂN THỊ KHI TẠM DỪNG VIDEO */}
              {playingVideoId !== video.id && (
                <Box sx={{ position: "absolute", color: "rgba(255,255,255,0.7)", pointerEvents: "none", bgcolor: "rgba(0,0,0,0.4)", borderRadius: "50%", p: 1.5, display: "flex", zIndex: 5 }}>
                  <PlayArrow sx={{ fontSize: 44 }} />
                </Box>
              )}

              {/* OVERLAY THÔNG TIN CHI TIẾT ĐÁY MÀN HÌNH */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "80px 75px 24px 16px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
                  color: "white",
                  zIndex: 4
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ĐỊA ĐIỂM QUÁN ĂN + ĐÁNH GIÁ ⭐ */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <LocationOn sx={{ color: "#ff6b35", fontSize: 18 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ff6b35", letterSpacing: "-0.3px", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                    {merchantName}
                  </Typography>
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={0.2} 
                    sx={{ 
                      bgcolor: "rgba(255, 183, 3, 0.25)", 
                      px: 0.8, 
                      py: 0.2, 
                      borderRadius: 1.5, 
                      border: "1px solid rgba(255, 183, 3, 0.45)",
                      backdropFilter: "blur(4px)"
                    }}
                  >
                    <Star sx={{ fontSize: 12, color: "#ffb703" }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffb703", fontSize: 11 }}>
                      {rating}
                    </Typography>
                  </Stack>
                </Stack>

                {/* NỘI DUNG MÔ TẢ REVIEW */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: "#f1f5f9", 
                    mb: 1.5, 
                    lineHeight: 1.4, 
                    display: "-webkit-box", 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: "vertical", 
                    overflow: "hidden",
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)"
                  }}
                >
                  {video.description}
                </Typography>

                {/* HASHTAGS */}
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {tags.map((tag: string, index: number) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      size="small"
                      sx={{ 
                        bgcolor: "rgba(255,255,255,0.18)", 
                        color: "#fff", 
                        backdropFilter: "blur(6px)", 
                        fontWeight: 600, 
                        fontSize: 10, 
                        height: 22,
                        border: "1px solid rgba(255,255,255,0.1)",
                        "& .MuiChip-label": { px: 1 }
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* THANH ACTION BUTTONS TƯƠNG TÁC BÊN PHẢI */}
              <Stack
                spacing={2.2}
                alignItems="center"
                sx={{ position: "absolute", bottom: 30, right: 12, zIndex: 10 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* AVATAR FOOD VLOGGER */}
                <Stack alignItems="center" spacing={0.5}>
                  <Avatar 
                    src={video.author.avatarUrl} 
                    sx={{ width: 44, height: 44, border: "2px solid #ff6b35", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", bgcolor: "#ff6b35" }} 
                  >
                    {video.author.name ? video.author.name[0] : "U"}
                  </Avatar>
                  <Typography variant="caption" sx={{ color: "#ffffff", fontSize: 10, fontWeight: 600, maxWidth: 65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 2px #000" }}>
                    {video.author.name}
                  </Typography>
                </Stack>

                {/* THAO TÁC LIKE */}
                <Stack alignItems="center" spacing={0.2}>
                  <IconButton
                    onClick={() => handleToggleLike(video.id)}
                    sx={{
                      bgcolor: isLiked ? "rgba(255, 107, 53, 0.95)" : "rgba(255,255,255,0.15)",
                      color: "white", backdropFilter: "blur(10px)", width: 44, height: 44
                    }}
                  >
                    {isLiked ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: 11, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {isLiked ? video.likes + 1 : video.likes}
                  </Typography>
                </Stack>

                {/* THAO TÁC BÌNH LUẬN */}
                <Stack alignItems="center" spacing={0.2}>
                  <IconButton
                    onClick={() => handleOpenComments(video.id)}
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(10px)", width: 44, height: 44 }}
                  >
                    <ChatBubbleOutline />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: 11, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {commentsCount}
                  </Typography>
                </Stack>

                {/* NÚT BOOKMARK */}
                <IconButton sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(10px)", width: 44, height: 44 }}>
                  <BookmarkBorder />
                </IconButton>

                {/* NÚT SHARE */}
                <IconButton sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(10px)", width: 44, height: 44 }}>
                  <Share />
                </IconButton>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* COMPONENT DRAWER BÌNH LUẬN NỔI CỦA DỰ ÁN */}
      <CommentSection isOpen={isCommentOpen} onClose={() => setIsCommentOpen(false)} />
    </Box>
  );
}