import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home";
import TestPackagesPage from "./pages/test-packages";
import STITestPage from "./pages/test-packages/sti";

// STI Booking imports
const BookSTIPage = lazy(() => import('./pages/sti-booking/BookSTIPage'));
const OrdersPage = lazy(() => import('./pages/sti-booking/OrdersPage'));
const MultipleTestBooking = lazy(() => import('./pages/sti-booking/MultipleTestBooking'));

// STI Assessment imports
const STIAssessmentForm = lazy(() => import('./pages/sti-assessment/STIAssessmentForm'));
const STIAssessmentHistory = lazy(() => import('./pages/sti-assessment/STIAssessmentHistory'));
import Register from './pages/auth/register';
import AboutUs from './pages/about/AboutUs';
import Layout from './components/layout/Layout';
import LoginModal from "@/components/auth/LoginModal";
import OAuthSuccess from "./pages/OAuthSuccess";
// Blog imports
import { BlogListPage, BlogDetailPage, BlogFormPage } from './pages/blog';
import { Toaster } from 'react-hot-toast';
import ConsultantBlogList from './pages/dashboard/Consultant/components/ConsultantBlogList';
import WeeklyScheduleManager from './pages/dashboard/Consultant/WeeklyScheduleManager';
import AppointmentManagement from './pages/dashboard/Consultant/AppointmentManagement';
import MyAppointments from './pages/dashboard/Customer/MyAppointments';
import ConsultantList from './pages/dashboard/Customer/ConsultantList';
import BookAppointment from './pages/consultation/BookAppointment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AutoConfirmService from './services/autoConfirmService';
import AutoConfirmNotification from './components/notifications/AutoConfirmNotification';
import RoleGuard from './components/guards/RoleGuard';
import DashboardRedirect from './components/common/DashboardRedirect';
import ConsultationStats from './pages/dashboard/Consultant/ConsultationStats';

// Lazy load Menstrual Cycle page
const MenstrualCyclePage = lazy(() => import('./pages/menstrual-cycle/MenstrualCyclePage'));
// Lazy load Feedback pages
const CustomerFeedbackPage = lazy(() => import('./pages/feedback/CustomerFeedbackPage'));
const ConsultantFeedbackDashboard = lazy(() => import('./pages/feedback/ConsultantFeedbackDashboard'));

// Lazy load Admin Dashboard
const AdminDashboard = lazy(() => import('./pages/dashboard/Admin/AdminDashboard'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const ConsultantLayout = lazy(() => import('./components/layout/ConsultantLayout'));
const AdminAppointmentManagement = lazy(() => import('./pages/dashboard/Admin/AdminAppointmentManagement'));

// Lazy load Staff Dashboard
const StaffDashboard = lazy(() => import('./pages/dashboard/Staff'));
const WeeklyScheduleManagement = lazy(() => import('./pages/dashboard/Staff/WeeklyScheduleManagement'));
const StaffAppointmentManagement = lazy(() => import('./pages/dashboard/Staff/components/StaffAppointmentManagement'));
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

      
      // Yêu cầu quyền notification
      AutoConfirmService.requestNotificationPermission();
      
      // Khởi động service
      AutoConfirmService.start();
    } else {
      // Dừng service khi user đăng xuất
      if (AutoConfirmService.isRunning()) {
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
            <Route path="/test-packages/*" element={<TestPackagesPage />} />
            <Route path="/test-packages/sti" element={<STITestPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/user/profile" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} redirectTo="/login" showError={true}>
                <UserProfilePage />
              </RoleGuard>
            } />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            {/* Generic dashboard route - redirect to role-specific dashboard */}
            <Route path="/dashboard" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} redirectTo="/login" showError={true}>
                <DashboardRedirect />
              </RoleGuard>
            } />
            
            {/* Profile route accessible to all authenticated users */}
            <Route path="/profile" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} redirectTo="/login" showError={true}>
                <UserProfilePage />
              </RoleGuard>
            } />
            

            <Route path="/blogs" element={<BlogListPage />} />
            <Route path="/blogs/create" element={<BlogFormPage />} />
            <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
            <Route path="/blogs/:blogId/edit" element={<BlogFormPage />} />


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
              <Route path="consultation-stats" element={<ConsultationStats />} />
              <Route path="feedback" element={<ConsultantFeedbackDashboard />} />
              <Route path="revenue" element={<div>Báo cáo doanh thu</div>} />
            </Route>

                        {/* Customer routes - Customer không có dashboard riêng, chỉ có direct access */}
            <Route path="/my-appointments" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <MyAppointments />
              </RoleGuard>
            } />
            <Route path="/consultants" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <ConsultantList />
              </RoleGuard>
            } />
            <Route path="/my-feedback" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <CustomerFeedbackPage />
              </RoleGuard>
            } />
            <Route path="/menstrual-cycle" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <MenstrualCyclePage />
              </RoleGuard>
            } />
              {/* STI Booking routes */}
              <Route path="/sti-booking/book" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <BookSTIPage />
              </RoleGuard>
            } />
            <Route path="/sti-booking/orders" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <OrdersPage />
              </RoleGuard>
            } />
            <Route path="/sti-booking/multiple" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <MultipleTestBooking />
              </RoleGuard>
            } />
            
            {/* STI Assessment routes */}
            <Route path="/sti-assessment" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <STIAssessmentForm />
              </RoleGuard>
            } />
            <Route path="/sti-assessment/history" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <STIAssessmentHistory />
              </RoleGuard>
            } />
            {/* Appointment routes - Bảo vệ bằng RoleGuard */}
            <Route path="/appointment" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} redirectTo="/login" showError={true}>
                <Navigate to="/my-appointments" replace />
              </RoleGuard>
            } />
            
            {/* Consultation routes - Bảo vệ bằng RoleGuard */}
            <Route path="/consultation/book" element={<Navigate to="/consultation/book-appointment" replace />} />
            <Route path="/consultation/book-appointment" element={
              <RoleGuard allowedRoles={['customer']} redirectTo="/login" showError={true}>
                <BookAppointment />
              </RoleGuard>
            } />
            
            {/* Admin Dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="overview" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="test-packages" element={<div>Quản lý gói xét nghiệm</div>} />
              <Route path="blogs" element={<div>Quản lý bài viết</div>} />
              <Route path="revenue" element={<div>Thống kê doanh thu</div>} />
              <Route path="appointments" element={<AdminAppointmentManagement />} />
              <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
            </Route>

            {/* Staff Dashboard routes */}
            <Route path="/staff/*" element={<StaffDashboard />}>
              <Route path="overview" element={<div>Trang tổng quan nhân viên</div>} />
              <Route path="appointments" element={<StaffAppointmentManagement />} />
              <Route path="weekly-schedule" element={<WeeklyScheduleManagement />} />
              <Route path="sti-orders" element={<OrdersPage />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="consultants" element={<div>Quản lý chuyên gia</div>} />
              <Route path="blogs" element={<div>Quản lý bài viết</div>} />
              <Route path="settings" element={<div>Cài đặt</div>} />
            </Route>

            {/* Catch deprecated customer dashboard routes and redirect */}
            <Route path="/dashboard/customer" element={<Navigate to="/my-appointments" replace />} />
            <Route path="/dashboard/customer/*" element={<Navigate to="/my-appointments" replace />} />
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