import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component redirect thông minh đến dashboard phù hợp theo role
 */
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  // Redirect theo role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/overview" replace />;
    case 'staff':
      return <Navigate to="/staff/overview" replace />;
    case 'consultant':
      return <Navigate to="/consultant/schedule" replace />;
    case 'customer':
      // Customer có dashboard riêng
      return <Navigate to="/customer/appointments" replace />;
    default:
      // Fallback về homepage nếu role không xác định
      return <Navigate to="/" replace />;
  }
};

export default DashboardRedirect; 