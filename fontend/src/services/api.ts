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
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // TODO: Implement refresh token logic
        // const response = await api.post('/auth/refresh', { refreshToken });
        // const { token } = response.data;
        // localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, token);
        // originalRequest.headers.Authorization = `Bearer ${token}`;
        // return api(originalRequest);
      } catch (error) {
        // Handle refresh token failure
        localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
        localStorage.removeItem(import.meta.env.VITE_AUTH_REFRESH_TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 