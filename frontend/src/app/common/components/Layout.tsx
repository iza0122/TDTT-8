import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNavigation, BottomNavigationAction, Box, Typography } from "@mui/material";
import { Home, VideoLibrary, Map as MapIcon, Person } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname === "/") return 0;
    if (location.pathname === "/videos") return 1;
    if (location.pathname === "/map") return 2;
    if (location.pathname === "/profile") return 3;
    return 0;
  };

  const handleNavigation = (_event: React.SyntheticEvent, newValue: number) => {
    const paths = ["/", "/videos", "/map", "/profile"];
    navigate(paths[newValue]);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative" }}>
      
      {/* 1. LOGO LUÔN NẰM GÓC TRÁI TRÊN CÙNG (Dùng position: absolute) */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: "#ff6b35",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          FoodSpot
        </Typography>
      </Box>


      {/* 2. Phần nội dung (Outlet) */}
      <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#f5f5f5" }}>
        <Outlet />
      </Box>

      <BottomNavigation
        value={getActiveTab()}
        onChange={handleNavigation}
        showLabels
        sx={{
          borderTop: "1px solid #e0e0e0",
          "& .Mui-selected": {
            color: "#ff6b35",
          },
        }}
      >
        <BottomNavigationAction label="Trang chủ" icon={<Home />} />
        <BottomNavigationAction label="Video" icon={<VideoLibrary />} />
        <BottomNavigationAction label="Bản đồ" icon={<MapIcon />} />
        <BottomNavigationAction label="Hồ sơ" icon={<Person />} />
      </BottomNavigation>
    </Box>
  );
}
