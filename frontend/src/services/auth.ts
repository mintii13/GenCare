import api from './api';
import { config } from '../config/constants';
import { API } from '../config/apiEndpoints';

const AUTH_TOKEN_KEY = config.auth.tokenKey;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API.Auth.LOGIN_PUBLIC, credentials);
      const { token, user } = response.data;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API.Auth.REGISTER_PUBLIC, data);
      const { token, user } = response.data;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      // Gọi API logout trước khi clear token
      const token = this.getToken();
      if (token) {
        await api.post(API.Auth.LOGOUT, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
  
    } finally {
      // Xóa tất cả token
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Redirect về trang chủ
      window.location.href = '/';
    }
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await api.get(API.Auth.ME);
    return response.data;
  },
};