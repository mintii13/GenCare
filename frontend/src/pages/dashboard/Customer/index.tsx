import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import MyAppointments from './MyAppointments';
import ConsultantList from './ConsultantList';
import Icon from '../../../components/icons/IconMapping';

const CustomerDashboard: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard/customer/appointments', label: 'Lịch Hẹn Của Tôi', icon: 'calendar' },
    { path: '/dashboard/customer/consultants', label: 'Danh Sách Chuyên Gia', icon: 'user' },
    { path: '/dashboard/customer/packages', label: 'Gói Xét Nghiệm', icon: 'file' },
    { path: '/dashboard/customer/history', label: 'Lịch Sử Tư Vấn', icon: 'clipboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon name={item.icon} className="mr-2" size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon name="clock" color="#f59e0b" size={24} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lịch hẹn chờ xác nhận</dt>
                  <dd className="text-lg font-medium text-gray-900">2</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon name="check" color="#10b981" size={24} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lịch hẹn đã hoàn thành</dt>
                  <dd className="text-lg font-medium text-gray-900">8</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-purple-600 text-xl">📦</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gói xét nghiệm đã đặt</dt>
                  <dd className="text-lg font-medium text-gray-900">3</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Routes>
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="consultants" element={<ConsultantList />} />
          <Route path="packages" element={<div>Gói xét nghiệm (Coming soon)</div>} />
          <Route path="history" element={<div>Lịch sử tư vấn (Coming soon)</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default CustomerDashboard; 