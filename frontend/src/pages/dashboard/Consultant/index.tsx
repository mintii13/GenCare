import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import ConsultantSidebar from './components/ConsultantSidebar';
import { useAuth } from '../../../contexts/AuthContext';

const ConsultantDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Hiển thị loading trong khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Kiểm tra quyền truy cập sau khi đã load xong
  if (!user || user.role !== 'consultant') {
    return <Navigate to="/" replace />;
  }

  // Nếu đang ở route gốc /consultant, chuyển hướng đến trang schedule
  if (location.pathname === '/consultant' || location.pathname === '/consultant/') {
    return <Navigate to="/consultant/schedule" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Nút icon con mắt ẩn/hiện sidebar *
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="absolute top-20 left-2 z-50 bg-white rounded-full shadow p-2 border border-gray-200 hover:bg-gray-100 transition md:block"
          title={isSidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
        >
          {isSidebarOpen ? (
            // Eye Off SVG
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.924 6.108 6.75 9.75 6.75 1.563 0 3.06-.362 4.384-1.02M6.53 6.53A9.726 9.726 0 0 1 12 5.25c3.642 0 7.714 2.826 9.75 6.75a10.45 10.45 0 0 1-4.293 4.893M6.53 6.53l10.94 10.94M6.53 6.53 3.98 8.223M17.47 17.47l2.55-1.693" />
            </svg>
          ) : (
            // Eye SVG
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C4.286 7.826 8.358 5 12 5c3.642 0 7.714 2.826 9.75 7-2.036 4.174-6.108 7-9.75 7-3.642 0-7.714-2.826-9.75-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
        {/* Sidebar */}
        <ConsultantSidebar isOpen={isSidebarOpen} />
        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ConsultantDashboard; 