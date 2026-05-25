import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Google,
  Facebook,
  Phone,
  Visibility,
  VisibilityOff,
  Restaurant,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { loginUser, registerUser } from "../indentity-services";
import { setAccessToken } from "../../../core/utils/tokens";

export default function Auth() {
  const [authMode, setAuthMode] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const isLogin = authMode === 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setAuthMode(newValue);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await loginUser({ username: phoneNumber, password });
        setAccessToken(response.access_token);
        login({
          id: String(response.user.id),
          name: response.user.full_name || "User",
          email: response.user.email || undefined,
        });
        navigate("/");
      } else {
        const isPhone = /^\d+$/.test(phoneNumber.trim());
        const payload = isPhone
          ? { phone_number: phoneNumber, password, full_name: fullName }
          : { email: phoneNumber, password, full_name: fullName };
        await registerUser(payload);
        setAuthMode(0);
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const message = axiosErr?.response?.data?.detail;
      setError(message || (isLogin ? "Đăng nhập thất bại. Vui lòng thử lại." : "Đăng ký thất bại. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ff6b35 0%, #ff8555 100%)",
        p: 2,
        position: "relative",
      }}
    >
      <IconButton
        onClick={() => navigate("/")}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          color: "white",
          bgcolor: "rgba(0,0,0,0.15)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.25)" },
        }}
      >
        <ArrowBack />
      </IconButton>
      <Card sx={{ maxWidth: 440, width: "100%", borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#ff6b35",
                width: 64,
                height: 64,
                borderRadius: "50%",
                mb: 2,
              }}
            >
              <Restaurant sx={{ fontSize: 36, color: "white" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Chào mừng đến FoodSpot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Khám phá hàng ngàn quán ăn ngon
            </Typography>
          </Box>

          <Tabs
            value={authMode}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              "& .Mui-selected": {
                color: "#ff6b35 !important",
              },
              "& .MuiTabs-indicator": {
                bgcolor: "#ff6b35",
              },
            }}
          >
            <Tab label="Đăng nhập" />
            <Tab label="Đăng ký" />
          </Tabs>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Box sx={{ visibility: isLogin ? "hidden" : "visible", height: isLogin ? 0 : "auto", overflow: "hidden" }}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  variant="outlined"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </Box>

              <TextField
                fullWidth
                label="Số điện thoại"
                variant="outlined"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0912345678"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Mật khẩu"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {isLogin && (
                <Box sx={{ textAlign: "right" }}>
                  <Button
                    size="small"
                    sx={{ textTransform: "none", color: "#ff6b35" }}
                  >
                    Quên mật khẩu?
                  </Button>
                </Box>
              )}

              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  bgcolor: "#ff6b35",
                  "&:hover": { bgcolor: "#e55a2b" },
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                }}
              >
                {loading
                  ? <CircularProgress size={20} sx={{ color: "white" }} />
                  : (isLogin ? "Đăng nhập" : "Đăng ký")
                }
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hoặc tiếp tục với
            </Typography>
          </Divider>

          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Google />}
              onClick={() => handleSocialLogin("Google")}
              sx={{
                textTransform: "none",
                borderColor: "#e0e0e0",
                color: "text.primary",
                py: 1.2,
                "&:hover": {
                  borderColor: "#ff6b35",
                  bgcolor: "#fff3e0",
                },
              }}
            >
              Tiếp tục với Google
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Facebook />}
              onClick={() => handleSocialLogin("Facebook")}
              sx={{
                textTransform: "none",
                borderColor: "#e0e0e0",
                color: "text.primary",
                py: 1.2,
                "&:hover": {
                  borderColor: "#1877f2",
                  bgcolor: "#e3f2fd",
                },
              }}
            >
              Tiếp tục với Facebook
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Phone />}
              onClick={() => handleSocialLogin("Phone")}
              sx={{
                textTransform: "none",
                borderColor: "#e0e0e0",
                color: "text.primary",
                py: 1.2,
                "&:hover": {
                  borderColor: "#4caf50",
                  bgcolor: "#e8f5e9",
                },
              }}
            >
              Đăng nhập bằng OTP
            </Button>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", mt: 3 }}
          >
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Button size="small" sx={{ textTransform: "none", p: 0, minWidth: 0 }}>
              Điều khoản dịch vụ
            </Button>{" "}
            và{" "}
            <Button size="small" sx={{ textTransform: "none", p: 0, minWidth: 0 }}>
              Chính sách bảo mật
            </Button>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
