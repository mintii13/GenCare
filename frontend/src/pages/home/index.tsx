import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Banner from "./components/Banner";
import About from "./components/About";
import Services from "./components/Services";
import Blog from "./components/Blog";
import BlogCard from '../../components/blog/BlogCard';
import api from '../../services/api';
import { blogService } from '../../services/blogService';
import { StiTest } from '../../types/sti';
import { Blog as BlogType } from '../../types/blog';


const HomePage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<StiTest[]>([]);
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stiResponse, blogResponse] = await Promise.all([
          api.get('/sti/getAllStiTest'),
          blogService.getBlogs()
        ]);
        if (stiResponse.data.success && Array.isArray(stiResponse.data.stitest)) {
          setServices(stiResponse.data.stitest.filter((test: StiTest) => test.isActive));
        } else {
          setServices([]);
        }
        if (blogResponse.success && Array.isArray(blogResponse.data.blogs)) {
          // Load tất cả blog thay vì chỉ 2 bài
          setBlogs(blogResponse.data.blogs.filter((blog: BlogType) => blog.status));
        } else {
          setBlogs([]);
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-play chuyển cặp dịch vụ mỗi 4s
  useEffect(() => {
    if (services.length === 0) return;
    const timer = setInterval(() => {
      setCurrentService((prev) => (prev + 2) % services.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [services]);



  const serviceCards = [
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2"/><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><path d="M4 9h16" stroke="#2563eb" strokeWidth="2"/></svg>
        </span>
      ),
      title: 'Theo dõi chu kỳ',
      desc: 'Theo dõi chu kỳ kinh nguyệt và sinh sản với công cụ dự đoán thông minh và nhận thông báo quan trọng.',
      link: '/services/cycle',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.46243 6.46243 3 9.5 3C11.1566 3 12.7357 3.87972 13.5 5.15385C14.2643 3.87972 15.8434 3 17.5 3C20.5376 3 23 5.46243 23 8.5C23 13.5 15 21 15 21H12Z" stroke="#2563eb" strokeWidth="2"/></svg>
        </span>
      ),
      title: 'Tư vấn trực tuyến',
      desc: 'Đặt lịch tư vấn trực tuyến với các chuyên gia về sức khỏe sinh sản và nhận giải đáp cho mọi thắc mắc.',
      link: '/services/consult',
    },
    {
      icon: (
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" stroke="#2563eb" strokeWidth="2"/><path d="M8 3v4M16 3v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><path d="M4 9h16" stroke="#2563eb" strokeWidth="2"/></svg>
        </span>
      ),
      title: 'Xét nghiệm STIs',
      desc: 'Đặt lịch xét nghiệm STIs, theo dõi trạng thái và nhận kết quả an toàn, bảo mật trên hệ thống.',
      link: '/test-packages',
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen">
      <Banner />

      {/* Services Section - 3 dịch vụ cứng */}
      <section id="services-section" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-blue-700 mb-4">Dịch vụ của chúng tôi</h2>
          <p className="text-lg text-center text-blue-700/80 mb-12 max-w-2xl mx-auto">
            GenCare cung cấp các dịch vụ chăm sóc sức khỏe sinh sản toàn diện, từ tư vấn đến xét nghiệm.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceCards.map((card, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow border border-blue-100 p-8 flex flex-col items-center text-center transition hover:shadow-lg">
                {card.icon}
                <h3 className="text-xl font-bold text-blue-700 mb-2">{card.title}</h3>
                <p className="text-blue-700/80 mb-6">{card.desc}</p>
                {card.link ? (
                  <Link to={card.link} className="px-6 py-2 rounded border border-blue-400 text-blue-700 font-semibold hover:bg-blue-50 transition">
                    Tìm hiểu thêm
                  </Link>
                ) : (
                  <span className="px-6 py-2 rounded border border-blue-200 text-blue-400 font-semibold opacity-60 cursor-not-allowed">
                    Tìm hiểu thêm
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
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
              Xem tất cả
            </Link>
          </div>
          
          {blogs.length > 0 ? (
            <div className="relative">
               <div className="overflow-x-auto scrollbar-hide">
                 <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                   {blogs.map((blog) => (
                     <div key={blog.blog_id} className="w-96 flex-shrink-0">
                       <div className="h-full">
                         <BlogCard
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
                {Array.from({ length: Math.ceil(blogs.length / 3) }).map((_, index) => (
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
          <Button size="lg" href="/test-packages">
            Đặt lịch ngay
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;