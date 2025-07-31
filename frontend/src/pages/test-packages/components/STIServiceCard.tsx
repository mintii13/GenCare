import React, { useState } from 'react';
import { FaTh, FaArrowRight } from 'react-icons/fa'; // Fix: FaGrid doesn't exist, use FaTh

interface STIPackage {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface STIServiceCardProps {
  packageData: STIPackage; // Fix: rename from 'package' to 'packageData'
  onSelect: (packageId: string) => void;
}

const STIServiceCard: React.FC<STIServiceCardProps> = ({ packageData, onSelect }) => {
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
            <FaTh className="text-blue-600 text-lg" />
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

      {/* Mô tả - Chỉ hiển thị khi hover với CSS mạnh hơn */}
      <div 
        className={`transition-all duration-300 ${
          isHovered 
            ? 'max-h-96 opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}
        style={{ 
          maxHeight: isHovered ? '24rem' : '0',
          paddingTop: isHovered ? '1rem' : '0',
          paddingBottom: isHovered ? '1rem' : '0'
        }}
      >
        <div className="border-t border-gray-100 pt-4">
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
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover indicator - chỉ hiển thị khi không hover */}
      {!isHovered && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">Di chuột để xem chi tiết</p>
        </div>
      )}
    </div>
  );
};

export default STIServiceCard; 