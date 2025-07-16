import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from "./components/Banner";
import BlogCard from '../../components/blog/BlogCard';
import { homeService, consultantService } from '../../services';
import { Blog as BlogType } from '../../types/blog';
import { StiPackage, StiTest } from '@/types/sti';
import { Consultant } from '@/types/user';

// Memoized components để tránh re-render không cần thiết
const MemoizedBanner = React.memo(Banner);
const MemoizedBlogCard = React.memo(BlogCard);

const HomePage = () => {
  const navigate = useNavigate();

  const [packagesData, setPackagesData] = useState<StiPackage[]>([]);
  const [testsData, setTestsData] = useState<StiTest[]>([]);
  const [blogsData, setBlogsData] = useState<BlogType[]>([]);
  const [consultantsData, setConsultantsData] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTab, setTestTab] = useState<'packages' | 'single'>('packages');
  // Service cards config
  const serviceCards = [
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2"/><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><path d="M4 9h16" stroke="#2563eb" strokeWidth="2"/></svg>
        </span>
      ),
      title: 'Theo dõi chu kỳ',
      desc: 'Theo dõi chu kỳ kinh nguyệt và sinh sản với công cụ dự đoán thông minh và nhận thông báo quan trọng.',
      link: '/menstrual-cycle',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46243 6.46243 3 9.5 3C11.1566 3 12.7357 3.87972 13.5 5.15385C14.2643 3.87972 15.8434 3 17.5 3C20.5376 3 23 5.46243 23 8.5C23 13.5 15 21 15 21H12Z" stroke="#2563eb" strokeWidth="2"/></svg>
        </span>
      ),
      title: 'Tư vấn trực tuyến',
      desc: 'Đặt lịch tư vấn trực tuyến với các chuyên gia về sức khỏe sinh sản và nhận giải đáp cho mọi thắc mắc.',
      link: '/consultation/book-appointment',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2"/><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><path d="M4 9h16" stroke="#2563eb" strokeWidth="2"/></svg>
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
        const { sti_packages, sti_tests, blogs } = homepageData.data;
        
        setPackagesData(sti_packages || []);
        setTestsData(sti_tests || []);
        setBlogsData(blogs || []);
        
        console.log('✅ HomePage: Homepage data fetched successfully', {
          packages: sti_packages?.length || 0,
          blogs: blogs?.length || 0
        });
      }
      
      if (consultantsData.data) {
        const consultants = consultantsData.data.consultants || [];
        setConsultantsData(consultants as unknown as Consultant[]);
        
        console.log('✅ HomePage: Consultants fetched successfully', {
          consultants: consultants.length
        });
      }
      
    } catch (error) {
      console.error('❌ HomePage: Error fetching data:', error);
      setError('Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Memoized data processing
  const topConsultants = useMemo(() => 
    consultantsData.slice(0, 3), [consultantsData]
  );

  const activePackages = useMemo(() => 
    packagesData.filter((p) => p.is_active !== false),
    [packagesData]
  );

  const activeTests = useMemo(() => 
    testsData.filter((t) => t.is_active !== false),
    [testsData]
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
    <div className="min-h-screen">
      <MemoizedBanner />

  

      {/* Services Section - 3 dịch vụ cứng với links thật */}
      <section id="services-section" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-blue-700 mb-4">Dịch vụ của chúng tôi</h2>
          <p className="text-lg text-center text-blue-700/80 mb-12 max-w-2xl mx-auto">
            GenCare cung cấp các dịch vụ chăm sóc sức khỏe sinh sản toàn diện, từ tư vấn đến xét nghiệm.
          </p>
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
        <section className="py-20 bg-blue-50">
          <div className="container mx-auto px-4">
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
                    to="/consultants"
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

      {/* STI Test Packages / Single Tests Section */}
      {(
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-blue-700 mb-4">Dịch vụ xét nghiệm</h2>
              <p className="text-lg text-blue-700/80 max-w-2xl mx-auto mb-8">
                Các gói xét nghiệm và các dịch vụ xét nghiệm được cung cấp bởi chúng tôi
              </p>
              {/* Tabs */}
              <div className="inline-flex bg-blue-100 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setTestTab('packages')}
                  className={`px-6 py-2 font-medium transition-colors ${testTab==='packages' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-200'}`}
                >
                  Gói xét nghiệm
                </button>
                <button
                  onClick={() => setTestTab('single')}
                  className={`px-6 py-2 font-medium transition-colors ${testTab==='single' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-200'}`}
                >
                  Xét nghiệm lẻ
                </button>
              </div>
            </div>

            {/* Content - Logic for centering or scrolling */}
            <div className="relative">
              <div
                className={
                  (testTab === 'packages' ? activePackages.length : activeTests.length) > 4
                    ? 'overflow-x-auto scrollbar-hide'
                    : 'flex justify-center'
                }
              >
                <div
                  className={`flex flex-wrap gap-6 pb-4 ${
                    (testTab === 'packages' ? activePackages.length : activeTests.length) <= 4
                      ? 'justify-center'
                      : ''
                  }`}
                  style={
                    (testTab === 'packages' ? activePackages.length : activeTests.length) > 4
                      ? { width: 'max-content' }
                      : {}
                  }
                >
                  {(testTab === 'packages' ? activePackages : activeTests).map((service: StiPackage | StiTest) => (
                    <div key={service._id} className="w-80 h-50 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition flex flex-col">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={'sti_package_name' in service ? service.sti_package_name : service.sti_test_name}>
                        {'sti_package_name' in service ? service.sti_package_name : service.sti_test_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                      <div className="flex-grow" />
                      <div className="flex justify-between items-center mb-4 mt-auto">
                        <span className="text-2xl font-bold text-blue-600">
                          {service.price?.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-sm text-gray-500">
                          {testTab==='packages' ? 'Gói' : ('sti_test_type' in service && service.sti_test_type) || 'Test'}
                        </span>
                      </div>
                  
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/sti-assessment"
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Đánh giá sàng lọc STi
                </Link>
                <Link
                  to="/sti-booking/book"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Đặt lịch xét nghiệm
                </Link>
              </div>
            </div>
          </div>  
        </section>
      )}

      {/* Blog Section - Sử dụng data thật từ API */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
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
                       <div className="h-full">
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
           
           /* Blog card consistent height and title display */
           .scrollbar-hide .w-96 > div > div {
             height: 420px;
             display: flex;
             flex-direction: column;
           }
           
           .scrollbar-hide .w-96 > div > div > div {
             flex: 1;
             display: flex;
             flex-direction: column;
           }
           
           /* Override title line-clamp to show full title */
           .scrollbar-hide .w-96 h3 {
             line-height: 1.4;
             height: auto;
             overflow: visible;
             display: block;
             -webkit-line-clamp: unset;
             -webkit-box-orient: unset;
             margin-bottom: 1rem;
           }
           
           /* Content area should take remaining space */
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

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng chăm sóc sức khỏe của bạn?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Đặt lịch xét nghiệm ngay hôm nay để nhận được tư vấn miễn phí từ đội ngũ chuyên gia của chúng tôi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/test-packages/sti"
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Xem gói xét nghiệm
            </Link>
            <Link
              to="/sti-booking/book"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Đặt lịch xét nghiệm
            </Link>
            <Link
              to="/consultation/book-appointment"
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Tư vấn trực tuyến
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
};

export default HomePage;