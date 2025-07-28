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
import OrdersManagement from './pages/dashboard/Staff/components/OrdersManagement';
import StiResultsManagementConsultant from './pages/dashboard/Consultant/components/StiResultManagementPage';

// Lazy load all major pages for better performance
const HomePage = lazy(() => import('./pages/home'));
const TestPackagesPage = lazy(() => import('./pages/test-packages'));
const STITestPage = lazy(() => import('./pages/test-packages/sti'));
const Register = lazy(() => import('./pages/auth/register'));
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
// const StiResultsManagement = lazy(() => import('./pages/dashboard/Staff/StiResultsManagement'));
const TestScheduleManagement = lazy(() => import('./pages/dashboard/Staff/TestScheduleManagement'));
const TestResultEntryPage = lazy(() => import('./pages/dashboard/Staff/components/TestResultEntryPage'));
const PaymentSuccessPage = lazy(() => import('./pages/dashboard/Staff/components/PaymentSuccessPage')); // <-- THÊM DÒNG NÀY


const MySTIResults = lazy(() => import('./pages/dashboard/Customer/MySTIResults'));
const ConsultantStiOrdersPage = lazy(() => import('./pages/dashboard/Consultant/ConsultantStiOrdersPage'));

interface AppContentProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({ showLogin, setShowLogin }) => {
  const { isAuthenticated, user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshTriggerResult, setRefreshTriggerResult] = useState(0);


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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 text-sm">Đang tải trang...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test-packages/*" element={<TestPackagesPage />} />
            <Route path="/test-packages/sti" element={<STITestPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<LoginRedirect onShowLogin={() => setShowLogin(true)} />} />
            <Route path="/user/profile" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} showError={true}>
                <UserProfilePage />
              </RoleGuard>
            } />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            {/* Generic dashboard route - redirect to role-specific dashboard */}
            <Route path="/dashboard" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} showError={true}>
                <DashboardRedirect />
              </RoleGuard>
            } />
            
            {/* Profile route accessible to all authenticated users */}
            <Route path="/profile" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} showError={true}>
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
              <Route path="sti-orders" element={<ConsultantStiOrdersPage />} />
              <Route path="sti-results" element={<StiResultsManagementConsultant refreshTrigger={refreshTriggerResult} />} />
            </Route>

            {/* Customer routes - Customer không có dashboard riêng, chỉ có direct access */}
            <Route path="/my-appointments" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <MyAppointments />
              </RoleGuard>
            } />
            <Route path="/consultants" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <ConsultantList />
              </RoleGuard>
            } />
            <Route path="/my-feedback" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <CustomerFeedbackPage />
              </RoleGuard>
            } />
            <Route path="/menstrual-cycle" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <MenstrualCyclePage />
              </RoleGuard>
            } />
            <Route path="/my-sti-results" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <MySTIResults />
              </RoleGuard>
            } />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
              {/* STI Booking routes */}
              <Route path="/sti-booking/book" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <BookSTIPage />
              </RoleGuard>
            } />
            <Route path="/sti-booking/orders" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <OrdersPage />
              </RoleGuard>
            } />
            <Route path="/sti-booking/multiple" element={
              <Navigate to="/sti-booking/book" replace />
            } />
            <Route path="/sti-booking/consultation" element={
              <Navigate to="/sti-booking/book" replace />
            } />
            
            {/* STI Assessment routes */}
            <Route path="/sti-assessment" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <STIAssessmentForm />
              </RoleGuard>
            } />
            <Route path="/sti-assessment/history" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <STIAssessmentHistory />
              </RoleGuard>
            } />
            {/* Appointment routes - Bảo vệ bằng RoleGuard */}
            <Route path="/appointment" element={
              <RoleGuard allowedRoles={['customer', 'consultant', 'staff', 'admin']} showError={true}>
                <Navigate to="/my-appointments" replace />
              </RoleGuard>
            } />
            
            {/* Consultation routes - Bảo vệ bằng RoleGuard */}
            <Route path="/consultation/book" element={<Navigate to="/consultation/book-appointment" replace />} />
            <Route path="/consultation/book-appointment" element={
              <RoleGuard allowedRoles={['customer']} showError={true}>
                <BookAppointment />
              </RoleGuard>
            } />
            
            {/* Admin Dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="overview" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="test-packages" element={<div>Quản lý gói xét nghiệm</div>} />
              <Route path="blogs" element={<AdminBlogManagement />} />
              <Route path="revenue" element={<div>Thống kê doanh thu</div>} />
              <Route path="appointments" element={<AdminAppointmentManagement />} />
              <Route path="sti-management" element={<AdminSTIManagement />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
            </Route>

            {/* Staff Dashboard routes */}
            <Route path="/staff/*" element={<StaffDashboard />}>
              <Route path="overview" element={<div>Trang tổng quan nhân viên</div>} />
              <Route path="appointments" element={<StaffAppointmentManagement />} />
              <Route path="weekly-schedule" element={<WeeklyScheduleManagement />} />
              <Route path="sti-management" element={<OrdersManagement refreshTrigger={refreshTrigger}/>} />
              <Route path="sti-orders" element={<StiOrdersManagement />} />
              {/* <Route path="sti-results" element={<StiResultsManagement />} /> */}
              <Route path="orders/:orderId/result" element={<TestResultEntryPage />} />
              <Route path="test-schedules" element={<TestScheduleManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="consultants" element={<div>Quản lý chuyên gia</div>} />
              <Route path="blogs" element={<StaffBlogManagement />} />
              <Route path="settings" element={<div>Cài đặt</div>} />
            </Route>

            {/* Catch deprecated customer dashboard routes and redirect */}
            <Route path="/dashboard/customer" element={<Navigate to="/my-appointments" replace />} />
            <Route path="/dashboard/customer/*" element={<Navigate to="/my-appointments" replace />} />
            <Route path="/dashboard/customer/my-appointments" element={<MyAppointments />} />
            <Route path="/dashboard/customer/my-sti-results" element={<MySTIResults />} />
            <Route path="/dashboard/customer/consultants" element={<ConsultantList />} />
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