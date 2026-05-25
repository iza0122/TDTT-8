import React from "react";
import { Box, Typography, Card, CardMedia, CardContent, Chip, Stack } from "@mui/material";
// 1. Đổi dòng import Grid2 bị lỗi thành Grid truyền thống:
import Grid from "@mui/material/Grid"; 
import { Star, LocationOn, ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router";

export const MOCK_MERCHANTS = [
  {
    id: "m1",
    name: "Bún Bò Huế US",
    address: "227 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    rating: 4.8,
    reviewsCount: 145,
    category: "Món nước",
    image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600",
  },
  {
    id: "m2",
    name: "Cơm Tấm Hòa",
    address: "145 An Dương Vương, Quận 5, TP.HCM",
    rating: 4.5,
    reviewsCount: 92,
    category: "Cơm đĩa",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
  }
];

export default function MerchantListPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: 3, py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: "#0f172a", letterSpacing: "-0.5px" }}>
        🏢 QUÁN ĂN ĐỐI TÁC NỔI BẬT
      </Typography>

      <Grid container spacing={3}>
        {MOCK_MERCHANTS.map((merchant) => (
          /* Bỏ thuộc tính 'item', gom xs và sm vào bên trong object 'size' */
          <Grid size={{ xs: 12, sm: 6 }} key={merchant.id}>
            <Card onClick={() => navigate(`/merchants/${merchant.id}`)} 
              sx={{ 
                borderRadius: 4, 
                cursor: "pointer",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
                border: "1px solid #e2e8f0",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.08)",
                  borderColor: "#cbd5e1"
                }
              }}
            >
              <CardMedia
                component="img"
                height="180"
                image={merchant.image}
                alt={merchant.name}
              />
              <CardContent sx={{ p: 2.5 }}>
                <Chip 
                  label={merchant.category} 
                  size="small" 
                  sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 700, fontSize: 11, mb: 1, borderRadius: 1 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5, lineHeight: 1.3 }}>
                  {merchant.name}
                </Typography>
                
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2, color: "text.secondary" }}>
                  <LocationOn sx={{ fontSize: 16, color: "#94a3b8" }} />
                  {/* Dòng 72: Đẩy noWrap ra ngoài làm Prop của Typography, trong sx chỉ giữ lại CSS ellipsis */}
                  <Typography 
                    variant="caption" 
                    noWrap 
                    sx={{ textOverflow: "ellipsis", overflow: "hidden", display: "block" }}
                  >
                    {merchant.address}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1.5, borderTop: "1px solid #f1f5f9" }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Star sx={{ fontSize: 18, color: "#ffb703" }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>{merchant.rating}</Typography>
                    <Typography variant="caption" color="text.secondary">({merchant.reviewsCount} đánh giá)</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" sx={{ color: "#ff6b35" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, mr: 0.5 }}>Menu</Typography>
                    <ArrowForwardIos sx={{ fontSize: 10, fontWeight: 700 }} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}