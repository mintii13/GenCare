import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { isAuthenticated as checkIsAuthenticated, getUser, getToken, login as authLogin, logout as authLogout } from '../utils/authUtils';
import apiClient from '../services/apiClient';
import { API } from '../config/apiEndpoints';
import { env } from '../config/environment';
  
const AUTH_TOKEN_KEY = env.AUTH_TOKEN_KEY;

interface GetUserProfileResponse {
  success: boolean;
  user: User;
}

type ModalMode = 'login' | 'register';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isModalOpen: boolean;
  modalMode: ModalMode;
  openModal: (mode: ModalMode) => void;
  closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkIsAuthenticated());
  const [user, setUser] = useState<User | null>(getUser());
  const [token, setToken] = useState<string | null>(getToken());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('login');

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const cachedUser = localStorage.getItem('user');
      
      if (token) {
        // Sử dụng cached user trước khi validate
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
          } catch (_e) {
            console.error('Failed to parse cached user');
          }
        }
        
        try {
          // Sử dụng endpoint đúng từ apiEndpoints
          const response = await apiClient.get<GetUserProfileResponse>(API.Profile.GET);
          
          if (response.data.success && response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            throw new Error('Invalid API response format');
          }
        } catch (error) {
          // Chỉ logout nếu token thực sự invalid (401/403), không phải network error
          if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem('user');
            setUser(null);
          }
          // Giữ cached user nếu chỉ là network error
        }
      } else {
        setUser(null);
      }
    };
    
    validateToken();

    const handleStorageChange = (event: StorageEvent) => {
      // Dùng key thống nhất từ environment
      if (event.key === AUTH_TOKEN_KEY || event.key === 'user') {
        validateToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (user: User, token: string) => {
    authLogin(user, token);
    setIsAuthenticated(true);
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const openModal = (mode: ModalMode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isModalOpen, modalMode, openModal, closeModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};