import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNavigation, BottomNavigationAction, Box, AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { Home, VideoLibrary, Map as MapIcon, Person, Logout } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" sx={{ bgcolor: "#ff6b35" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            FoodSpot
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

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
