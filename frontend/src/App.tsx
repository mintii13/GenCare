import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route } from "react-router-dom";
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
import { ToastProvider } from './components/ui/ToastProvider';
import ConsultantDashboard from './pages/dashboard/Consultant';
import ConsultantBlogList from './pages/dashboard/Consultant/components/ConsultantBlogList';
import ConsultantSchedule from './pages/dashboard/Consultant/ConsultantSchedule';
import WeeklyScheduleManager from './pages/dashboard/Consultant/WeeklyScheduleManager';
import WeeklyCalendarView from './pages/dashboard/Consultant/WeeklyCalendarView';
import AppointmentManagement from './pages/dashboard/Consultant/AppointmentManagement';
import CustomerDashboard from './pages/dashboard/Customer';
import MyAppointments from './pages/dashboard/Customer/MyAppointments';
import ConsultantList from './pages/dashboard/Customer/ConsultantList';
import BookAppointment from './pages/consultation/BookAppointment';
import ApiTest from './components/common/ApiTest';


const UserProfilePage = lazy(() => import('./pages/auth/user-profile'));

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <ToastProvider defaultPosition="top-center">
      <Layout onLoginClick={() => setShowLogin(true)}>
      <Suspense fallback={<div>Đang tải...</div>}>
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
          <Route path="/consultant/*" element={<ConsultantDashboard />}>
            <Route path="schedule" element={<AppointmentManagement />} />
            <Route path="clients" element={<div>Khách hàng</div>} />
            <Route path="online" element={<div>Tư vấn trực tuyến</div>} />
            <Route path="records" element={<div>Hồ sơ tư vấn</div>} />
            <Route path="qa" element={<div>Q&A / Câu hỏi</div>} />
            <Route path="calendar-view" element={<WeeklyCalendarView />} />
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
          <Route path="/consultation/book" element={<BookAppointment />} />
        </Routes>
      </Suspense>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </Layout>
    </ToastProvider>
  );
};

export default App;