import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CustomerDashboard: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard/customer/appointments', label: 'Lịch Hẹn Của Tôi', icon: '📅' },
    { path: '/dashboard/customer/book-appointment', label: 'Đặt Lịch Mới', icon: '➕' },
    { path: '/dashboard/customer/consultants', label: 'Chuyên Gia', icon: '👨‍⚕️' },
    { path: '/dashboard/customer/history', label: 'Lịch Sử Tư Vấn', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Khách Hàng</h1>
          <p className="text-gray-600">Quản lý lịch hẹn tư vấn và thông tin cá nhân</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-l-4 ${
                location.pathname === item.path ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <span className="text-3xl mr-4">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{item.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.path.includes('appointments') && 'Xem và quản lý lịch hẹn'}
                    {item.path.includes('book-appointment') && 'Đặt lịch tư vấn mới'}
                    {item.path.includes('consultants') && 'Danh sách chuyên gia'}
                    {item.path.includes('history') && 'Lịch sử tư vấn đã hoàn thành'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lịch Hẹn Sắp Tới</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600 text-xl">⏰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lịch Hẹn Đã Hoàn Thành</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chuyên Gia Đã Tư Vấn</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-purple-600 text-xl">👨‍⚕️</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard; 