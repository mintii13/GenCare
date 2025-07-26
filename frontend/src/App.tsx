import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";

// Core pages - Load immediately
import Layout from './components/layout/Layout';
import LoginModal from "@/components/auth/LoginModal";
import OAuthSuccess from "./pages/OAuthSuccess";
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AutoConfirmService from './services/autoConfirmService';
import AutoConfirmNotification from './components/notifications/AutoConfirmNotification';
import RoleGuard from './components/guards/RoleGuard';
import DashboardRedirect from './components/common/DashboardRedirect';
import LoginRedirect from './components/common/LoginRedirect';
import RegisterRedirect from './components/common/RegisterRedirect';

// Lazy load all major pages for better performance
const HomePage = lazy(() => import('./pages/home'));
const TestPackagesPage = lazy(() => import('./pages/test-packages'));
const STITestPage = lazy(() => import('./pages/test-packages/sti'));
const AboutUs = lazy(() => import('./pages/about/AboutUs'));

// STI Booking imports - Keep lazy
const BookSTIPage = lazy(() => import('./pages/sti-booking/BookSTIPage'));
const OrdersPage = lazy(() => import('./pages/sti-booking/OrdersPage'));

// STI Assessment imports - Keep lazy
const STIAssessmentForm = lazy(() => import('./pages/sti-assessment/STIAssessmentForm'));
const STIAssessmentHistory = lazy(() => import('./pages/sti-assessment/STIAssessmentHistory'));

// Blog imports - Lazy load for better performance
const BlogListPage = lazy(() => import('./pages/blog/BlogListPage'));
const BlogDetailPage = lazy(() => import('./pages/blog/BlogDetailPage'));
const BlogFormPage = lazy(() => import('./pages/blog/BlogFormPage'));

// Dashboard imports - Keep lazy
const ConsultantBlogList = lazy(() => import('./pages/dashboard/Consultant/components/ConsultantBlogList'));
const WeeklyScheduleManager = lazy(() => import('./pages/dashboard/Consultant/WeeklyScheduleManager'));
const AppointmentManagement = lazy(() => import('./pages/dashboard/Consultant/AppointmentManagement'));
const MyAppointments = lazy(() => import('./pages/dashboard/Customer/MyAppointments'));
const ConsultantList = lazy(() => import('./pages/dashboard/Customer/ConsultantList'));
const BookAppointment = lazy(() => import('./pages/consultation/BookAppointment'));
const ConsultationStats = lazy(() => import('./pages/dashboard/Consultant/ConsultationStats'));

// Feature-specific lazy loads
const MenstrualCyclePage = lazy(() => import('./pages/menstrual-cycle/MenstrualCyclePage'));
const CustomerFeedbackPage = lazy(() => import('./pages/feedback/CustomerFeedbackPage'));
const ConsultantFeedbackDashboard = lazy(() => import('./pages/feedback/ConsultantFeedbackDashboard'));

