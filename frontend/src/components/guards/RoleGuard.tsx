import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, openModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để sử dụng tính năng này.');
      openModal('login');
      // Redirect to home page after showing the modal
      navigate('/', { replace: true });
      return;
    }

    if (!user || !allowedRoles.includes(user.role)) {
      toast.error('Bạn không có quyền truy cập trang này.');
      // Redirect to home page for unauthorized roles
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, allowedRoles, openModal, navigate]);

  // Render children only if authenticated and authorized
  if (isAuthenticated && user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Render null while redirecting
  return null;
};

export default RoleGuard;