import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ConsultantHeader from './components/ConsultantHeader';
import ConsultantSidebar from './components/ConsultantSidebar';

const ConsultantDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    </div>
  );
};

export default ConsultantDashboard;