import React from 'react';
import DashboardLayout from './DashboardLayout';
import ConsultantSidebar from '../../pages/dashboard/Consultant/components/ConsultantSidebar';

const ConsultantLayout: React.FC = () => {
  return (
    <DashboardLayout 
      allowedRoles={['consultant']}
      SidebarComponent={ConsultantSidebar}
      redirectPath="/"
      defaultRoute="/consultant/schedule"
    />
  );
};

export default ConsultantLayout;