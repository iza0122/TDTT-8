import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Paper,
  IconButton,
  InputBase,
} from "@mui/material";
import {
  Search,
  Star,
  LocationOn,
  Phone,
  Schedule,
  FilterList,
} from "@mui/icons-material";

const mockLocations = [
  {
    id: 1,
    name: "Phở Hà Nội",
    cuisine: "Phở",
    rating: 4.8,
    address: "123 Nguyễn Huệ, Q.1",
    phone: "028 3823 xxxx",
    hours: "6:00 - 22:00",
    distance: "0.5 km",
    lat: 10.7769,
    lng: 106.7009,
  },
  {
    id: 2,
    name: "Sushi Tokyo",
    cuisine: "Nhật Bản",
    rating: 4.9,
    address: "456 Võ Văn Tần, Q.3",
    phone: "028 3824 xxxx",
    hours: "11:00 - 23:00",
    distance: "1.2 km",
    lat: 10.7825,
    lng: 106.6923,
  },
  {
    id: 3,
    name: "Bánh Mì Saigon",
    cuisine: "Street Food",
    rating: 4.7,
    address: "789 Trần Hưng Đạo, Q.5",
    phone: "028 3825 xxxx",
    hours: "5:00 - 20:00",
    distance: "2.0 km",
    lat: 10.7542,
    lng: 106.6767,
  },
  {
    id: 4,
    name: "Bún Chả Hương",
    cuisine: "Việt Nam",
    rating: 4.6,
    address: "321 Sư Vạn Hạnh, Q.10",
    phone: "028 3826 xxxx",
    hours: "7:00 - 21:00",
    distance: "1.8 km",
    lat: 10.7722,
    lng: 106.6634,
  },
];

export default function Map() {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper
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
          placeholder="Tìm kiếm địa điểm..."
          inputProps={{ "aria-label": "search locations" }}
        />
        <IconButton size="small">
          <FilterList />
        </IconButton>
      </Paper>

      <Box
        sx={{
          flex: 1,
          position: "relative",
          bgcolor: "#e0e0e0",
          backgroundImage:
            "url(https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(255,255,255,0.3)",
          }}
        />

        {mockLocations.map((location) => (
          <Box
            key={location.id}
            sx={{
              position: "absolute",
              left: `${20 + location.id * 15}%`,
              top: `${15 + location.id * 12}%`,
              zIndex: selectedLocation === location.id ? 10 : 1,
            }}
          >
            <IconButton
              onClick={() =>
                setSelectedLocation(
                  selectedLocation === location.id ? null : location.id
                )
              }
              sx={{
                bgcolor: selectedLocation === location.id ? "#ff6b35" : "#ff6b35",
                color: "white",
                "&:hover": { bgcolor: "#e55a2b" },
                boxShadow: 3,
              }}
            >
              <LocationOn />
            </IconButton>
          </Box>
        ))}

        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Chip label="Phở" size="small" sx={{ bgcolor: "white" }} />
          <Chip label="Sushi" size="small" sx={{ bgcolor: "white" }} />
          <Chip label="Bánh Mì" size="small" sx={{ bgcolor: "white" }} />
        </Box>
      </Box>

      <Box
        sx={{
          maxHeight: "40%",
          overflow: "auto",
          p: 2,
          bgcolor: "white",
          borderTop: "2px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quán ăn gần bạn
        </Typography>

        <Stack spacing={2}>
          {mockLocations.map((location) => (
            <Card
              key={location.id}
              sx={{
                borderRadius: 2,
                cursor: "pointer",
                border:
                  selectedLocation === location.id
                    ? "2px solid #ff6b35"
                    : "1px solid #e0e0e0",
              }}
              onClick={() =>
                setSelectedLocation(
                  selectedLocation === location.id ? null : location.id
                )
              }
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {location.name}
                  </Typography>
                  <Chip label={location.distance} size="small" />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <Star sx={{ fontSize: 16, color: "#ffc107" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {location.rating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    • {location.cuisine}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                  <LocationOn sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {location.address}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Phone sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {location.phone}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Schedule sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {location.hours}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
