// src/app/core/api/axios-client.ts
import axios from 'axios';
import { getAccessToken, removeAccessToken } from '../utils/tokens';

const axiosClient = axios.create({
  // Thay đổi URL này thành link deploy hoặc localhost của Backend FastAPI khi chạy thực tế
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 giây đợi phản hồi
});

// Lớp chặn Gửi đi (Request Interceptor): Tự động nhét Token vào Header
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lớp chặn Phản hồi về (Response Interceptor): Bắt lỗi hệ thống (Ví dụ: hết hạn đăng nhập)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Trả về thẳng dữ liệu sạch từ Backend
  },
  (error) => {
    // Nếu Backend báo lỗi 401 (Unauthorized) -> Token hết hạn hoặc fake -> Đá ra trang login
    if (error.response && error.response.status === 401) {
      removeAccessToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;