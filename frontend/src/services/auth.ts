import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';
import { User } from './userService';
import { clearAllTokens } from '../utils/authUtils';

const AUTH_TOKEN_KEY = 'gencare_auth_token';

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
    const response = await apiClient.post<AuthResponse>(API.Auth.LOGIN_PUBLIC, credentials);
    if (response.data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API.Auth.REGISTER_PUBLIC, data);
    if (response.data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    // Clear local data immediately for faster UX
    clearAllTokens();
    
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

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getCurrentUser: async () => {
    const response = await apiClient.get(API.Auth.ME);
    return response.data;
  },
};