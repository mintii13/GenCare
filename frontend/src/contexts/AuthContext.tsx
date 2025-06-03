import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from "axios";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    // Sync user state with localStorage changes (multi-tab)
    const syncUser = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Kiểm tra token và lấy user info khi app load hoặc sau khi login Google
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      axios.get("http://localhost:3000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.success) setUser(res.data.user);
      })
      .catch(() => setUser(null));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Nếu cần gọi API logout thì gọi ở đây
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}; 