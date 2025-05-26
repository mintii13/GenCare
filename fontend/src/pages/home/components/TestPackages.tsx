import React from "react";

interface TestPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  tests: string[];
  duration: string;
  recommendedFor: string[];
  benefits: string[];
}

interface TestPackagesProps {
  packages: TestPackage[];
}

const TestPackages: React.FC<TestPackagesProps> = ({ packages }) => {
  return (
    <section id="test-packages" className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center text-primary-700 mb-8">Các Gói Xét Nghiệm</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-primary-700 mb-4">{pkg.title}</h3>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              <div className="text-3xl font-bold text-accent-600 mb-4">
                {pkg.price.toLocaleString('vi-VN')} VNĐ
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-primary-600 mb-2">Thời gian xét nghiệm:</h4>
                <p>{pkg.duration}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-primary-600 mb-2">Bao gồm các xét nghiệm:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {pkg.tests.map((test, index) => (
                    <li key={index} className="text-gray-600">{test}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-primary-600 mb-2">Phù hợp với:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {pkg.recommendedFor.map((item, index) => (
                    <li key={index} className="text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-primary-600 mb-2">Lợi ích:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {pkg.benefits.map((benefit, index) => (
                    <li key={index} className="text-gray-600">{benefit}</li>
                  ))}
                </ul>
              </div>
              <button className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-6 rounded-lg transition">
                Đặt lịch ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestPackages; 