import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import StiTestList from './StiTestList';
import StiTestForm from './StiTestForm';
import StiTestDetail from './StiTestDetail';
import SelectStiTestPage from './SelectStiTestPage';
import PageTransition from '../../components/PageTransition';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

const TestPackages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Xác định tab đang active dựa vào pathname
  const activeTab = location.pathname.endsWith('/select') ? 'sti' : 'package';

  const handleTabChange = (value: string) => {
    if (value === 'package') navigate('/test-packages');
    else if (value === 'sti') navigate('/test-packages/select');
  };

  const handleSelectPackage = (pkg: any) => {
    alert('Bạn đã chọn gói: ' + pkg.sti_package_name);
  };

  const handleSelectTest = (test: any) => {
    alert('Bạn đã chọn xét nghiệm: ' + test.sti_test_name);
  };

  return (
    <PageTransition>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="package" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            Gói xét nghiệm
          </TabsTrigger>
          <TabsTrigger value="sti" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            Xét nghiệm STI
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {activeTab === 'package' && <StiTestList mode="package" onSelectPackage={handleSelectPackage} />}
      {activeTab === 'sti' && <StiTestList mode="single" onSelectTest={handleSelectTest} />}
      <Routes>
        <Route path="create" element={<StiTestForm />} />
        <Route path="edit/:id" element={<StiTestForm />} />
        <Route path=":id" element={<StiTestDetail />} />
        <Route path="select" element={<SelectStiTestPage />} />
      </Routes>
    </PageTransition>
  );
};

export default TestPackages;