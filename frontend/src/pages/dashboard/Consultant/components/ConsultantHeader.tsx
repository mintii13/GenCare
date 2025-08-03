import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

interface ConsultantHeaderProps {
  onMenuClick: () => void;
}

const ConsultantHeader: React.FC<ConsultantHeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
        

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {user?.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt="User avatar"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  BS. {user?.full_name}
                </span>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link to="/consultant/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      👤 Hồ sơ cá nhân
                    </Link>
                    <Link to="/consultant/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      ⚙️ Cài đặt tài khoản
                    </Link>
                    <Link to="/consultant/stats" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      📊 Thống kê cá nhân
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <Link to="/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      🆘 Hỗ trợ kỹ thuật
                    </Link>
                    <Link to="/guide" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      📖 Hướng dẫn sử dụng
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ConsultantHeader;