import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './components/StaffSidebar';
import StaffHeader from './components/StaffHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const StaffDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();

    // Bảo vệ route: Chỉ cho phép staff truy cập
    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }
    
    if (user?.role !== 'staff') {
        // Có thể chuyển hướng về trang chủ hoặc trang lỗi 403
        return <Navigate to="/" />;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <StaffSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <StaffHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StaffDashboard; 