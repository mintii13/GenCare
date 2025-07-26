import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import GenCareLogo from '../pages/home/components/GenCareLogo';

interface NavigationProps {
  onLoginClick?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ onLoginClick, onToggleSidebar, isSidebarOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // New state for user dropdown
  const { user, isAuthenticated, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const userMenuTimeoutRef = useRef<NodeJS.Timeout>(); // New ref for user menu timeout
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

  const handleUserMenuEnter = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
    }
    setIsUserMenuOpen(true);
  };

  const handleUserMenuLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 300); // 300ms delay before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (userMenuTimeoutRef.current) { // Clear user menu timeout on unmount
        clearTimeout(userMenuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white fixed top-0 left-0 right-0 w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-primary-700">
            <GenCareLogo />
            <span>GenCare</span>
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
                  className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                >
                  <Link to="/menstrual-cycle" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Theo dõi kinh nguyệt
                  </Link>
                  <Link to="/consultation/book-appointment" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Đặt lịch tư vấn
                  </Link>
                  <Link to="/test-packages/sti" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                    Dịch vụ xét nghiệm 
                  </Link>
                  {isAuthenticated && user?.role === 'customer' && (
                    <>
                      <Link to="/sti-assessment" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                        Đánh giá sàng lọc STI
                      </Link>

                      <Link to="/sti-booking/orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                        Lịch sử đặt lịch STI
                      </Link>
                    
                    </>
                  )}

                </div>
              )}
            </div>
            <Link to="/blogs" className="text-gray-600 hover:text-primary-700">
              Blog
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary-700">
              Về chúng tôi
            </Link>

            {isAuthenticated && user?.role === 'consultant' && (
              <Link to="/consultant" className="text-gray-600 hover:text-primary-700">
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'staff' && (
              <Link to="/staff/overview" className="text-gray-600 hover:text-primary-700">
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin/overview" className="text-gray-600 hover:text-primary-700">
                Quản trị viên
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
              <div
                className="relative group"
                onMouseEnter={handleUserMenuEnter}
                onMouseLeave={handleUserMenuLeave}
              >
                <button
                  className="text-gray-700 font-semibold hover:text-primary-700 flex items-center"
                >
                  {user?.full_name || user?.email}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50"
                  >
                    <Link to="/user/profile" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      Xem thông tin user
                    </Link>
                    <Link to="/sti-booking/orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      Lịch sử xét nghiệm
                    </Link>
                    <Link to="/my-sti-results" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      Kết quả xét nghiệm STI
                    </Link>
                    <Link to="/my-appointments" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      Lịch sử tư vấn
                    </Link>
                    {user?.role === 'customer' && (
                      <>
                        <Link to="/menstrual-cycle" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                          Chu kì kinh nguyệt
                        </Link>
                        <Link to="/my-feedback" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                          Đánh giá của tôi
                        </Link>
                        <Link to="/sti-assessment/history" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                        Lịch sử Sàng Lọc STi
                      </Link>
                      </>
                    )}
                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-red-600"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
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
                      to="/test-packages/sti" 
                      className="block text-gray-600 hover:text-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dịch vụ xét nghiệm
                    </Link>
                    {isAuthenticated && user?.role === 'customer' && (
                      <Link 
                        to="/my-appointments" 
                        className="block text-gray-600 hover:text-primary-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Lịch hẹn của tôi
                      </Link>
                    )}
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
                  <Link to="/user/profile" className="block text-gray-600 hover:text-primary-700 mb-2" onClick={() => setIsMenuOpen(false)}>Trang cá nhân</Link>
                  <Link to="/sti-booking/orders" className="block text-gray-600 hover:text-primary-700 mb-2" onClick={() => setIsMenuOpen(false)}>
                    Lịch sử xét nghiệm
                  </Link>
                  <Link to="/dashboard/customer/my-sti-results" className="block text-gray-600 hover:text-primary-700 mb-2" onClick={() => setIsMenuOpen(false)}>
                    Kết quả xét nghiệm STI
                  </Link>
                  <Link to="/my-appointments" className="block text-gray-600 hover:text-primary-700 mb-2" onClick={() => setIsMenuOpen(false)}>
                    Lịch sử tư vấn
                  </Link>
                  {user?.role === 'customer' && (
                    <Link to="/my-feedback" className="block text-gray-600 hover:text-primary-700 mb-2" onClick={() => setIsMenuOpen(false)}>
                      Đánh giá của tôi
                    </Link>
                  )}
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