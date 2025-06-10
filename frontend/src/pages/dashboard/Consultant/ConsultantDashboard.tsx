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
        } pt-16`}
      >
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ConsultantDashboard; 