// Admin Dashboard - Lazy load
const AdminDashboard = lazy(() => import('./pages/dashboard/Admin/AdminDashboard'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const ConsultantLayout = lazy(() => import('./components/layout/ConsultantLayout'));
const CustomerLayout = lazy(() => import('./components/layout/CustomerLayout'));
const AdminAppointmentManagement = lazy(() => import('./pages/dashboard/Admin/AdminAppointmentManagement'));
const AdminAuditLog = lazy(() => import('./pages/dashboard/Admin/AdminAuditLog'));

// Staff Dashboard - Lazy load
const StaffDashboard = lazy(() => import('./pages/dashboard/Staff'));
const WeeklyScheduleManagement = lazy(() => import('./pages/dashboard/Staff/WeeklyScheduleManagement'));
const StaffAppointmentManagement = lazy(() => import('./pages/dashboard/Staff/components/StaffAppointmentManagement'));
const StaffBlogManagement = lazy(() => import('./pages/dashboard/Staff/StaffBlogManagement'));
const AdminBlogManagement = lazy(() => import('./pages/dashboard/Admin/AdminBlogManagement'));
const UserManagement = lazy(() => import('./pages/dashboard/Admin/UserManagement'));
const AdminSTIManagement = lazy(() => import('./pages/dashboard/Admin/STIManagement'));
const UserProfilePage = lazy(() => import('./pages/auth/user-profile'));

// Add new lazy import for Staff STI Management components
const StiOrdersManagement = lazy(() => import('./pages/dashboard/Staff/StiOrdersManagement'));
const StiResultsManagement = lazy(() => import('./pages/dashboard/Staff/StiResultsManagement'));
const TestScheduleManagement = lazy(() => import('./pages/dashboard/Staff/TestScheduleManagement'));
const STIManagement = lazy(() => import('./pages/dashboard/Staff/STIManagement'));
const TestResultEntryPage = lazy(() => import('./pages/dashboard/Staff/components/TestResultEntryPage'));
const PaymentSuccessPage = lazy(() => import('./pages/dashboard/Staff/components/PaymentSuccessPage')); // <-- THÊM DÒNG NÀY


const MySTIResults = lazy(() => import('./pages/dashboard/Customer/MySTIResults'));
const ConsultantStiOrdersPage = lazy(() => import('./pages/dashboard/Consultant/ConsultantStiOrdersPage'));


const AppContent: React.FC = () => {
  const { isAuthenticated, user, isModalOpen, closeModal, modalMode } = useAuth();

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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 text-sm">Đang tải trang...</p>
            </div>
          </div>
        }>
        <Routes>
          {/* Dashboard Routes - No Layout wrapper to avoid Footer overlap */}
          <Route path="/consultant/*" element={<ConsultantLayout />}>
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<AppointmentManagement />} />
            <Route path="clients" element={<div className="p-4">Khách hàng</div>} />
            <Route path="online" element={<div className="p-4">Tư vấn trực tuyến</div>} />
            <Route path="records" element={<div className="p-4">Hồ sơ tư vấn</div>} />
            <Route path="qa" element={<div className="p-4">Q&A / Câu hỏi</div>} />
            <Route path="weekly-schedule" element={<WeeklyScheduleManager />} />
            <Route path="special-schedule" element={<div className="p-4">Điều chỉnh lịch đặc biệt</div>} />
            <Route path="unavailable" element={<div className="p-4">Ngày nghỉ</div>} />
            <Route path="blogs" element={<ConsultantBlogList />} />
            <Route path="sti-results" element={<StiResultsManagement />} />
            <Route path="documents" element={<div className="p-4">Tài liệu chuyên môn</div>} />
            <Route path="training" element={<div className="p-4">Đào tạo & Cập nhật</div>} />
            <Route path="consultation-stats" element={<ConsultationStats />} />
            <Route path="feedback" element={<ConsultantFeedbackDashboard />} />
            <Route path="revenue" element={<div className="p-4">Báo cáo doanh thu</div>} />
            <Route path="sti-orders" element={<ConsultantStiOrdersPage />} />
          </Route>

          {/* Customer Dashboard Routes */}
          <Route 
            path="/dashboard/customer/*" 
            element={
              <RoleGuard allowedRoles={['customer']}>
                <CustomerLayout />
              </RoleGuard>
            }
          >
            <Route index element={<Navigate to="my-appointments" replace />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="my-sti-results" element={<MySTIResults />} />
            <Route path="consultants" element={<ConsultantList />} />
            <Route path="menstrual-cycle" element={<MenstrualCyclePage />} />
            <Route path="feedback" element={<CustomerFeedbackPage />} />
            <Route path="sti-assessment-history" element={<STIAssessmentHistory />} />
            <Route path="settings" element={<div className="p-4">Trang Cài đặt</div>} /> 
          </Route>

          {/* Admin Dashboard routes */}
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="test-packages" element={<div className="p-4">Quản lý gói xét nghiệm</div>} />
            <Route path="blogs" element={<AdminBlogManagement />} />
            <Route path="revenue" element={<div className="p-4">Thống kê doanh thu</div>} />
            <Route path="appointments" element={<AdminAppointmentManagement />} />
            <Route path="sti-management" element={<AdminSTIManagement />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
            <Route path="settings" element={<div className="p-4">Cài đặt hệ thống</div>} />
          </Route>

          {/* Staff Dashboard routes */}
          <Route path="/staff/*" element={<StaffDashboard />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<div className="p-4">Trang tổng quan nhân viên</div>} />
            <Route path="appointments" element={<StaffAppointmentManagement />} />
            <Route path="weekly-schedule" element={<WeeklyScheduleManagement />} />
            <Route path="sti-management" element={<STIManagement />} />
            <Route path="sti-orders" element={<StiOrdersManagement />} />
            <Route path="sti-results" element={<StiResultsManagement />} />
            <Route path="test-schedules" element={<TestScheduleManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="consultants" element={<div className="p-4">Quản lý chuyên gia</div>} />
            <Route path="blogs" element={<StaffBlogManagement />} />
            <Route path="settings" element={<div className="p-4">Cài đặt</div>} />
          </Route>

          {/* Public Routes with Layout wrapper */}
          <Route path="/*" element={
            <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/menstrual-cycle" element={
              <RoleGuard allowedRoles={['customer']}>
                <MenstrualCyclePage />
              </RoleGuard>
            } />
            <Route path="/test-packages/*" element={<TestPackagesPage />} />
            <Route path="/test-packages/sti" element={<STITestPage />} />
            <Route path="/register" element={<RegisterRedirect />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<LoginRedirect />} />
            
            <Route path="/user-profile" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']}>
                <UserProfilePage />
              </RoleGuard>
            } />
            <Route path="/profile" element={<Navigate to="/user-profile" replace />} />
            <Route path="/user/profile" element={<Navigate to="/user-profile" replace />} />
            
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            <Route path="/dashboard" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']}>
                <DashboardRedirect />
              </RoleGuard>
            } />

            <Route path="/blogs" element={<BlogListPage />} />
            <Route path="/blogs/create" element={<BlogFormPage />} />
            <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
            <Route path="/blogs/:blogId/edit" element={<BlogFormPage />} />

                {/* Legacy Redirects - Common old URLs */}
            <Route path="/my-appointments" element={<Navigate to="/dashboard/customer/my-appointments" replace />} />
            <Route path="/consultants" element={<Navigate to="/dashboard/customer/consultants" replace />} />
            <Route path="/my-sti-results" element={<Navigate to="/dashboard/customer/my-sti-results" replace />} />
                
                {/* Customer Legacy Routes - Old /customer/* URLs */}
            <Route path="/customer" element={<Navigate to="/dashboard/customer" replace />} />
                <Route path="/customer/appointments" element={<Navigate to="/dashboard/customer/my-appointments" replace />} />
                <Route path="/customer/my-appointments" element={<Navigate to="/dashboard/customer/my-appointments" replace />} />
                <Route path="/customer/consultants" element={<Navigate to="/dashboard/customer/consultants" replace />} />
                <Route path="/customer/sti-results" element={<Navigate to="/dashboard/customer/my-sti-results" replace />} />
                <Route path="/customer/my-sti-results" element={<Navigate to="/dashboard/customer/my-sti-results" replace />} />
                <Route path="/customer/profile" element={<Navigate to="/dashboard/customer/profile" replace />} />
                <Route path="/customer/dashboard" element={<Navigate to="/dashboard/customer" replace />} />
            <Route path="/customer/*" element={<Navigate to="/dashboard/customer" replace />} />
            
            {/* STI Booking routes */}
            <Route path="/sti-booking/book" element={
              <RoleGuard allowedRoles={['customer']}>
                <BookSTIPage />
              </RoleGuard>
            } />
            <Route path="/sti-booking/orders" element={
              <RoleGuard allowedRoles={['customer']}>
                <OrdersPage />
              </RoleGuard>
            } />
                <Route path="/sti-booking/multiple" element={<Navigate to="/sti-booking/book" replace />} />
                <Route path="/sti-booking/consultation" element={<Navigate to="/sti-booking/book" replace />} />
            
            {/* STI Assessment routes */}
            <Route path="/sti-assessment" element={
              <RoleGuard allowedRoles={['customer']}>
                <STIAssessmentForm />
              </RoleGuard>
            } />
            <Route path="/sti-assessment/history" element={
              <RoleGuard allowedRoles={['customer']}>
                <STIAssessmentHistory />
              </RoleGuard>
            } />
                
            <Route path="/appointment" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']}>
                <Navigate to="/my-appointments" replace />
              </RoleGuard>
            } />
            
            <Route path="/consultation/book" element={<Navigate to="/consultation/book-appointment" replace />} />
            <Route path="/consultation/book-appointment" element={
              <RoleGuard allowedRoles={['customer']}>
                <BookAppointment />
              </RoleGuard>
            } />
          </Routes>
        <LoginModal isOpen={isModalOpen} onClose={closeModal} initialMode={modalMode} />
      </Layout>
          } />
        </Routes>
      </Suspense>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;