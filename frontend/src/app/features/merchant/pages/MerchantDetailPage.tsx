import React from "react";
import { Box, Typography, Card, Stack, Divider } from "@mui/material";
import { ArrowBack, Star, LocationOn, MenuBook } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router";
import { MOCK_MERCHANTS } from "./MerchantListPage";

const MOCK_MENU = [
  { id: "f1", name: "Tô Đặc Biệt (Giò, Chả cua, Nạm bò)", price: "45.000đ", desc: "Món ăn bán chạy nhất, nước lèo hầm xương 12 tiếng ngon ngọt." },
  { id: "f2", name: "Tô Thường thịt nạm nạc", price: "35.000đ", desc: "Phù hợp cho bữa sáng dinh dưỡng, đi kèm rau sống và giá trụng bắp chuối." },
  { id: "f3", name: "Đĩa Cơm Sườn nướng mật ong", price: "40.000đ", desc: "Sườn cốt lết nướng thơm phức bốc khói, ăn kèm mỡ hành nước mắm kẹo." }
];

export default function MerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const merchant = MOCK_MERCHANTS.find((m) => m.id === id) || MOCK_MERCHANTS[0];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 3 }}>
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={1} 
        onClick={() => navigate("/merchants")}
        sx={{ cursor: "pointer", color: "text.secondary", mb: 3, "&:hover": { color: "#ff6b35" } }}
      >
        <ArrowBack sx={{ fontSize: 18 }} />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>QUAY LẠI DANH SÁCH</Typography>
      </Stack>

      <Card sx={{ borderRadius: 5, position: "relative", height: 240, overflow: "hidden", mb: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <Box component="img" src={merchant.image} sx={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }} />
        <Box 
          sx={{ 
            position: "absolute", inset: 0, 
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", p: 4, color: "white" 
          }}
        >
          <Stack spacing={1} alignItems="flex-start" sx={{ width: "100%" }}>
            <Box sx={{ bgcolor: "#ff6b35", px: 1.5, py: 0.5, borderRadius: 1, fontSize: 10, fontWeight: 800 }}>
              {merchant.category}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {merchant.name}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }} sx={{ opacity: 0.9 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <LocationOn sx={{ fontSize: 16 }} />
                <Typography variant="caption">{merchant.address}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Star sx={{ fontSize: 16, color: "#ffb703" }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{merchant.rating} ({merchant.reviewsCount} Đánh giá)</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Card>

      <Card sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0" }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <MenuBook sx={{ color: "#ff6b35" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
            DANH SÁCH MÓN ĂN & THỰC ĐƠN
          </Typography>
        </Stack>
        
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          {MOCK_MENU.map((dish) => (
            <Stack 
              key={dish.id}
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ p: 2, borderRadius: 3, "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>{dish.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{dish.desc}</Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#c2410c", bgcolor: "#fff7ed", px: 2, py: 0.8, borderRadius: 3 }}>
                {dish.price}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}