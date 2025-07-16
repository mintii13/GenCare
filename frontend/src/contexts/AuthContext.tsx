import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth'; 
import { User } from '../services/userService';
import apiClient from '../services/apiClient';
import { API } from '../config/apiEndpoints';

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
      const cachedUser = localStorage.getItem('user');
      
      console.log('🔍 AuthContext: validateToken called', { hasToken: !!token, hasCachedUser: !!cachedUser });
      
      if (token) {
        // Sử dụng cached user trước khi validate
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('✅ AuthContext: Using cached user', parsedUser.role);
          } catch (_e) {
            console.error('❌ AuthContext: Failed to parse cached user');
          }
        }
        
        try {
          // Sử dụng endpoint đúng từ apiEndpoints
          const response = await apiClient.get<GetUserProfileResponse>(API.Profile.GET);
          if (response.data.success && response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            console.log('✅ AuthContext: Token validated, user loaded', response.data.user.role);
          } else {
            throw new Error('Invalid API response format');
          }
        } catch (error) {
          console.error('❌ AuthContext: Token validation failed', error);
          // Chỉ logout nếu token thực sự invalid (401/403), không phải network error
          if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
            console.log('🚪 AuthContext: Logging out due to invalid token');
            await authService.logout(); 
            setUser(null);
          } else {
            console.log('🔄 AuthContext: Keeping cached user due to network error');
            // Giữ cached user nếu chỉ là network error
          }
          // Xóa token không hợp lệ
          await authService.logout(); 
          setUser(null);
        }
      } else {
        console.log('❌ AuthContext: No token found');
        setUser(null);
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
    setUser(userData);
    authService.setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    // apiClient interceptor sẽ tự động xử lý header
  };

  const logout = async () => {
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