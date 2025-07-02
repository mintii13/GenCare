import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

// Thêm token vào header của mỗi request
instance.interceptors.request.use(
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

// Xử lý response
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Nếu token hết hạn hoặc không hợp lệ
      if (error.response.status === 401) {
        localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
        localStorage.removeItem('user');
        localStorage.removeItem('consultant_validation');
        localStorage.removeItem('consultant_validation_time');
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'));
      }
      
      // Nếu không có quyền truy cập
      if (error.response.status === 403) {
        // Xóa cache validation
        localStorage.removeItem('consultant_validation');
        localStorage.removeItem('consultant_validation_time');
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
