import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConsultantSchedule from '../ConsultantSchedule';

interface ConsultantSidebarProps {
  isOpen: boolean;
}

const ConsultantSidebar: React.FC<ConsultantSidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  const navigation = [
    {
      title: 'Quản lý Tư vấn',
      items: [
        { name: 'Lịch tư vấn của tôi', path: '/consultant/schedule', icon: '📅' },
        { name: 'Khách hàng của tôi', path: '/consultant/clients', icon: '👥' },
        { name: 'Tư vấn trực tuyến', path: '/consultant/online', icon: '💬' },
        { name: 'Hồ sơ tư vấn', path: '/consultant/records', icon: '📋' },
        { name: 'Q&A / Câu hỏi', path: '/consultant/qa', icon: '❓' },
      ],
    },
    {
      title: 'Quản lý Lịch làm việc',
      items: [
        { name: 'Lịch tuần (Calendar View)', path: '/consultant/calendar-view', icon: '📅' },
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

  return (
    <aside
      className={`fixed left-0 top-16 h-screen bg-white shadow-lg transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="h-full overflow-y-auto py-4">
        {navigation.map((section, index) => (
          <div key={index} className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <nav className="mt-2">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 text-sm ${
                    location.pathname === item.path
                      ? 'bg-cyan-50 text-cyan-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ConsultantSidebar; 