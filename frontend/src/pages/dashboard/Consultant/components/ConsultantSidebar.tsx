import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import Icon from '../../../../components/icons/IconMapping';

interface ConsultantSidebarProps {
  isOpen: boolean;
}

const ConsultantSidebar: React.FC<ConsultantSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({
    0: true, // Mặc định mở section đầu tiên
    1: true,
    2: false,
    3: false,
  });

  const menuItems = [
    // Main features
    { name: 'Lịch làm việc hàng tuần', path: '/consultant/weekly-schedule', icon: 'calendar' },
    { name: 'Quản lý lịch hẹn', path: '/consultant/appointments', icon: 'calendar' },
    { name: 'Lịch tư vấn của tôi', path: '/consultant/schedule', icon: 'calendar' },
    { name: 'Khách hàng của tôi', path: '/consultant/customers', icon: 'user' },
    { name: 'Hồ sơ tư vấn', path: '/consultant/records', icon: 'clipboard' },
    
    // Schedule management
    { name: 'Thiết lập lịch mặc định', path: '/consultant/default-schedule', icon: 'settings' },
    { name: 'Điều chỉnh lịch đặc biệt', path: '/consultant/special-schedule', icon: 'clock' },
    { name: 'Ngày nghỉ / Không khả dụng', path: '/consultant/unavailable', icon: 'not-available' },
    
    // Content management
    { name: 'Quản lý Blog', path: '/consultant/blogs', icon: 'edit' },
    { name: 'Thư viện tài liệu', path: '/consultant/documents', icon: 'file' },
    
    // Analytics and reports
    { name: 'Thống kê tư vấn', path: '/consultant/consultation-stats', icon: 'stats' },
    { name: 'Báo cáo hiệu suất', path: '/consultant/performance', icon: 'chart' }
  ];

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Icon name="user" color="white" size={20} />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Chuyên gia</h2>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6">
          <div className="px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon name={item.icon} className="mr-3" size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default ConsultantSidebar; 