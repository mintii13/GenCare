import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Define sidebar navigation items
  const navItems = [
    { path: '/admin/overview', label: 'Tổng quan', icon: '📊' },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: '👥' },
    { path: '/admin/test-packages', label: 'Gói xét nghiệm', icon: '🔬' },
    { path: '/admin/blogs', label: 'Quản lý bài viết', icon: '📝' },
    { path: '/admin/revenue', label: 'Thống kê doanh thu', icon: '💰' },
    { path: '/admin/appointments', label: 'Quản lý lịch hẹn', icon: '📅' },
    { path: '/admin/settings', label: 'Cài đặt hệ thống', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-16 w-64 h-full bg-white shadow-lg">
        <nav className="mt-8">
          <div className="px-4 py-2">
            <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
          </div>
          <ul className="mt-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors ${
                    location.pathname === item.path ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="ml-64 pt-16">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
