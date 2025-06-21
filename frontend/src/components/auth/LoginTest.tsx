import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { navigateAfterLogin, getDashboardPathByRole } from '../../utils/navigationUtils';
import { useNavigate } from 'react-router-dom';

const LoginTest: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleTestRedirect = () => {
    if (user) {
      navigateAfterLogin(user, navigate);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Test Login & Redirect</h3>
      
      {isAuthenticated ? (
        <div className="space-y-2">
          <p><strong>Đã đăng nhập:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Dashboard Path:</strong> {getDashboardPathByRole(user?.role)}</p>
          
          <div className="space-x-2">
            <button
              onClick={handleTestRedirect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Redirect to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <p>Chưa đăng nhập</p>
      )}
    </div>
  );
};

export default LoginTest;