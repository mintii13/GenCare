import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  onLoginClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-700">
            GenCare
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-700">
              Trang chủ
            </Link>
            <Link to="/test-packages" className="text-gray-600 hover:text-primary-700">
              Gói xét nghiệm
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary-700">
              Về chúng tôi
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary-700">
              Liên hệ
            </Link>
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
              <Link 
                to="/test-packages" 
                className="text-gray-600 hover:text-primary-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Gói xét nghiệm
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
              <div className="pt-4 border-t border-gray-200">
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
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 