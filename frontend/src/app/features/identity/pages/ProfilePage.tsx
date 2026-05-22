import {
  Box,
  Avatar,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  Tabs,
  Tab,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Settings,
  Bookmark,
  Favorite,
  GridOn,
  Share,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const mockUserPosts = [
  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
  "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
  "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400",
  "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
  "https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=400",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
];

const mockSavedPosts = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
];

export default function Profile() {
  const [currentTab, setCurrentTab] = useState(0);
  const { user } = useAuth();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const displayPosts = currentTab === 0 ? mockUserPosts : mockSavedPosts;

  const userName = user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", pb: 2 }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "#ff6b35",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {userInitial}
          </Avatar>
          <IconButton sx={{ alignSelf: "flex-start" }}>
            <Settings />
          </IconButton>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {userName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          @{userName.toLowerCase().replace(" ", "")} • Foodie & Traveler
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          🍜 Yêu ẩm thực Việt Nam
          <br />
          📍 Sài Gòn
          <br />
          🎥 Review quán ăn mỗi tuần
        </Typography>

        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              124
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bài viết
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              8.5K
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Người theo dõi
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              342
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đang theo dõi
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: "#ff6b35",
              "&:hover": { bgcolor: "#e55a2b" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Chỉnh sửa trang cá nhân
          </Button>
          <Button
            variant="outlined"
            sx={{
              minWidth: 44,
              borderColor: "#e0e0e0",
              color: "text.primary",
            }}
          >
            <Share />
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
          <Chip label="Phở" size="small" />
          <Chip label="Bún" size="small" />
          <Chip label="Street Food" size="small" />
          <Chip label="Cafe" size="small" />
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .Mui-selected": {
              color: "#ff6b35 !important",
            },
            "& .MuiTabs-indicator": {
              bgcolor: "#ff6b35",
            },
          }}
        >
          <Tab icon={<GridOn />} label="Bài viết" />
          <Tab icon={<Bookmark />} label="Đã lưu" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1 }}>
        <Grid container spacing={0.5}>
          {displayPosts.map((image, index) => (
            <Grid item xs={4} key={index}>
              <Card sx={{ position: "relative", paddingTop: "100%", cursor: "pointer" }}>
                <CardMedia
                  component="img"
                  image={image}
                  alt={`Post ${index + 1}`}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: "rgba(0,0,0,0)",
                    transition: "background-color 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.3)",
                    },
                  }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>

        {displayPosts.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Favorite sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Chưa có bài viết nào
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
