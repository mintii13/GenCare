import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 5000;

// Tạo instance axios với base URL của backend
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
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
      localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
      window.location.href = '/login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api; 