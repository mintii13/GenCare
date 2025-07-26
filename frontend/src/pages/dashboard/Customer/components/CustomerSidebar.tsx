import React, { useState } from 'react';
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
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaEnvelope
} from 'react-icons/fa';

interface CustomerSidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const menuGroups: MenuGroup[] = [
    {
      title: 'Chăm sóc sức khỏe',
      items: [
        { name: 'Lịch hẹn của tôi', path: '/dashboard/customer/my-appointments', icon: FaCalendarAlt, badge: '3' },
        { name: 'Chu kì kinh nguyệt', path: '/dashboard/customer/menstrual-cycle', icon: FaHeart },
        { name: 'Kết quả xét nghiệm STI', path: '/dashboard/customer/my-sti-results', icon: FaFlask, badge: 'New' },
      ]
    },
    {
      title: 'Đánh giá & Phản hồi',
      items: [
        { name: 'Đánh giá của tôi', path: '/dashboard/customer/feedback', icon: FaStar },
        { name: 'Lịch sử đánh giá STI', path: '/dashboard/customer/sti-assessment-history', icon: FaClipboardList },
      ]
    },
    {
      title: 'Tài khoản',
      items: [
        { name: 'Hồ sơ cá nhân', path: '/dashboard/customer/profile', icon: FaUser },
      ]
    }
  ];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-10rem)] bg-white shadow-lg border-r border-gray-200 transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      <div className="h-full overflow-y-auto pt-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="px-6 pb-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <FaUser className="text-white" size={16} />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Khách hàng</h2>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>
            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              <button className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded">
                <FaEnvelope size={14} />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded relative">
                <FaBell size={14} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center" style={{fontSize: '10px'}}>2</span>
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Tìm kiếm chức năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6 flex-1">
          <div className="px-3">
            {filteredGroups.map((group, groupIndex) => (
              <div key={group.title} className={`${groupIndex > 0 ? 'mt-6' : ''}`}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                        className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                            ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                        <div className="flex items-center">
                  <IconComponent className="mr-3" size={18} />
                  {item.name}
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.badge === 'New' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                </Link>
              );
            })}
                </div>
              </div>
            ))}
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