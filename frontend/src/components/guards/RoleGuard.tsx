import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  redirectTo = '/',
  showError = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Đang loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Không có quyền truy cập
  if (!user?.role || !allowedRoles.includes(user.role)) {
    if (showError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang này. 
              {user?.role === 'consultant' && ' Trang này chỉ dành cho nhân viên.'}
              {user?.role === 'customer' && ' Trang này chỉ dành cho nhân viên.'}
              {user?.role === 'admin' && ' Bạn cần quyền truy cập khác.'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaHome className="mr-2" />
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }
    
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
};

export default RoleGuard;