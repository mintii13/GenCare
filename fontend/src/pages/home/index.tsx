import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Banner from "./components/Banner";
import About from "./components/About";
import Services from "./components/Services";
import Blog from "./components/Blog";

const HomePage = () => {
  const services = [
    {
      title: 'Xét nghiệm máu',
      description: 'Kiểm tra sức khỏe tổng quát thông qua xét nghiệm máu',
      icon: '🩸',
    },
    {
      title: 'Xét nghiệm nước tiểu',
      description: 'Phân tích nước tiểu để phát hiện các vấn đề về thận',
      icon: '🧪',
    },
    {
      title: 'Xét nghiệm sinh hóa',
      description: 'Kiểm tra các chỉ số sinh hóa trong cơ thể',
      icon: '🔬',
    },
  ];

  const blogs = [
    {
      title: 'Tầm quan trọng của việc khám sức khỏe định kỳ',
      description: 'Bài viết về lợi ích của việc khám sức khỏe thường xuyên',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    },
    {
      title: 'Các chỉ số xét nghiệm cơ bản cần biết',
      description: 'Hướng dẫn đọc kết quả xét nghiệm cơ bản',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80',
    },
  ];

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

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Dịch vụ của chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost" href="/test-packages">
                    Tìm hiểu thêm
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Bài viết mới nhất</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map((blog, index) => (
              <Card key={index} className="overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <CardTitle>{blog.title}</CardTitle>
                  <CardDescription>{blog.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="link">Đọc thêm</Button>
                </CardFooter>
              </Card>
            ))}
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