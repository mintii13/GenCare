import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ConsultantSidebar from '../../pages/dashboard/Consultant/components/ConsultantSidebar';
import ConsultantHeader from '../../pages/dashboard/Consultant/components/ConsultantHeader';
import Footer from './Footer';

const ConsultantLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Hiển thị loading trong khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Redirect if not authenticated or not consultant
  if (!isAuthenticated || user?.role !== 'consultant') {
    return <Navigate to="/" replace />;
  }

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConsultantHeader onMenuClick={handleMenuClick} />
      <ConsultantSidebar isOpen={isSidebarOpen} />
      
      <main
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } pt-16 min-h-screen`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ConsultantLayout;