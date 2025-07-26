import React from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import RoleGuard from '../../../components/guards/RoleGuard';
import StaffSidebar from './components/StaffSidebar';

const StaffDashboard: React.FC = () => {
    return (
        <RoleGuard allowedRoles={['staff']}>
            <DashboardLayout 
                allowedRoles={['staff']}
                SidebarComponent={StaffSidebar}
                redirectPath="/"
            />
        </RoleGuard>
    );
};

export default StaffDashboard;