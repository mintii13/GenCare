import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  onLoginClick?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ onLoginClick, onToggleSidebar, isSidebarOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const timeoutRef = useRef<number>();
  const location = useLocation();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsServicesOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 300); // 300ms delay before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-700">
            GenCare
          </Link>
          {/* Nút ẩn/hiện sidebar chỉ khi ở dashboard consultant */}
          {location.pathname.startsWith('/consultant') && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="ml-4 px-3 py-1 rounded bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 transition hidden md:inline"
            >
              {isSidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
            </button>
          )}
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-700">
              Trang chủ
            </Link>
            <div 
              className="relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className="text-gray-600 hover:text-primary-700 flex items-center"
              >
                Dịch vụ
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isServicesOpen && (
                <div 
                  className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                >
                  <Link to="/period-tracking" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Theo dõi kinh nguyệt
                  </Link>
                  <Link to="/consultation" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Đặt lịch tư vấn
                  </Link>
                  <Link to="/test-packages" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Dịch vụ xét nghiệm
                  </Link>
                </div>
              )}
            </div>
            <Link to="/blogs" className="text-gray-600 hover:text-primary-700">
              Blog
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary-700">
              Về chúng tôi
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary-700">
              Liên hệ
            </Link>
            {isAuthenticated && user?.role === 'consultant' && (
              <Link to="/consultant" className="text-gray-600 hover:text-primary-700">
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700 font-semibold">{user?.full_name || user?.email}</span>
                <Link to="/user/profile" className="text-gray-600 hover:text-primary-700">Trang cá nhân</Link>
                <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition">Đăng xuất</button>
              </>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-gray-600 hover:text-primary-700"
                >
                  Đăng nhập
                </button>
                <Link 
                  to="/register" 
                  className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <div className="space-y-2">
                <button 
                  className="text-gray-600 hover:text-primary-700 flex items-center"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  Dịch vụ
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isServicesOpen && (
                  <div className="pl-4 space-y-2">
                    <Link 
                      to="/period-tracking" 
                      className="block text-gray-600 hover:text-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Theo dõi kinh nguyệt
                    </Link>
                    <Link 
                      to="/consultation" 
                      className="block text-gray-600 hover:text-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đặt lịch tư vấn
                    </Link>
                    <Link 
                      to="/test-packages" 
                      className="block text-gray-600 hover:text-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dịch vụ xét nghiệm
                    </Link>
                  </div>
                )}
              </div>
              <Link 
                to="/blogs" 
                className="text-gray-600 hover:text-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                to="/about" 
                className="text-gray-600 hover:text-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Về chúng tôi
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Liên hệ
              </Link>
              
              {isAuthenticated ? (
                <>
                  <span className="block text-gray-700 font-semibold mb-2">{user?.full_name || user?.email}</span>
                  <Link to="/user/profile" className="block text-gray-600 hover:text-primary-700 mb-2">Trang cá nhân</Link>
                  <button 
                    className="block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition mb-2"
                    onClick={() => { setIsMenuOpen(false); logout(); }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="block text-gray-600 hover:text-primary-700 mb-4"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onLoginClick) onLoginClick();
                    }}
                  >
                    Đăng nhập
                  </button>
                  <Link 
                    to="/register" 
                    className="block bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 