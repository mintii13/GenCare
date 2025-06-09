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
import { Toaster } from 'react-hot-toast';

const UserProfilePage = lazy(() => import('./pages/auth/user-profile'));

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <Layout onLoginClick={() => setShowLogin(true)}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000, // Hiển thị trong 3 giây
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Suspense fallback={<div>Đang tải...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
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
        </Routes>
      </Suspense>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </Layout>
  );
};

export default App;