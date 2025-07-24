import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  FaCalendarAlt, 
  FaUser,
  FaFlask,
  FaHeart,
  FaStar,
  FaClipboardList,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';

interface CustomerSidebarProps {
  isOpen: boolean;
}

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    // Main features
    { name: 'Lịch hẹn của tôi', path: '/customer/appointments', icon: FaCalendarAlt },
    { name: 'Kết quả xét nghiệm STI', path: '/customer/sti-results', icon: FaFlask },
    { name: 'Chu kì kinh nguyệt', path: '/customer/menstrual-cycle', icon: FaHeart },
    { name: 'Đánh giá của tôi', path: '/customer/feedback', icon: FaStar },
    { name: 'Lịch sử đánh giá', path: '/customer/test-results', icon: FaClipboardList },
    { name: 'Hồ sơ cá nhân', path: '/customer/profile', icon: FaUser },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-xl border-r border-gray-200 transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="h-full overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Khách hàng</h2>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6">
          <div className="px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="mr-3" size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout button at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3" size={18} />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CustomerSidebar; 