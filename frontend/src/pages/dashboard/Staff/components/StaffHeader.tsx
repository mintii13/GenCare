import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Icon from '../../../../components/icons/IconMapping';
import { FaChevronDown, FaSignOutAlt, FaUser } from 'react-icons/fa';

const StaffHeader: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Quản lý Nhân viên</h1>
                    <p className="text-sm text-gray-600">Hệ thống quản lý lịch làm việc</p>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                            <span className="text-sm font-medium">{user?.full_name}</span>
                            <FaChevronDown className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden">
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <FaUser className="w-4 h-4 mr-2" />
                                Thông tin cá nhân
                            </a>
                            <hr className="my-1" />
                            <button 
                                onClick={logout}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <FaSignOutAlt className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default StaffHeader; 