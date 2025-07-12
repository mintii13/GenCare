import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth'; 
import { User } from '../services/userService';
import apiClient from '../services/apiClient';
import { API } from '../config/apiEndpoints';
import { clearAllTokens } from '../utils/authUtils';

interface GetUserProfileResponse {
  success: boolean;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  updateUserInfo: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          console.log('AuthContext: Validating token...');
          // Sử dụng endpoint đúng từ apiEndpoints
          const response = await apiClient.get<GetUserProfileResponse>(API.Auth.GET_USER_PROFILE);
          
          if (response.data.success && response.data.user) {
            console.log('AuthContext: Token validation successful');
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            throw new Error('Invalid API response format');
          }
        } catch (error) {
          console.error("AuthContext: Token validation failed.", error);
          // Xóa token không hợp lệ
          await authService.logout(); 
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    validateToken();

    const handleStorageChange = (event: StorageEvent) => {
      // Dùng key của authService thay vì key cục bộ
      if (event.key === 'gencare_auth_token' || event.key === 'user') {
        validateToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const login = (userData: User, token: string) => {
    console.log('AuthContext: Logging in user:', userData.email);
    setUser(userData);
    authService.setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    // apiClient interceptor sẽ tự động xử lý header
  };

  const logout = async () => {
    console.log('AuthContext: Logging out user');
    // Clear user state immediately for faster UX
    setUser(null);
    
    // Call logout service but don't wait for it
    authService.logout();
    // Note: clearAllTokens() and redirect are handled in authService.logout()
  };

  const updateUserInfo = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !isLoading && !!user, login, logout, isLoading, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};