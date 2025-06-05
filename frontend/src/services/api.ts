import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 5000;
const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'accessToken';

// Tạo instance axios với base URL của backend
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug log để kiểm tra cấu hình
console.log('🔧 API Configuration:', {
  API_URL,
  API_TIMEOUT,
  AUTH_TOKEN_KEY
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu muốn xử lý lỗi 401, chỉ cần logout hoặc chuyển hướng, không cần refresh token
    if (error.response?.status === 401) {
      // Xóa tất cả auth data
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Redirect về trang chủ thay vì login
      window.location.href = '/';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api; 