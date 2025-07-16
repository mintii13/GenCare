import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import LoginModal from '../auth/LoginModal';
import toast from 'react-hot-toast';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const [showErrorPage, setShowErrorPage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !toastShown && !isLoading) {
      setShowLoginModal(true);
      toast.dismiss();
      toast.error('Bạn cần đăng nhập để sử dụng chức năng này!');
      setToastShown(true);
    }
  }, [isAuthenticated, toastShown, isLoading]);

  useEffect(() => {
    console.log('🛡️ RoleGuard: Checking access', { 
      userRole: user?.role, 
      allowedRoles, 
      isAuthenticated, 
      isLoading 
    });
    
    if (!isLoading && isAuthenticated && user?.role && !allowedRoles.includes(user.role)) {
      const timer = setTimeout(() => {
        console.log('❌ RoleGuard: Showing error page after delay');
        setShowErrorPage(true);
      }, 1000); // Tăng delay lên 1000ms
      
      return () => clearTimeout(timer);
    } else {
      console.log('✅ RoleGuard: Access granted or still loading');
      setShowErrorPage(false);
    }
  }, [user?.role, allowedRoles, isAuthenticated, isLoading]);

  // Reset toastShown khi modal đóng hoặc đăng nhập thành công
  const handleCloseModal = () => {
    setShowLoginModal(false);
    setToastShown(false);
    // Redirect về homepage khi user đóng modal (không muốn đăng nhập)
    window.location.href = '/';
  };
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setToastShown(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} onSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Chỉ hiển thị error khi đã load xong và chắc chắn user không có quyền
  if (!isLoading && isAuthenticated && user?.role && !allowedRoles.includes(user.role)) {
    if (showError && showErrorPage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-gray-600 mb-6">
              <p>Bạn không có quyền truy cập vào trang này!</p>
              {user?.role === 'consultant' && ' Chuyên gia không có tính năng này.'}
              {user?.role === 'customer' && ' Khách hàng không có tính năng này.'}
              {user?.role === 'staff' && ' Nhân viên không có tính năng này.'}
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
    
    // Hiển thị loading trong khi chờ
    if (showError && !showErrorPage) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return null;
  }

  // Cho phép truy cập nếu đang loading, chưa authenticated, hoặc có quyền
  return <>{children}</>;
};

export default RoleGuard;