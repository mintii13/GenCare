import React from 'react';
import { hasGoogleAccessToken } from '../../utils/authUtils';
import { FaGoogle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface GoogleAuthStatusProps {
  className?: string;
  showButton?: boolean;
}

const GoogleAuthStatus: React.FC<GoogleAuthStatusProps> = ({ 
  className = '',
  showButton = true 
}) => {
  const hasGoogleAuth = hasGoogleAccessToken();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google'  ;
  };

  if (hasGoogleAuth) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <FaCheckCircle className="text-sm" />
        <span className="text-sm font-medium">Đã kết nối Google</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-orange-600">
        <FaExclamationTriangle className="text-sm" />
        <span className="text-sm font-medium">Chưa kết nối Google</span>
      </div>
      {showButton && (
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <FaGoogle className="text-xs" />
          Kết nối
        </button>
      )}
    </div>
  );
};

export default GoogleAuthStatus; 