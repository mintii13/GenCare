import axios from 'axios';
import { config } from '../config/constants';

const API_URL = config.api.url;
const API_TIMEOUT = config.api.timeout;
const AUTH_TOKEN_KEY = config.auth.tokenKey;

// Tạo instance axios với base URL của backend
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
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
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, xóa token và chuyển về trang login
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 