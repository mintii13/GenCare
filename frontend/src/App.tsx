import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home";
import TestPackagesPage from "./pages/test-packages";
import STITestPage from "./pages/test-packages/sti";
import Register from './pages/auth/register';
import AboutUs from './pages/about/AboutUs';
import Layout from './components/layout/Layout';
import LoginModal from "@/components/auth/LoginModal";
import OAuthSuccess from "./pages/OAuthSuccess";
// Blog imports
import { BlogListPage, BlogDetailPage, BlogFormPage } from './pages/blog';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import ConsultantBlogList from './pages/dashboard/Consultant/components/ConsultantBlogList';
import WeeklyScheduleManager from './pages/dashboard/Consultant/WeeklyScheduleManager';
import AppointmentManagement from './pages/dashboard/Consultant/AppointmentManagement';
import CustomerDashboard from './pages/dashboard/Customer';
import MyAppointments from './pages/dashboard/Customer/MyAppointments';
import ConsultantList from './pages/dashboard/Customer/ConsultantList';
import BookAppointment from './pages/consultation/BookAppointment';
import ApiTest from './components/common/ApiTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AutoConfirmService from './services/autoConfirmService';
import AutoConfirmNotification from './components/notifications/AutoConfirmNotification';

// Lazy load Admin Dashboard
const AdminDashboard = lazy(() => import('./pages/dashboard/Admin/AdminDashboard'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const ConsultantLayout = lazy(() => import('./components/layout/ConsultantLayout'));

// Lazy load Staff Dashboard
const StaffDashboard = lazy(() => import('./pages/dashboard/Staff'));
const WeeklyScheduleManagement = lazy(() => import('./pages/dashboard/Staff/WeeklyScheduleManagement'));
const UserManagement = lazy(() => import('./pages/dashboard/Admin/UserManagement'));

const UserProfilePage = lazy(() => import('./pages/auth/user-profile'));

interface AppContentProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({ showLogin, setShowLogin }) => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Khởi động AutoConfirmService khi user đăng nhập
    if (isAuthenticated && user) {
      console.log('🚀 User đã đăng nhập, khởi động AutoConfirmService');
      
      // Yêu cầu quyền notification
      AutoConfirmService.requestNotificationPermission();
      
      // Khởi động service
      AutoConfirmService.start();
    } else {
      // Dừng service khi user đăng xuất
      if (AutoConfirmService.isRunning()) {
        console.log('🛑 User đăng xuất, dừng AutoConfirmService');
        AutoConfirmService.stop();
      }
    }

    // Cleanup khi component unmount
    return () => {
      AutoConfirmService.stop();
    };
  }, [isAuthenticated, user]);

  return (
    <>      
      <Toaster position="top-right" />
      <AutoConfirmNotification />
      <Layout onLoginClick={() => setShowLogin(true)}>
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><div>Đang tải trang...</div></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/api-test" element={<ApiTest />} />
            <Route path="/test-packages/*" element={<TestPackagesPage />} />
            <Route path="/test-packages/sti" element={<STITestPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/user/profile" element={<UserProfilePage />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            {/* Blog routes */}
            <Route path="/blogs" element={<BlogListPage />} />
            <Route path="/blogs/create" element={<BlogFormPage />} />
            <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
            <Route path="/blogs/:blogId/edit" element={<BlogFormPage />} />

            {/* Consultant Dashboard routes */}
            <Route path="/consultant/*" element={<ConsultantLayout />}>
              <Route path="schedule" element={<AppointmentManagement />} />
              <Route path="clients" element={<div>Khách hàng</div>} />
              <Route path="online" element={<div>Tư vấn trực tuyến</div>} />
              <Route path="records" element={<div>Hồ sơ tư vấn</div>} />
              <Route path="qa" element={<div>Q&A / Câu hỏi</div>} />

              <Route path="weekly-schedule" element={<WeeklyScheduleManager />} />
              <Route path="special-schedule" element={<div>Điều chỉnh lịch đặc biệt</div>} />
              <Route path="unavailable" element={<div>Ngày nghỉ</div>} />
              <Route path="blogs" element={<ConsultantBlogList />} />
              <Route path="documents" element={<div>Tài liệu chuyên môn</div>} />
              <Route path="training" element={<div>Đào tạo & Cập nhật</div>} />
              <Route path="consultation-stats" element={<div>Thống kê tư vấn</div>} />
              <Route path="feedback" element={<div>Đánh giá & Phản hồi</div>} />
              <Route path="revenue" element={<div>Báo cáo doanh thu</div>} />
            </Route>

            {/* Customer Dashboard routes */}
            <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            <Route path="/dashboard/customer/appointments" element={<MyAppointments />} />
            <Route path="/dashboard/customer/book-appointment" element={<BookAppointment />} />
            <Route path="/dashboard/customer/consultants" element={<ConsultantList />} />
            <Route path="/dashboard/customer/history" element={<div>Lịch sử tư vấn</div>} />

            {/* Consultation routes */}
            <Route path="/consultation/book" element={<Navigate to="/consultation/book-appointment" replace />} />
            <Route path="/consultation/book-appointment" element={<BookAppointment />} />
            
            {/* Admin Dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="overview" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="test-packages" element={<div>Quản lý gói xét nghiệm</div>} />
              <Route path="blogs" element={<div>Quản lý bài viết</div>} />
              <Route path="revenue" element={<div>Thống kê doanh thu</div>} />
              <Route path="appointments" element={<div>Quản lý lịch hẹn</div>} />
              <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
            </Route>

            {/* Staff Dashboard routes */}
            <Route path="/staff/*" element={<StaffDashboard />}>
              <Route path="overview" element={<div>Trang tổng quan nhân viên</div>} />
              <Route path="appointments" element={<div>Quản lý cuộc hẹn</div>} />
              <Route path="weekly-schedule" element={<WeeklyScheduleManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="consultants" element={<div>Quản lý chuyên gia</div>} />
              <Route path="blogs" element={<div>Quản lý bài viết</div>} />
              <Route path="settings" element={<div>Cài đặt</div>} />
            </Route>
          </Routes>
        </Suspense>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </Layout>
    </>
  );
};

const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <AuthProvider>
      <AppContent showLogin={showLogin} setShowLogin={setShowLogin} />
    </AuthProvider>
  );
};

export default App;