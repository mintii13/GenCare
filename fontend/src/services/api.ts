import axios from 'axios';

// Tạo instance axios với base URL của backend
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Thay đổi URL này theo backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; 