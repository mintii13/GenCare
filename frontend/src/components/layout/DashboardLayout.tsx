import React, { useState, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navigation from '../Navigation';
import Footer from './Footer';

interface DashboardLayoutProps {
  children?: ReactNode;
  allowedRoles: string[];
  SidebarComponent: React.ComponentType<{ isOpen: boolean }>;
  redirectPath?: string;
  defaultRoute?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  allowedRoles, 
  SidebarComponent,
  redirectPath = "/",
  defaultRoute
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Hiển thị loading trong khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Redirect if not authenticated or not allowed role
  if (!isAuthenticated || !allowedRoles.includes(user?.role || '')) {
    return <Navigate to={redirectPath} replace />;
  }

  // Redirect to default route if provided and user is at base path
  if (defaultRoute) {
    const basePath = defaultRoute.split('/').slice(0, -1).join('/');
    const basePathWithSlash = basePath + '/';
    
    if (location.pathname === basePath || location.pathname === basePathWithSlash) {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <Navigation />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <SidebarComponent isOpen={isSidebarOpen} />

        {/* Nút hamburger menu ở bên trái sidebar */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`fixed top-20 z-50 bg-white rounded-r-lg shadow-sm p-3 border border-l-0 border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-300 ${
            isSidebarOpen ? 'left-64' : 'left-0'
          }`}
          title={isSidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center">
            <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
            <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 mt-1 ${isSidebarOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 mt-1 ${isSidebarOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
          </div>
        </button>

        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} min-h-screen`}>
          <div className="pb-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DashboardLayout; 