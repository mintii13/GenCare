import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types/user';
import { apiClient } from '../services/apiClient';
import { API } from '../config/apiEndpoints';
import { getToken, getUser, isAuthenticated } from '../utils/authUtils';
import { env } from '../config/environment';
  
const AUTH_TOKEN_KEY = env.AUTH_TOKEN_KEY;

// Define missing interfaces
interface GetUserProfileResponse {
  success: boolean;
  user: User;
  message?: string;
}

export type ModalMode = 'login' | 'register';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isModalOpen: boolean;
  modalMode: ModalMode;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  updateUserInfo: (userData: Partial<User>) => void;
  openModal: (mode?: ModalMode) => void;
  closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticatedState, setIsAuthenticated] = useState<boolean>(() => isAuthenticated());
  const [user, setUser] = useState<User | null>(getUser());
  const [token, setToken] = useState<string | null>(getToken());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  
  // Race condition protection
  const isValidatingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const validateToken = async () => {
      // Prevent concurrent validations
      if (isValidatingRef.current) {
        return;
      }
      
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const cachedUser = localStorage.getItem('user');
      
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
        }
        return;
      }

      isValidatingRef.current = true;
      setIsLoading(true);
      
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      try {
        // Use cached user first
        if (cachedUser && isMounted) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            setToken(token);
          } catch (e) {
            console.error('Failed to parse cached user');
            localStorage.removeItem('user');
          }
        }
        
        // Validate with server (with timeout and abort signal)
        const response = await Promise.race([
          apiClient.get<GetUserProfileResponse>(API.Profile.GET, {
            signal: abortControllerRef.current.signal
          }),
          new Promise<never>((_, reject) => {
            timeoutRef.current = setTimeout(() => reject(new Error('Request timeout')), 10000);
          })
        ]);
          
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (isMounted && response.data.success && response.data.user) {
            setUser(response.data.user);
          setIsAuthenticated(true);
          setToken(token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            throw new Error('Invalid API response format');
          }
        
      } catch (error: any) {
        if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message === 'Request timeout' || error.message === 'canceled') {
          // Request was cancelled, ignore
          return;
        }
        
        if (isMounted) {
          // Only logout on auth errors, not network errors
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            setToken(null);
          }
          // Keep cached user for network errors
        }
        
        console.error('Token validation failed:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isValidatingRef.current = false;
      }
    };
    
    validateToken();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_TOKEN_KEY || event.key === 'user') {
        // Debounce storage events
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
        validateToken();
          }
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      window.removeEventListener('storage', handleStorageChange);
      isValidatingRef.current = false;
    };
  }, []);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_TOKEN_KEY, userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async (): Promise<void> => {
    // Cancel any ongoing validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    try {
      // Try to call logout endpoint if token exists
      const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (currentToken) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
      }
    } catch (error) {
      // Ignore logout API errors
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('user');
    setUser(null);
    setToken(null);
      setIsAuthenticated(false);
      closeModal();
    }
  };

  const updateUserInfo = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const openModal = (mode: ModalMode = 'login') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
      <AuthContext.Provider value={{
        isAuthenticated: isAuthenticatedState,
        user,
        token,
        isModalOpen,
        modalMode,
        isLoading,
        login,
        logout,
        updateUserInfo,
        openModal,
        closeModal
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 