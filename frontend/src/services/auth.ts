import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';
import { User } from '../types/user';
import { clearAllAuthData, login as loginUtil } from '../utils/authUtils';
import { env } from '../config/environment';

// Sử dụng environment config thống nhất
const AUTH_TOKEN_KEY = env.AUTH_TOKEN_KEY;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
}

interface AuthResponse {
  success: boolean;
  accessToken?: string;
  token?: string;
  user: User;
  message?: string;
}

interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

interface RegisterResponse {
  success: boolean;
  message?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<AuthResponse>(API.Auth.LOGIN, { email, password });
    const data = response.data;
    
    const token = data.accessToken || data.token;
    if (token && data.user) {
      // Use the centralized login utility
      loginUtil(data.user, token);
    }
    
    return {
      data: {
        user: data.user,
        accessToken: token || ''
      }
    };
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiClient.post(API.Auth.CHECK_EMAIL, { email });
      return response.data?.exists || false;
    } catch (error) {
      return false;
    }
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(API.Auth.REGISTER, data);
    return response.data;
  },

  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    const response = await apiClient.post<VerifyOtpResponse>(API.Auth.VERIFY_OTP, { email, otp });
    return response.data;
  },

  // Legacy register method for backward compatibility
  async registerLegacy(data: { email: string; password: string; name: string; phone?: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API.Auth.REGISTER, data);
    const responseData = response.data;
    
    // Lưu token nếu có
    const token = responseData.accessToken || responseData.token;
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    // Lưu user data nếu có
    if (responseData.user) {
      localStorage.setItem('user', JSON.stringify(responseData.user));
    }
    
    return responseData;
  },

  async logout(): Promise<void> {
    // Clear local data immediately for faster UX
    clearAllAuthData();
    
    // Try to notify backend but don't wait for response
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        // Send logout request without waiting for response
        apiClient.post(API.Auth.LOGOUT, {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 2000 // Short timeout for logout
        }).catch(() => {
          // Ignore logout API errors - user is already logged out locally
          console.log("Backend logout notification failed - continuing with local logout");
        });
      }
    } catch (error) {
      // Ignore errors - user is already logged out locally
      console.log("Logout notification skipped due to error");
    }
    
    // Use window.location for clean state reset
    window.location.href = '/';
  },

  getCurrentUser: async () => {
    const response = await apiClient.get(API.Profile.GET);
    return response.data;
  },
};