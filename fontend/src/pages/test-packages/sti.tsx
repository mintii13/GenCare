import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface TestOption {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  recommended: boolean;
}

const STITestPage = () => {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const testOptions: TestOption[] = [
    {
      id: 'hiv',
      title: 'Xét nghiệm HIV',
      description: 'Xét nghiệm phát hiện virus HIV trong máu',
      price: '300.000đ',
      duration: '30 phút',
      recommended: true,
    },
    {
      id: 'chlamydia',
      title: 'Xét nghiệm Chlamydia',
      description: 'Xét nghiệm phát hiện vi khuẩn Chlamydia trachomatis',
      price: '400.000đ',
      duration: '45 phút',
      recommended: true,
    },
    {
      id: 'gonorrhea',
      title: 'Xét nghiệm Gonorrhea',
      description: 'Xét nghiệm phát hiện vi khuẩn Neisseria gonorrhoeae',
      price: '400.000đ',
      duration: '45 phút',
      recommended: true,
    },
    {
      id: 'syphilis',
      title: 'Xét nghiệm Syphilis',
      description: 'Xét nghiệm phát hiện xoắn khuẩn Treponema pallidum',
      price: '350.000đ',
      duration: '40 phút',
      recommended: true,
    },
    {
      id: 'hepatitis-b',
      title: 'Xét nghiệm Viêm gan B',
      description: 'Xét nghiệm phát hiện virus viêm gan B',
      price: '300.000đ',
      duration: '30 phút',
      recommended: false,
    },
    {
      id: 'hepatitis-c',
      title: 'Xét nghiệm Viêm gan C',
      description: 'Xét nghiệm phát hiện virus viêm gan C',
      price: '300.000đ',
      duration: '30 phút',
      recommended: false,
    },
  ];

  const handleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const calculateTotal = () => {
    return selectedTests.reduce((total, testId) => {
      const test = testOptions.find(t => t.id === testId);
      return total + parseInt(test?.price.replace(/[^\d]/g, '') || '0');
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Xét nghiệm STI</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chọn các xét nghiệm bạn muốn thực hiện. Chúng tôi cam kết bảo mật thông tin và kết quả xét nghiệm của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testOptions.map((test) => (
            <Card 
              key={test.id}
              className={`cursor-pointer transition-all ${
                selectedTests.includes(test.id)
                  ? 'border-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTestSelection(test.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => {}}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Thời gian: {test.duration}</span>
                  <span className="font-semibold text-primary">{test.price}</span>
                </div>
                {test.recommended && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                    Khuyến nghị
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Tổng cộng</h2>
              <p className="text-2xl font-bold text-primary">
                {calculateTotal().toLocaleString()}đ
              </p>
              <p className="text-sm text-gray-500">
                Đã chọn {selectedTests.length} xét nghiệm
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedTests([])}
                disabled={selectedTests.length === 0}
              >
                Xóa tất cả
              </Button>
              <Button
                href="/booking"
                disabled={selectedTests.length === 0}
              >
                Đặt lịch ngay
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-primary/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lưu ý quan trọng</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Kết quả xét nghiệm sẽ được trả trong vòng 24-48 giờ
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Thông tin và kết quả xét nghiệm được bảo mật tuyệt đối
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Bạn sẽ được tư vấn chi tiết về kết quả xét nghiệm
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default STITestPage; 