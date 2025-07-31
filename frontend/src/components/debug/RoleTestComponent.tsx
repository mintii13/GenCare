import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaUserMd, FaUserTie, FaUserShield } from 'react-icons/fa';

const RoleTestComponent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'customer': return <FaUser className="text-blue-500" />;
      case 'consultant': return <FaUserMd className="text-green-500" />;
      case 'staff': return <FaUserTie className="text-purple-500" />;
      case 'admin': return <FaUserShield className="text-red-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'customer': return 'Khách hàng';
      case 'consultant': return 'Chuyên gia tư vấn';
      case 'staff': return 'Nhân viên';
      case 'admin': return 'Quản trị viên';
      default: return 'Chưa xác định';
    }
  };

  const canAccessStaffAppointments = user?.role === 'staff';

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Bạn chưa đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Kiểm tra quyền truy cập</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          {getRoleIcon(user?.role)}
          <span className="font-medium">Role hiện tại:</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
            {getRoleLabel(user?.role)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-medium">Truy cập Staff Appointments:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            canAccessStaffAppointments 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {canAccessStaffAppointments ? ' Được phép' : ' Bị từ chối'}
          </span>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium mb-2">Thông tin User:</p>
          <pre className="text-xs text-gray-600">
            {JSON.stringify({ 
              name: user?.full_name, 
              email: user?.email, 
              role: user?.role 
            }, null, 2)}
          </pre>
        </div>

        {!canAccessStaffAppointments && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Lưu ý:</strong> {user?.role === 'consultant' && 'Chuyên gia tư vấn không thể truy cập trang quản lý lịch hẹn của nhân viên.'}
              {user?.role === 'customer' && 'Khách hàng không thể truy cập trang quản lý lịch hẹn của nhân viên.'}
              {user?.role === 'admin' && 'Quản trị viên không thể truy cập trang này (chỉ dành cho nhân viên).'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleTestComponent;