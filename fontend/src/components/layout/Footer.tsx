import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold text-xl mb-2">GenCare</div>
          <p className="text-neutral-300">Địa chỉ tin cậy cho sức khỏe chủ động.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Liên kết nhanh</div>
          <ul className="space-y-1 text-neutral-300">
            <li><Link to="/" className="hover:text-white">Trang chủ</Link></li>
            <li><Link to="/services" className="hover:text-white">Dịch vụ</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/register" className="hover:text-white">Đăng ký</Link></li>
            <li><Link to="/auth/login" className="hover:text-white">Đăng nhập</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Mạng xã hội</div>
          <div className="flex gap-4 text-neutral-300">
            <a href="#" className="hover:text-white">Facebook</a>
            <a href="#" className="hover:text-white">Zalo</a>
            <a href="#" className="hover:text-white">YouTube</a>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Liên hệ</div>
          <ul className="text-neutral-300 space-y-1">
            <li>Hotline: 0123 456 789</li>
            <li>Email: info@gencare.com</li>
            <li>Địa chỉ: 123 Đường Sức Khỏe, Q.1, TP.HCM</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-neutral-400 border-t border-primary-800 py-4 text-sm">
        &copy; {new Date().getFullYear()} GenCare. All rights reserved.
      </div>
    </footer>
  );
} 