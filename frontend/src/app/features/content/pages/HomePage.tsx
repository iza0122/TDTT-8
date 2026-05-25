import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardHeader, CardMedia, CardContent, CardActions, Avatar, IconButton, Stack, Chip, Divider, TextField, Button } from "@mui/material";
import { Favorite, FavoriteBorder, ChatBubbleOutline, Share, BookmarkBorder, LocalFireDepartment, Star, LocationOn, Send } from "@mui/icons-material";
import { ContentServices } from "../content-services"; 
import { ReviewPost } from "../../../types";

export default function HomePage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    ContentServices.getHomePosts().then((data) => {
      setPosts(data);
    });
  }, []);

  const handleLike = (id: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleComments = (id: string) => {
    setShowComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <Box sx={{ maxWidth: 620, mx: "auto", px: 2, py: 4 }}>
      {/* TIÊU ĐỀ XU HƯỚNG */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <LocalFireDepartment sx={{ color: "#ff6b35", fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          BÀI VIẾT NỔI BẬT KHU VỰC
        </Typography>
      </Stack>

      {/* DANH SÁCH BÀI ĐĂNG BIẾN ĐỔI GIAO DIỆN MỚI */}
      <Stack spacing={3}>
        {posts.map((post) => {
          // Ép kiểu tạm thời hoặc lấy dữ liệu dự phòng để tránh lỗi TS nếu file types chưa cập nhật
          const postData = post as any;
          const merchantName = postData.merchantName || (post.id === "1" ? "Bún Bò Huế US" : "Cơm Tấm Hòa");
          const rating = postData.rating || (post.id === "1" ? 4.8 : 4.5);
          const tags = postData.tags || (post.id === "1" ? ["Món nước", "Sinh viên", "Đặc sản"] : ["Cơm đĩa", "Bình dân", "Ngoại thành"]);
          const mockComments = postData.comments || [
            { id: "c1", user: "Hoàng", text: "Nước lèo đậm đà nhiều thịt lắm luôn, bõ công ăn thử!" },
            { id: "c2", user: "Trí", text: "Quán ruột của mình quanh khu Nguyễn Văn Cừ nè haha." },
            { id: "c3", user: "Khoa", text: "Quán như lồn." },
          ];

          return (
            <Card 
              key={post.id} 
              sx={{ 
                borderRadius: 4, 
                boxShadow: "0px 4px 20px rgba(0,0,0,0.03)", 
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}
            >
              {/* THÔNG TIN NGƯỜI ĐĂNG BÀI */}
              <CardHeader
                avatar={
                  <Avatar src={post.author.avatarUrl} sx={{ bgcolor: "#ff6b35", fontWeight: 700, fontSize: 14 }}>
                    {post.author.name ? post.author.name[0] : "U"}
                  </Avatar>
                }
                title={
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                    {post.author.name}
                  </Typography>
                }
                subheader={
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    {post.createdAt}
                  </Typography>
                }
              />

              {/* THÔNG TIN QUÁN ĂN ĐƯỢC TAG & ĐÁNH GIÁ SAO */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, pb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "#ff6b35" }}>
                  <LocationOn sx={{ fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                    {merchantName}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: "#fff7ed", px: 1, py: 0.5, borderRadius: 2 }}>
                  <Star sx={{ fontSize: 16, color: "#ffb703" }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#c2410c" }}>
                    {rating}
                  </Typography>
                </Stack>
              </Stack>

              {/* NỘI DUNG REVIEW */}
              <CardContent sx={{ pt: 0, pb: 1.5 }}>
                <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.6, mb: 1.5 }}>
                  {post.content}
                </Typography>

                {/* DANH SÁCH CÁC TAGS */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {tags.map((tag: string, index: number) => (
                    <Chip 
                      key={index}
                      label={`#${tag}`} 
                      size="small" 
                      sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 600, fontSize: 11, borderRadius: 1.5 }}
                    />
                  ))}
                </Stack>
              </CardContent>

              {/* HÌNH ẢNH MINH HỌA */}
              {post.imageUrl && (
                <CardMedia
                  component="img"
                  height="320"
                  image={post.imageUrl}
                  alt="Review Image"
                  sx={{ objectFit: "cover" }}
                />
              )}

              {/* THANH TƯƠNG TÁC (LIKE, COMMENT, SHARE) */}
              <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1, bgcolor: "#f8fafc" }}>
                <Stack direction="row" spacing={2}>
                  <Stack direction="row" alignItems="center">
                    <IconButton size="small" onClick={() => handleLike(post.id)} sx={{ color: likedPosts.has(post.id) ? "#ff6b35" : "inherit" }}>
                      {likedPosts.has(post.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 600, ml: 0.5, fontSize: 13 }}>
                      {likedPosts.has(post.id) ? post.likes + 1 : post.likes}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center">
                    <IconButton size="small" onClick={() => toggleComments(post.id)} sx={{ color: showComments.has(post.id) ? "#ff6b35" : "text.secondary" }}>
                      <ChatBubbleOutline />
                    </IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 600, ml: 0.5, fontSize: 13, color: "text.secondary" }}>
                      {mockComments.length}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" sx={{ color: "text.secondary" }}><Share /></IconButton>
                  <IconButton size="small" sx={{ color: "text.secondary" }}><BookmarkBorder /></IconButton>
                </Stack>
              </CardActions>

              {/* PHÂN HỆ BÌNH LUẬN MỞ RỘNG (ẨN/HIỆN KHI BẤM ICON) */}
              {showComments.has(post.id) && (
                <Box sx={{ p: 2, bgcolor: "#fafafa", borderTop: "1px solid #f1f5f9" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", mb: 1, display: "block" }}>
                    BÌNH LUẬN NỔI BẬT
                  </Typography>
                  
                  {/* DANH SÁCH CÁC BÌNH LUẬN */}
                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {mockComments.map((comment: any) => (
                      <Stack key={comment.id} direction="row" spacing={1} alignItems="flex-start">
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "#94a3b8" }}>
                          {comment.user[0]}
                        </Avatar>
                        <Box sx={{ bgcolor: "#f1f5f9", p: 1, borderRadius: 3, maxWidth: "85%" }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e293b", display: "block" }}>
                            {comment.user}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#334155", wordBreak: "break-word" }}>
                            {comment.text}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  {/* Ô NHẬP BÌNH LUẬN MỚI */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <TextField
                      placeholder="Viết bình luận công khai..."
                      size="small"
                      fullWidth
                      variant="outlined"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 4,
                          fontSize: 12,
                          bgcolor: "#fff"
                        }
                      }}
                    />
                    <IconButton 
                      size="small" 
                      disabled={!(commentInputs[post.id] || "").trim()}
                      sx={{ bgcolor: "#ff6b35", color: "#fff", "&:hover": { bgcolor: "#e05626" }, "&.Mui-disabled": { bgcolor: "#f1f5f9" } }}
                    >
                      <Send sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                </Box>
              )}
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}