import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  FaCalendarAlt, 
  FaEdit, 
  FaChartBar, 
  FaClock, 
  FaClipboard,
  FaCog,
  FaUser,
  FaFile,
  FaFlask
} from 'react-icons/fa';

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
    { name: 'Lịch làm việc hàng tuần', path: '/consultant/weekly-schedule', icon: FaCalendarAlt },
    // { name: 'Quản lý lịch hẹn', path: '/consultant/appointments', icon: FaCalendarAlt },
    { name: 'Lịch tư vấn của tôi', path: '/consultant/schedule', icon: FaCalendarAlt },
    // { name: 'Khách hàng của tôi', path: '/consultant/customers', icon: FaUser },
    // { name: 'Hồ sơ tư vấn', path: '/consultant/records', icon: FaClipboard },
    
    // Schedule management
    // { name: 'Thiết lập lịch mặc định', path: '/consultant/default-schedule', icon: FaSettings },
    // { name: 'Điều chỉnh lịch đặc biệt', path: '/consultant/special-schedule', icon: FaClock },
    // { name: 'Ngày nghỉ / Không khả dụng', path: '/consultant/unavailable', icon: FaClock },
    
    // Content management
    { name: 'Quản lý Blog', path: '/consultant/blogs', icon: FaEdit },
    // { name: 'Thư viện tài liệu', path: '/consultant/documents', icon: FaFile },
    
    // STI Results management
    { name: 'Kết quả STI', path: '/consultant/sti-results', icon: FaFlask },
    
    // Analytics and reports
    { name: 'Thống kê tư vấn', path: '/consultant/consultation-stats', icon: FaChartBar },
    // { name: 'Báo cáo hiệu suất', path: '/consultant/performance', icon: FaChartBar }
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
              <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
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
              const IconComponent = item.icon;
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
                  <IconComponent className="mr-3" size={18} />
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