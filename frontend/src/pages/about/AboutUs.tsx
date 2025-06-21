import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Về Chúng Tôi
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Tìm hiểu thêm về sứ mệnh và đội ngũ đằng sau thành công của chúng tôi
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Sứ Mệnh Của Chúng Tôi</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Chúng tôi cam kết cung cấp những giải pháp đổi mới giúp doanh nghiệp và cá nhân
            đạt được mục tiêu của họ. Sự cam kết về chất lượng và sự hài lòng của khách hàng
            là động lực thúc đẩy mọi hoạt động của chúng tôi.
          </p>
        </div>

        {/* Team Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Nguyễn Văn A</h3>
              <p className="text-gray-600">Giám đốc điều hành & Người sáng lập</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Trần Thị B</h3>
              <p className="text-gray-600">Giám đốc công nghệ</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Lê Văn C</h3>
              <p className="text-gray-600">Trưởng nhóm phát triển</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Giá Trị Cốt Lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Đổi Mới</h3>
              <p className="text-gray-600">Không ngừng vượt qua giới hạn để tạo ra những giải pháp tốt hơn</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hợp Tác</h3>
              <p className="text-gray-600">Cùng nhau làm việc để đạt được mục tiêu chung</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chính Trực</h3>
              <p className="text-gray-600">Duy trì tiêu chuẩn cao nhất về sự trung thực và đạo đức</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;