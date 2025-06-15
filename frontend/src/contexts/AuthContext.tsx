import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from "axios";

const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'accessToken';

interface User {
  phone: string;
  avatar: string;
  status: boolean;
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  date_of_birth?: string;
  gender?: string;
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
      console.log("AuthContext: Starting token validation...");
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (token) {
        console.log("AuthContext: Token found in localStorage.", token);
        try {
          const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/getUserProfile`;
          console.log(`AuthContext: Sending request to ${apiUrl}`);
          const res = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("AuthContext: API response received:", res.data);
          if (res.data.success) {
            const userData = res.data.user;
            console.log("AuthContext: Profile fetch successful. Setting user:", userData);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            throw new Error('API returned success: false');
          }
        } catch (error) {
          console.error("AuthContext: Token validation API call failed.", error);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } else {
        console.log("AuthContext: No token found in localStorage.");
      }
      
      console.log("AuthContext: Finished token validation. Setting isLoading to false.");
      setIsLoading(false);
    };
    
    validateToken();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_TOKEN_KEY || event.key === 'user') {
        validateToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const login = (userData: User, token: string) => {
    console.log("AuthContext: login function called. Storing user and token.");
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = async () => {
    console.log("AuthContext: logout function called.");
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      delete axios.defaults.headers.common['Authorization'];
    }
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
