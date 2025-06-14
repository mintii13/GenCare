import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800">Staff Dashboard</h2>
            </div>
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                    <span className="font-medium text-gray-700">{user?.full_name || user?.email}</span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                        <Link
                            to="/user/profile"
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <UserIcon className="w-4 h-4 mr-2" />
                            Trang cá nhân
                        </Link>
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Đăng xuất
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default StaffHeader; 