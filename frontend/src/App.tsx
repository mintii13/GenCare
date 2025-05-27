import React, { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home";
import TestPackagesPage from "./pages/test-packages";
import STITestPage from "./pages/test-packages/sti";
import Register from './pages/auth/register';
import AboutUs from './pages/about/AboutUs';
import Layout from './components/layout/Layout';
import LoginModal from "@/components/auth/LoginModal";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <Layout onLoginClick={() => setShowLogin(true)}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test-packages" element={<TestPackagesPage />} />
        <Route path="/test-packages/sti" element={<STITestPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </Layout>
  );
};

export default App;