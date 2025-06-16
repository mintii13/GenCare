import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConsultantSchedule from '../ConsultantSchedule';

interface ConsultantSidebarProps {
  isOpen: boolean;
}

const ConsultantSidebar: React.FC<ConsultantSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({
    0: true, // Mặc định mở section đầu tiên
    1: true,
    2: false,
    3: false,
  });

  const navigation = [
    {
      title: 'Quản lý Tư vấn',
      items: [
        { name: 'Lịch tư vấn của tôi', path: '/consultant/schedule', icon: '📅' },
        { name: 'Khách hàng của tôi', path: '/consultant/clients', icon: '👥' },
        { name: 'Tư vấn trực tuyến', path: '/consultant/online', icon: '💻' },
        { name: 'Hồ sơ tư vấn', path: '/consultant/records', icon: '📋' },
        { name: 'Q&A / Câu hỏi', path: '/consultant/qa', icon: '❓' },
      ],
    },
    {
      title: 'Quản lý Lịch làm việc',
      items: [
        { name: 'Quản lý lịch (Form)', path: '/consultant/weekly-schedule', icon: '🗓️' },
        { name: 'Điều chỉnh lịch đặc biệt', path: '/consultant/special-schedule', icon: '⏰' },
        { name: 'Ngày nghỉ / Không khả dụng', path: '/consultant/unavailable', icon: '🚫' },
      ],
    },
    {
      title: 'Nội dung & Kiến thức',
      items: [
        { name: 'Quản lý Blog', path: '/consultant/blogs', icon: '📝' },
        { name: 'Tài liệu chuyên môn', path: '/consultant/documents', icon: '📚' },
        { name: 'Đào tạo & Cập nhật', path: '/consultant/training', icon: '🎓' },
      ],
    },
    {
      title: 'Báo cáo & Thống kê',
      items: [
        { name: 'Thống kê tư vấn', path: '/consultant/consultation-stats', icon: '📊' },
        { name: 'Đánh giá & Phản hồi', path: '/consultant/feedback', icon: '⭐' },
        { name: 'Báo cáo doanh thu', path: '/consultant/revenue', icon: '💰' },
      ],
    },
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
        {navigation.map((section, index) => (
          <div key={index} className="mb-4">
            {/* Dropdown Header - Clickable */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:bg-gray-50 transition-colors duration-200 rounded-md mx-2"
            >
              <div className="flex items-center">
                <span>{section.title}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {section.items.length}
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedSections[index] ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Content - Collapsible */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections[index] 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <nav className="mt-1 space-y-1">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-6 py-2.5 text-sm transition-all duration-200 rounded-md mx-2 ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border-l-4 border-cyan-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                    }`}
                    style={{
                      animationDelay: expandedSections[index] ? `${itemIndex * 50}ms` : '0ms'
                    }}
                  >
                    <span className={`mr-3 text-base transition-transform duration-200 ${
                      location.pathname === item.path ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="truncate font-medium">{item.name}</span>
                    {location.pathname === item.path && (
                      <div className="ml-auto w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ConsultantSidebar; 