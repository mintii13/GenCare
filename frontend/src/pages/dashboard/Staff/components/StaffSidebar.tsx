import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Calendar, 
    Users, 
    Stethoscope,
    Newspaper,
    Settings
} from 'lucide-react';

const StaffSidebar: React.FC = () => {
    const commonLinkClass = "flex items-center px-4 py-2 text-gray-700 rounded-lg";
    const activeLinkClass = "bg-primary-100 text-primary-700";
    const inactiveLinkClass = "hover:bg-gray-200";

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                <h1 className="text-2xl font-bold text-primary-700">GenCare</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                <NavLink 
                    to="/staff/overview"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Tổng quan
                </NavLink>
                <NavLink 
                    to="/staff/appointments"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Calendar className="w-5 h-5 mr-3" />
                    Quản lý Lịch hẹn
                </NavLink>
                <NavLink 
                    to="/staff/weekly-schedule"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Calendar className="w-5 h-5 mr-3" />
                    Lịch làm việc Chuyên gia
                </NavLink>
                <NavLink 
                    to="/staff/users"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Users className="w-5 h-5 mr-3" />
                    Quản lý Người dùng
                </NavLink>
                <NavLink 
                    to="/staff/consultants"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Stethoscope className="w-5 h-5 mr-3" />
                    Quản lý Chuyên gia
                </NavLink>
                <NavLink 
                    to="/staff/blogs"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Newspaper className="w-5 h-5 mr-3" />
                    Quản lý Bài viết
                </NavLink>
            </nav>
            <div className="px-4 py-4 border-t border-gray-200">
                <NavLink 
                    to="/staff/settings"
                    className={({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                    <Settings className="w-5 h-5 mr-3" />
                    Cài đặt
                </NavLink>
            </div>
        </div>
    );
};

export default StaffSidebar; 