import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import StiTestList from './StiTestList';
import StiTestForm from './StiTestForm';
import StiTestDetail from './StiTestDetail';
import SelectStiTestPage from './SelectStiTestPage';
import PageTransition from '../../components/PageTransition';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StiTest } from '../../types/sti';
import { FileText, ArrowRight, Grid } from 'lucide-react';
import { STIPackageService } from '../../services/stiPackageService';
import { LoadingSpinner } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

// Xóa import STIServiceCard cũ và tạo component mới trực tiếp trong file này
const STIServiceCard: React.FC<{packageData: any, onSelect: (id: string) => void}> = ({ packageData, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div
      className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(packageData.id)}
    >
      {/* Card Content - Chỉ hiển thị thông tin cơ bản */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Grid className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{packageData.name}</h3>
            <p className="text-xs text-gray-500">{packageData.code}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">{formatPrice(packageData.price)} VNĐ</p>
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Hoạt động
          </span>
        </div>
      </div>

      {/* Mô tả - Chỉ hiển thị khi hover */}
      {isHovered && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="font-medium text-gray-800 mb-2 text-sm">Chi tiết gói xét nghiệm:</h4>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{packageData.description}</p>
          
          {/* Các xét nghiệm bao gồm */}
          <div className="mb-3">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Bao gồm:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Test nhanh HIV combo Alere</li>
              <li>• Test nhanh Giang mai</li>
              <li>• Test nhanh Lậu, Chlamydia</li>
              {packageData.code === 'STI-BASIC-02' && (
                <>
                  <li>• Test nhanh Viêm gan B</li>
                  <li>• Test nhanh Viêm gan C</li>
                </>
              )}
              {packageData.code === 'STI-ADVANCE' && (
                <>
                  <li>• Test nhanh Viêm gan B, C</li>
                  <li>• Test Herpes</li>
                  <li>• RPR, Syphilis TP IgM/IgG</li>
                  <li>• Phương pháp kỹ thuật cao</li>
                </>
              )}
            </ul>
          </div>

          {/* Call to action */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Thời gian: 30-45 phút
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <span>Chọn gói</span>
              <ArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Hover indicator - chỉ hiển thị khi không hover */}
      {!isHovered && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">Di chuột để xem chi tiết</p>
        </div>
      )}
    </div>
  );
};

const TestPackages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTests, setSelectedTests] = useState<string[]>([]); // Lưu _id các xét nghiệm đã chọn
  // Xác định tab đang active dựa vào pathname
  const [activeTab, setActiveTab] = useState<'sti' | 'package'>('package');

  const handleTabChange = (value: string) => {
    if (value === 'package') navigate('/test-packages');
    else if (value === 'sti') navigate('/test-packages/select');
  };

  const handleSelectPackage = (pkg: any) => {
    alert('Bạn đã chọn gói: ' + pkg.sti_package_name);
  };

  const handleToggleTestSelect = (test: StiTest) => {
    setSelectedTests((prev) =>
      prev.includes(test._id)
        ? prev.filter((id) => id !== test._id)
        : [...prev, test._id]
    );
  };

  const stiPackages = [
    {
      id: '1',
      name: 'Gói xét nghiệm STIs CƠ BẢN 1',
      code: 'STI-BASIC-01',
      description: 'Gói test nhanh HIV combo Alere, test nhanh Giang mai, Lậu, Chlamydia',
      price: 700000,
      isActive: true
    },
    {
      id: '2',
      name: 'Gói xét nghiệm STIs CƠ BẢN 2',
      code: 'STI-BASIC-02',
      description: 'Gói test nhanh HIV combo Alere, test nhanh Giang mai, test nhanh Viêm gan B, test nhanh Viêm gan C, Lậu, Chlamydia',
      price: 900000,
      isActive: true
    },
    {
      id: '3',
      name: 'Gói xét nghiệm STIs NÂNG CAO',
      code: 'STI-ADVANCE',
      description: 'Gói test nhanh HIV combo Alere, test nhanh Viêm gan B, test nhanh Viêm gan C, Herpes, RPR, Syphilis TP IgM/IgG, Lậu, Chlamydia - Gói toàn diện với hầu hết các STIs có thể xét nghiệm được và bằng phương pháp kỹ thuật cao',
      price: 1700000,
      isActive: true
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    // Navigate to booking page with selected package
    window.location.href = `/sti-booking/book?package=${packageId}`;
  };

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = async () => {
    // Implementation here
  };

  return (
    <PageTransition>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
          <TabsTrigger value="package" className="text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-blue-50">
            Gói xét nghiệm
          </TabsTrigger>
          <TabsTrigger value="sti" className="text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-blue-50">
            Xét nghiệm STI
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {activeTab === 'package' && <StiTestList mode="package" onSelectPackage={handleSelectPackage} />}
      
      {activeTab === 'sti' && (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Dịch vụ Xét nghiệm STI
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Tham khảo thông tin các gói xét nghiệm và xét nghiệm đơn lẻ để lựa chọn dịch vụ phù hợp.
              </p>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {stiPackages.map((pkg) => (
                <STIServiceCard
                  key={pkg.id}
                  packageData={pkg}
                  onSelect={handlePackageSelect}
                />
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button 
                onClick={() => window.location.href = '/sti-booking/book'}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <span>Đặt lịch xét nghiệm ngay</span>
                <ArrowRight className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
      
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