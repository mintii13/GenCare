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
    <header className="bg-white shadow-sm fixed w-full z-10">
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
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>

              {/* Notifications dropdown */}
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <h3 className="font-semibold">Thông báo</h3>
                    </div>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Bạn có 3 lịch hẹn mới
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      5 câu hỏi chờ trả lời
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      2 kết quả xét nghiệm cần tư vấn
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {/* <img
                  className="h-8 w-8 rounded-full"
                  src={user?. || "https://via.placeholder.com/32"}
                  alt="User avatar"
                /> */}
                <span className="text-sm font-medium text-gray-700">
                  BS. {user?.full_name}
                </span>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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