import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import StaffAppointmentManagement from '../Staff/components/StaffAppointmentManagement';

const AdminAppointmentManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý Lịch hẹn - Admin
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi tất cả lịch hẹn tư vấn trong hệ thống
          </p>
        </div>

        {/* Use the same component as Staff but for Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <StaffAppointmentManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentManagement; 