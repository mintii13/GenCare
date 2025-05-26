import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const TestPackagesPage = () => {
  const packages = [
    {
      title: 'Gói xét nghiệm cơ bản',
      description: 'Kiểm tra sức khỏe tổng quát với các chỉ số cơ bản',
      price: '500.000đ',
      features: [
        'Xét nghiệm máu cơ bản',
        'Xét nghiệm nước tiểu',
        'Đo huyết áp',
        'Tư vấn kết quả',
      ],
    },
    {
      title: 'Gói xét nghiệm nâng cao',
      description: 'Kiểm tra sức khỏe toàn diện với các chỉ số chi tiết',
      price: '1.200.000đ',
      features: [
        'Xét nghiệm máu toàn diện',
        'Xét nghiệm nước tiểu',
        'Xét nghiệm sinh hóa',
        'Đo huyết áp',
        'Đo đường huyết',
        'Tư vấn kết quả',
      ],
    },
    {
      title: 'Gói xét nghiệm chuyên sâu',
      description: 'Kiểm tra sức khỏe toàn diện với các chỉ số chuyên sâu',
      price: '2.500.000đ',
      features: [
        'Xét nghiệm máu toàn diện',
        'Xét nghiệm nước tiểu',
        'Xét nghiệm sinh hóa',
        'Xét nghiệm hormone',
        'Xét nghiệm miễn dịch',
        'Đo huyết áp',
        'Đo đường huyết',
        'Tư vấn kết quả',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Các gói xét nghiệm</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chọn gói xét nghiệm phù hợp với nhu cầu của bạn. Chúng tôi cam kết mang đến dịch vụ chất lượng cao với giá cả hợp lý.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{pkg.title}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="text-2xl font-bold text-primary mt-4">
                  {pkg.price}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-primary mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" href="/booking">
                  Đặt lịch ngay
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Bạn cần tư vấn thêm?</h2>
          <p className="text-gray-600 mb-6">
            Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn
          </p>
          <Button variant="outline" href="/contact">
            Liên hệ tư vấn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestPackagesPage; 