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
const UserProfilePage = lazy(() => import('./pages/auth/user-profile'));

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <Layout onLoginClick={() => setShowLogin(true)}>
      <Suspense fallback={<div>Đang tải...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test-packages" element={<TestPackagesPage />} />
          <Route path="/test-packages/sti" element={<STITestPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/user/profile" element={<UserProfilePage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
        </Routes>
      </Suspense>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </Layout>
  );
};

export default App;