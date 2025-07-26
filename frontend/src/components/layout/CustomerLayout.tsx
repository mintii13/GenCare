import React from 'react';
import DashboardLayout from './DashboardLayout';
import CustomerSidebar from '../../pages/dashboard/Customer/components/CustomerSidebar';

const CustomerLayout: React.FC = () => {
  return (
    <DashboardLayout 
      allowedRoles={['customer']}
      SidebarComponent={CustomerSidebar}
      redirectPath="/"
    />
  );
};

export default CustomerLayout; 