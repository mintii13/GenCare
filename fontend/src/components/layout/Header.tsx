import { Link } from 'react-router-dom';
import { useState } from 'react';
import LoginModal from '../auth/LoginModal';

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              GenCare
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-primary-600">Trang chủ</Link>
              <Link to="/services" className="text-gray-600 hover:text-primary-600">Dịch vụ</Link>
              <Link to="/blog" className="text-gray-600 hover:text-primary-600">Blog</Link>
              <Link to="/about" className="text-gray-600 hover:text-primary-600">Về chúng tôi</Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-600 hover:text-primary-600"
              >
                Đăng nhập
              </button>
              <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                Đăng ký
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
} 