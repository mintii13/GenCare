import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaCog,
  FaSignOutAlt,
  FaFlask,
  FaBlog
} from 'react-icons/fa';

interface StaffSidebarProps {
  isOpen: boolean;
}

const StaffSidebar: React.FC<StaffSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Quản lý Lịch',
      items: [
        { name: 'Lịch làm việc tuần', path: '/staff/weekly-schedule', icon: FaCalendarAlt },
        // { name: 'Lịch hẹn tư vấn', path: '/staff/appointments', icon: FaCalendarAlt },
      ]
    },
    {
      title: 'Quản lý Xét nghiệm',
      items: [
        { name: 'Quản lý STI', path: '/staff/sti-management', icon: FaFlask },
      ]
    },
    {
      title: 'Quản lý Nội dung',
      items: [
        { name: 'Quản lý Blog', path: '/staff/blogs', icon: FaBlog },
      ]
    },
    {
      title: 'Quản lý Tài khoản', 
      items: [
        { name: 'Danh sách chuyên gia', path: '/staff/consultants', icon: FaUsers },
      ]
    },
    {
      title: 'Cài đặt',
      items: [
        { name: 'Cài đặt hệ thống', path: '/staff/settings', icon: FaCog },
      ]
    }
  ];

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-10rem)] bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden`}>
      <div className="h-full overflow-y-auto pt-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* Header */}
        <div className="px-6 pb-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <FaUsers className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">Nhân viên</h2>
            <p className="text-sm text-gray-600">{user?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
        <nav className="mt-6 flex-1">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-6 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
        
      {/* Logout button at bottom */}
        <div className="mt-auto px-6 pt-6 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <FaSignOutAlt className="w-5 h-5 mr-3" />
          Đăng xuất
        </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSidebar;