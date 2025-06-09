import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Banner from "./components/Banner";
import About from "./components/About";
import Services from "./components/Services";
import Blog from "./components/Blog";
import api from '../../services/api';
import { blogService } from '../../services/blogService';
import { StiTest } from '../../types/sti';
import { Blog as BlogType } from '../../types/blog';
import BloodDropIcon from '../../assets/icons/BloodDropIcon';
import UrineDropIcon from '../../assets/icons/UrineDropIcon';
import SwabIcon from '../../assets/icons/SwabIcon';
import TestServiceImage from '../../assets/images/test-service-illustration.png';

const HomePage = () => {
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
          setBlogs(blogResponse.data.blogs.filter((blog: BlogType) => blog.status).slice(0, 2));
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

  // Hàm chọn icon SVG theo loại xét nghiệm
  const getTestIcon = (type: string) => {
    switch (type) {
      case 'blood':
        return <BloodDropIcon />;
      case 'urine':
        return <UrineDropIcon />;
      case 'swab':
        return <SwabIcon />;
      default:
        return <BloodDropIcon />;
    }
  };

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
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Chăm sóc sức khỏe của bạn với GenCare
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Dịch vụ xét nghiệm y tế chất lượng cao, nhanh chóng và chính xác
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" href="/test-packages">
                Xem các gói xét nghiệm
              </Button>
              <Button variant="outline" size="lg" href="/about">
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - 3 dịch vụ cứng */}
      <section className="py-20 bg-white">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Bài viết mới nhất</h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-4">
              {blogs.map((blog, index) => (
                <Card key={index} className="overflow-hidden min-w-[300px]">
                  <img
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{blog.title}</CardTitle>
                    <CardDescription>{blog.content.substring(0, 100)}...</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="link">Đọc thêm</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
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