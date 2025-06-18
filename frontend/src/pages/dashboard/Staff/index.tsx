import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './components/StaffSidebar';
import RoleGuard from '../../../components/guards/RoleGuard';

const StaffDashboard: React.FC = () => {
    return (
        <RoleGuard allowedRoles={['staff']} showError={true}>
            <div className="flex h-screen bg-gray-100">
                <StaffSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
};

export default StaffDashboard; 