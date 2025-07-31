import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from "./components/Banner";
import BlogCard from '../../components/blog/BlogCard';
import STITestPackages from './components/STITestPackages';
import { homeService, consultantService } from '../../services';
import { Blog as BlogType } from '../../types/blog';
import { StiPackage, StiTest } from '@/types/sti';
import { Consultant } from '@/types/user';
import { STIPackageService } from '../../services/stiPackageService';
import { LoadingSpinner } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';
import { STITestService } from '../../services/stiTestService';
// Thêm import cho modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

// Memoized components để tránh re-render không cần thiết
const MemoizedBanner = React.memo(Banner);
const MemoizedBlogCard = React.memo(BlogCard);

// Add proper type definition for the component
// Sửa lại interface để khớp với dữ liệu thật từ API
interface STIPackageCardProps {
  packageData: {
    _id: string;
    sti_package_name: string;
    sti_package_code: string;
    price: number; // Thay vì sti_package_price
    description: string; // Thay vì sti_package_description
  };
}

// Sửa lại component STIPackageCard
const STIPackageCard: React.FC<STIPackageCardProps> = ({ packageData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Chỉ hiển thị tên và giá - luôn hiển thị */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-full">
            <h3 className="font-semibold text-gray-800 text-base mb-1">{packageData.sti_package_name}</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">{formatPrice(packageData.price)} VNĐ</p>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">Nhấp để xem chi tiết</p>
        </div>
      </div>

      {/* Modal chi tiết */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {packageData.sti_package_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Mã gói</p>
                <p className="font-semibold">{packageData.sti_package_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Giá</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(packageData.price)} VNĐ</p>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Chi tiết gói xét nghiệm:</h4>
              <p className="text-gray-600 leading-relaxed">{packageData.description}</p>
            </div>

            {/* Các xét nghiệm bao gồm */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Bao gồm:</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span>Test nhanh HIV combo Alere</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span>Test nhanh Giang mai</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <span>Test nhanh Lậu, Chlamydia</span>
                </li>
                {packageData.sti_package_code === 'STI-BASIC-02' && (
                  <>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>Test nhanh Viêm gan B</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>Test nhanh Viêm gan C</span>
                    </li>
                  </>
                )}
                {packageData.sti_package_code === 'STI-ADVANCE' && (
                  <>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>Test nhanh Viêm gan B, C</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>Test Herpes</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>RPR, Syphilis TP IgM/IgG</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span>Phương pháp kỹ thuật cao</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Thông tin bổ sung */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Thời gian</p>
                <p className="font-semibold">30-45 phút</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Hoạt động
                </span>
              </div>
            </div>

            {/* Call to action */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  window.location.href = '/sti-booking/book';
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đặt lịch xét nghiệm
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Sửa lại component IndividualTestCard
const IndividualTestCard: React.FC<{test: any}> = ({ test }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Chỉ hiển thị tên và giá - luôn hiển thị */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-full">
            <h3 className="font-semibold text-gray-800 text-base mb-1">{test.sti_test_name}</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">{new Intl.NumberFormat('vi-VN').format(test.price)} VNĐ</p>
          </div>
        </div>
        
        {/* Hover indicator */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">Nhấp để xem chi tiết</p>
        </div>
      </div>

      {/* Modal chi tiết */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {test.sti_test_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Mã xét nghiệm</p>
                <p className="font-semibold">{test.test_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Giá</p>
                <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('vi-VN').format(test.price)} VNĐ</p>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Mô tả:</h4>
              <p className="text-gray-600 leading-relaxed">{test.description}</p>
            </div>

            {/* Thông tin bổ sung */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Trạng thái</p>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Hoạt động
              </span>
            </div>

            {/* Call to action */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  window.location.href = '/sti-booking/book';
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đặt lịch xét nghiệm
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const HomePage = () => {
  const navigate = useNavigate();


  const [blogsData, setBlogsData] = useState<BlogType[]>([]);
  const [consultantsData, setConsultantsData] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Service cards config
  const serviceCards = [
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2" /><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" /><path d="M4 9h16" stroke="#2563eb" strokeWidth="2" /></svg>
        </span>
      ),
      title: 'Theo dõi chu kỳ',
      desc: 'Theo dõi chu kỳ kinh nguyệt và sinh sản với công cụ dự đoán thông minh và nhận thông báo quan trọng.',
      link: '/menstrual-cycle',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46243 6.46243 3 9.5 3C11.1566 3 12.7357 3.87972 13.5 5.15385C14.2643 3.87972 15.8434 3 17.5 3C20.5376 3 23 5.46243 23 8.5C23 13.5 15 21 15 21H12Z" stroke="#2563eb" strokeWidth="2" /></svg>
        </span>
      ),
      title: 'Tư vấn trực tuyến',
      desc: 'Đặt lịch tư vấn trực tuyến với các chuyên gia về sức khỏe sinh sản và nhận giải đáp cho mọi thắc mắc.',
      link: '/consultants',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2" /><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" /><path d="M4 9h16" stroke="#2563eb" strokeWidth="2" /></svg>
        </span>
      ),
      title: 'Xét nghiệm STIs',
      desc: 'Đặt lịch xét nghiệm STIs, theo dõi trạng thái và nhận kết quả an toàn, bảo mật trên hệ thống.',
      link: '/sti-booking/book',
    },
  ];

  // Optimized data fetching with separate API calls
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🏠 HomePage: Fetching data...');

      // Fetch data in parallel
      const [homepageData, consultantsData] = await Promise.all([
        homeService.getHomepageData(),
        consultantService.getAllConsultants(1, 10)
      ]);

      if (homepageData.success) {
        const { blogs } = homepageData.data;
        
        setBlogsData(blogs || []);

        console.log(' HomePage: Homepage data fetched successfully', {
          blogs: blogs?.length || 0
        });
      }

      if (consultantsData.data) {
        const consultants = consultantsData.data.consultants || [];
        setConsultantsData(consultants as unknown as Consultant[]);

        console.log(' HomePage: Consultants fetched successfully', {
          consultants: consultants.length
        });
      }

    } catch (error) {
      console.error(' HomePage: Error fetching data:', error);
      setError('Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fix the state type
  const [stiPackages, setStiPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Sửa lại fetchStiPackages để sử dụng dữ liệu từ homeService
  const fetchStiPackages = async () => {
    try {
      setLoadingPackages(true);
      console.log('🔄 Fetching STI packages from home data...');
      
      const response = await homeService.getHomepageData();
      console.log('📦 Home data response:', response);
      
      if (response.success && response.data && response.data.sti_packages) {
        const packages = response.data.sti_packages;
        console.log('✅ STI packages loaded:', packages.length);
        setStiPackages(packages);
      } else {
        console.log('❌ No STI packages found in home data');
        setStiPackages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching STI packages:', error);
      toast.error('Không thể tải danh sách gói xét nghiệm');
      setStiPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  // Thêm fetch cho individual tests
  const [individualTests, setIndividualTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Sửa lại fetchIndividualTests để sử dụng dữ liệu từ homeService
  const fetchIndividualTests = async () => {
    try {
      setLoadingTests(true);
      console.log('🔄 Fetching individual STI tests from home data...');
      
      const response = await homeService.getHomepageData();
      console.log('📦 Home data response for tests:', response);
      
      if (response.success && response.data && response.data.sti_tests) {
        const tests = response.data.sti_tests;
        console.log('✅ Individual STI tests loaded:', tests.length);
        setIndividualTests(tests);
      } else {
        console.log('❌ No individual STI tests found in home data');
        setIndividualTests([]);
      }
    } catch (error) {
      console.error('❌ Error fetching individual tests:', error);
      setIndividualTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  // Thêm lại tab navigation cho STI packages
  const [activeTab, setActiveTab] = useState<'packages' | 'individual'>('packages');

  // Sửa lại useEffect để chỉ gọi homeService một lần
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🏠 HomePage: Fetching all data...');
        
        const response = await homeService.getHomepageData();
        console.log('📦 Home data response:', response);
        
        if (response.success) {
          const { blogs, sti_packages, sti_tests, consultants } = response.data;
          
          // Set blogs data
          setBlogsData(blogs || []);
          
          // Set STI packages data
          if (sti_packages && Array.isArray(sti_packages)) {
            setStiPackages(sti_packages);
            console.log('✅ STI packages loaded:', sti_packages.length);
          }
          
          // Set individual tests data
          if (sti_tests && Array.isArray(sti_tests)) {
            setIndividualTests(sti_tests);
            console.log('✅ Individual tests loaded:', sti_tests.length);
          }
          
          // Set consultants data
          if (consultants && Array.isArray(consultants)) {
            setConsultantsData(consultants as unknown as Consultant[]);
            console.log('✅ Consultants loaded:', consultants.length);
          }
          
          console.log('✅ All data loaded successfully');
        }
      } catch (error) {
        console.error('❌ Error fetching all data:', error);
        setError('Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
        setLoadingPackages(false);
        setLoadingTests(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Memoized data processing
  const topConsultants = useMemo(() =>
    consultantsData.slice(0, 3), [consultantsData]
  );


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 text-sm">Đang tải trang chủ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MemoizedBanner />



      {/* Services Section - 3 dịch vụ cứng với links thật */}
      <section id="services-section" className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
          <h2 className="text-4xl font-bold text-center text-blue-700 mb-4">Dịch vụ của chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceCards.map((card) => (
              <div key={card.link} className="bg-white rounded-xl shadow border border-blue-100 p-8 flex flex-col items-center text-center transition hover:shadow-lg">
                {card.icon}
                <h3 className="text-xl font-bold text-blue-700 mb-2">{card.title}</h3>
                <p className="text-blue-700/80 mb-6">{card.desc}</p>
                <Link
                  to={card.link}
                  className="px-6 py-2 rounded border border-blue-400 text-blue-700 font-semibold hover:bg-blue-50 transition"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Consultants Section - Sử dụng data thật từ API */}
      {topConsultants.length > 0 && (
        <section className="py-8 bg-blue-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-blue-700 mb-4">
                Chuyên gia hàng đầu
              </h2>
              <p className="text-lg text-blue-700/80 max-w-2xl mx-auto">
                Đội ngũ chuyên gia giàu kinh nghiệm sẵn sàng hỗ trợ bạn
              </p>
              <Link
                to="/consultants"
                className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Xem tất cả chuyên gia
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topConsultants.map((consultant) => (
                <div key={consultant.consultant_id} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
                  <div className="w-20 h-20 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                    {consultant.avatar ? (
                      <img
                        src={consultant.avatar}
                        alt={consultant.full_name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{consultant.full_name}</h3>
                  <p className="text-blue-600 mb-2">{consultant.specialization}</p>
                  <p className="text-sm text-gray-600 mb-4">{consultant.experience_years} năm kinh nghiệm</p>
                  <Link
                    to={`/consultants`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Chọn chuyên gia
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* STI Packages Section with Tabs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Dịch vụ Xét nghiệm STI
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tham khảo thông tin các gói xét nghiệm và xét nghiệm đơn lẻ để lựa chọn dịch vụ phù hợp.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'packages'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Gói xét nghiệm
              </button>
              <button
                onClick={() => setActiveTab('individual')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Xét nghiệm đơn lẻ
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'packages' && (
            <>
              {loadingPackages ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : stiPackages.length > 0 ? (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                    {stiPackages.map((pkg) => (
                      <div key={pkg._id} className="w-80 flex-shrink-0">
                        <STIPackageCard packageData={pkg} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không có gói xét nghiệm nào hiện tại</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'individual' && (
            <>
              {loadingTests ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : individualTests.length > 0 ? (
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                    {individualTests.map((test) => (
                      <IndividualTestCard key={test._id} test={test} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không có xét nghiệm đơn lẻ nào hiện tại</p>
                </div>
              )}
            </>
          )}

          {/* Call to Action */}
          <div className="text-center">
            <button 
              onClick={() => window.location.href = '/sti-booking/book'}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
            >
              <span>Đặt lịch xét nghiệm ngay</span>
              <svg className="text-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Blog Section - Sử dụng data thật từ API */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-700 mb-4">Blog Sức Khỏe Sinh Sản</h2>
            <p className="text-lg text-blue-700/80 mb-8 max-w-2xl mx-auto">
              Khám phá những kiến thức hữu ích về sức khỏe sinh sản từ các chuyên gia
            </p>
            <Link
              to="/blogs"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Xem tất cả bài viết
            </Link>
          </div>

          {blogsData.length > 0 ? (
            <div className="relative">
               <div className="overflow-x-auto scrollbar-hide">
                 <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                   {blogsData.map((blog) => (
                     <div key={blog.blog_id} className="w-96 flex-shrink-0">
                       <div className="h-full flex">
                         <MemoizedBlogCard
                           blog={blog}
                           onClick={(blogId) => navigate(`/blogs/${blogId}`)}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
              
              {/* Scroll Indicators */}
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: Math.ceil(blogsData.length / 3) }).map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-gray-300"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có bài viết nào</h3>
              <p className="text-gray-600">Các bài viết sẽ xuất hiện ở đây khi có nội dung mới.</p>
            </div>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style>{`
           .scrollbar-hide {
             -ms-overflow-style: none;
             scrollbar-width: none;
           }
           .scrollbar-hide::-webkit-scrollbar {
             display: none;
           }
           
           /* Smooth scroll for horizontal container */
           .overflow-x-auto {
             scroll-behavior: smooth;
           }
           
           /* Blog card consistent height */
           .scrollbar-hide .w-96 > div > div {
             height: auto;
             min-height: 420px;
             display: flex;
             flex-direction: column;
           }
           
           /* Ensure BlogCard takes full height */
           .scrollbar-hide .w-96 > div > div > article {
             height: 100%;
             display: flex;
             flex-direction: column;
           }
           
           .scrollbar-hide .w-96 > div > div > div {
             flex: 1;
             display: flex;
             flex-direction: column;
           }
           
           /* Title display */
           .scrollbar-hide .w-96 h3 {
             line-height: 1.4;
             height: auto;
             overflow: hidden;
             display: -webkit-box;
             -webkit-line-clamp: 2;
             -webkit-box-orient: vertical;
             margin-bottom: 1rem;
           }
           
           /* Content area */
           .scrollbar-hide .w-96 p {
             flex: 1;
             overflow: hidden;
             display: -webkit-box;
             -webkit-line-clamp: 4;
             -webkit-box-orient: vertical;
           }
           
           /* Custom scrollbar for desktop */
           @media (min-width: 768px) {
             .scrollbar-hide {
               scrollbar-width: thin;
               scrollbar-color: #cbd5e0 #f7fafc;
             }
             .scrollbar-hide::-webkit-scrollbar {
               display: block;
               height: 8px;
             }
             .scrollbar-hide::-webkit-scrollbar-track {
               background: #f7fafc;
               border-radius: 4px;
             }
             .scrollbar-hide::-webkit-scrollbar-thumb {
               background: #cbd5e0;
               border-radius: 4px;
             }
             .scrollbar-hide::-webkit-scrollbar-thumb:hover {
               background: #a0aec0;
             }
           }
         `}</style>
      </section>

      {/* Custom Scrollbar Styles for STI Packages */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth scroll for horizontal container */
        .overflow-x-auto {
          scroll-behavior: smooth;
        }
        
        /* Card consistent width and height */
        .w-80 {
          width: 320px;
          min-width: 320px;
        }
        
        /* Custom scrollbar for desktop */
        @media (min-width: 768px) {
          .scrollbar-hide {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: block;
            height: 8px;
          }
          .scrollbar-hide::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 4px;
          }
          .scrollbar-hide::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .scrollbar-hide::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;