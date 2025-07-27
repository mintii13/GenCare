import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from './Layout';

const CustomerLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Hiển thị loading trong khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Redirect if not authenticated or not customer
  if (!isAuthenticated || user?.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
};

export default CustomerLayout; 