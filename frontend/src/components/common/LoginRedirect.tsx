import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginRedirectProps {
  onShowLogin?: () => void;
}

const LoginRedirect: React.FC<LoginRedirectProps> = ({ onShowLogin }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Hiển thị toast lỗi
      toast.error('Vui lòng đăng nhập để tiếp tục!');
      
      // Trigger login modal nếu có callback
      if (onShowLogin) {
        setTimeout(() => {
          onShowLogin();
        }, 100);
      }
    }
  }, [isAuthenticated, onShowLogin]);

  // Nếu đã đăng nhập, redirect về trang chủ
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Nếu chưa đăng nhập, redirect về trang chủ và hiển thị modal
  return <Navigate to="/" replace />;
};

export default LoginRedirect; 