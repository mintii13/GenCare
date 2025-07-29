import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

// Admin Sidebar Component
interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define sidebar navigation items
  const navItems = [
    // { path: '/admin/overview', label: 'Tổng quan' },
    { path: '/admin/users', label: 'Quản lý người dùng' },
    // { path: '/admin/test-packages', label: 'Gói xét nghiệm' },
    { path: '/admin/blogs', label: 'Quản lý bài viết' },
    // { path: '/admin/revenue', label: 'Thống kê doanh thu' },
    { path: '/admin/appointments', label: 'Quản lý lịch hẹn' },
    { path: '/admin/sti-management', label: 'Quản lý STI' },
    // { path: '/admin/audit-log', label: 'Nhật ký hệ thống' },
    // { path: '/admin/settings', label: 'Cài đặt hệ thống' },
  ];

  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-10rem)] bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-0'
    } overflow-hidden`}>
      <div className="h-full overflow-y-auto pt-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="px-6 pb-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Admin</h2>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6 flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
              
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button at bottom */}
        <div className="mt-auto px-6 pt-6 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <span className="mr-3">🚪</span>
            Đăng xuất
          </button>
      </div>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <DashboardLayout 
      allowedRoles={['admin']}
      SidebarComponent={AdminSidebar}
      redirectPath="/"
    />
  );
};

export default AdminLayout;