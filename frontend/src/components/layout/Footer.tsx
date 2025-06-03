import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">GenCare</h3>
            <p className="text-primary-100">
              Địa chỉ tin cậy cho các dịch vụ xét nghiệm, tư vấn và chăm sóc sức khỏe toàn diện.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              <li><Link to="/services/stis" className="text-primary-100 hover:text-white">Xét nghiệm STIs</Link></li>
              <li><Link to="/services/reproductive" className="text-primary-100 hover:text-white">Tư vấn sinh sản</Link></li>
              <li><Link to="/services/checkup" className="text-primary-100 hover:text-white">Khám tổng quát</Link></li>
              <li><Link to="/services/cycle" className="text-primary-100 hover:text-white">Theo dõi chu kì</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên kết</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-primary-100 hover:text-white">Về chúng tôi</Link></li>
              <li><Link to="/blog" className="text-primary-100 hover:text-white">Blog</Link></li>
              <li><Link to="/contact" className="text-primary-100 hover:text-white">Liên hệ</Link></li>
              <li><Link to="/privacy" className="text-primary-100 hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="text-primary-100 hover:text-white">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-primary-100">
              <li>Email: contact@gencare.com</li>
              <li>Hotline: 1900 1234</li>
              <li>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</li>
              <li className="mt-4">
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-white">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="#" className="hover:text-white">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="hover:text-white">
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-800 mt-8 pt-8 text-center text-primary-100">
          <p>&copy; {new Date().getFullYear()} GenCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 