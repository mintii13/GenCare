import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/auth/login';
// import các page khác nếu có

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/auth/login" element={<Layout><LoginPage /></Layout>} />
        {/* Thêm các route khác nếu cần */}
      </Routes>
    </Router>
  );
}

export default App; 