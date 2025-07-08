import { API } from '../config/apiEndpoints';
const AUTH_TOKEN_KEY = "gencare_auth_token";
import { jwtDecode } from 'jwt-decode';
import apiClient from './apiClient';

export interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role: 'customer' | 'consultant' | 'admin' | 'staff';
  is_verified: boolean;
  created_date: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'consultant';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    avatar_url: string;
  };
}

export const userService = {
  // Authentication
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<AuthResponse>(
      API.Auth.LOGIN_PUBLIC,
      credentials
    );
    // Store tokens and user info
    if (response.data.success) {
      const { accessToken, user } = response.data.data;
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }

    return response.data;
  },

  async register(userData: RegisterRequest) {
    const response = await apiClient.post(API.Auth.REGISTER_PUBLIC, userData);
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post(API.Auth.LOGOUT);
    } catch (error) {
  
    } finally {
      // Clear local storage regardless of API call result
        localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('user');
    }
  },

  // Profile management
  async getProfile() {
    const response = await apiClient.get(API.Profile.GET);
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest) {
    const response = await apiClient.put<UpdateProfileResponse>(
      API.Profile.UPDATE,
      data
    );

    // Update local storage if successful
    if (response.data.success) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    return response.data;
  },

  async changePassword(data: ChangePasswordRequest) {
    const response = await apiClient.put(API.Auth.CHANGE_PASSWORD, data);
    return response.data;
  },

  async uploadAvatar(formData: FormData) {
    const response = await apiClient.post<UploadAvatarResponse>(
      API.Profile.UPDATE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Update local storage if successful
    if (response.data.success) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        avatar: response.data.data.avatar_url,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    return response.data;
  },

  // Verification
  async sendVerificationEmail() {
    const response = await apiClient.post(API.Auth.SEND_VERIFICATION);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.post(API.Auth.VERIFY_EMAIL, { token });
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await apiClient.post(API.Auth.FORGOT_PASSWORD, { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await apiClient.post(API.Auth.RESET_PASSWORD, {
      token,
      new_password: newPassword
    });
    return response.data;
  },

  // Utility functions
  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  fetchUserRole: async (userId: string) => {
    // Implementation of fetchUserRole method
  }
};

export default userService;