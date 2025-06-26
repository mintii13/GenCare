import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Quản Trị Viên</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quản lý người dùng */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quản lý người dùng</h2>
          <p className="text-gray-600 mb-4">Xem và quản lý tài khoản người dùng, nhân viên và tư vấn viên</p>
          <a href="/admin/users" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>

        {/* Quản lý gói xét nghiệm */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quản lý gói xét nghiệm</h2>
          <p className="text-gray-600 mb-4">Thêm, sửa, xóa các gói xét nghiệm và quản lý giá</p>
          <a href="/admin/test-packages" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>

        {/* Quản lý blog */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quản lý bài viết</h2>
          <p className="text-gray-600 mb-4">Quản lý nội dung blog, kiểm duyệt và xuất bản bài viết</p>
          <a href="/admin/blogs" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>

        {/* Thống kê doanh thu */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Thống kê doanh thu</h2>
          <p className="text-gray-600 mb-4">Xem báo cáo doanh thu từ dịch vụ xét nghiệm và tư vấn</p>
          <a href="/admin/revenue" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>

        {/* Quản lý lịch hẹn */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quản lý lịch hẹn</h2>
          <p className="text-gray-600 mb-4">Theo dõi và quản lý lịch hẹn tư vấn và xét nghiệm</p>
          <a href="/admin/appointments" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>

        {/* Cài đặt hệ thống */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cài đặt hệ thống</h2>
          <p className="text-gray-600 mb-4">Quản lý cấu hình và thông tin chung của hệ thống</p>
          <a href="/admin/settings" className="text-primary-600 hover:text-primary-700 font-medium">
            Xem chi tiết →
          </a>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-50 rounded-lg p-4">
          <h3 className="text-primary-700 font-semibold">Tổng số người dùng</h3>
          <p className="text-2xl font-bold text-primary-800">1,234</p>
        </div>
        <div className="bg-accent-50 rounded-lg p-4">
          <h3 className="text-accent-700 font-semibold">Lịch hẹn hôm nay</h3>
          <p className="text-2xl font-bold text-accent-800">15</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-green-700 font-semibold">Doanh thu tháng này</h3>
          <p className="text-2xl font-bold text-green-800">45.6M VND</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-purple-700 font-semibold">Bài viết mới</h3>
          <p className="text-2xl font-bold text-purple-800">8</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;