import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  FaHeart, 
  FaCalendarAlt, 
  FaChartBar, 
  FaBell, 
  FaPills, 
  FaCheckCircle,
  FaInfoCircle,
  FaLightbulb,
  FaShieldAlt,
  FaUserMd,
  FaExclamationTriangle,
  FaStar,
  FaLock,
  FaMobileAlt
} from 'react-icons/fa';

interface FirstTimeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirstTimeGuideModal: React.FC<FirstTimeGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaHeart className="text-3xl text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Chào mừng bạn đến với tính năng theo dõi chu kỳ kinh nguyệt!
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Hướng dẫn sử dụng và lưu ý quan trọng về sức khỏe sinh sản
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Giới thiệu */}
          <Card className="border-2 border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaInfoCircle className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tại sao nên theo dõi chu kỳ kinh nguyệt?
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Hiểu rõ cơ thể và chu kỳ sinh học của bạn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Dự đoán ngày kinh nguyệt và ngày rụng trứng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Phát hiện sớm các bất thường về chu kỳ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>Hỗ trợ kế hoạch hóa gia đình</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hướng dẫn sử dụng */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaCalendarAlt className="text-xl text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Hướng dẫn sử dụng
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Ghi nhận chu kỳ</h4>
                      <p className="text-sm text-gray-600">
                        Nhấn nút "Ghi nhận" để đánh dấu ngày bắt đầu và kết thúc kinh nguyệt
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Theo dõi hàng ngày</h4>
                      <p className="text-sm text-gray-600">
                        Sử dụng lịch để ghi nhận các triệu chứng và tâm trạng
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Xem thống kê</h4>
                      <p className="text-sm text-gray-600">
                        Phân tích xu hướng và độ đều đặn của chu kỳ
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nhận dự đoán</h4>
                      <p className="text-sm text-gray-600">
                        Hệ thống sẽ dự đoán ngày kinh nguyệt và ngày rụng trứng
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nhận gợi ý</h4>
                      <p className="text-sm text-gray-600">
                        Nhận lời khuyên về sức khỏe và kế hoạch hóa gia đình
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">6</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Thiết lập nhắc nhở</h4>
                      <p className="text-sm text-gray-600">
                        Nhận thông báo về ngày kinh nguyệt và thuốc tránh thai
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lưu ý về thuốc tránh thai */}
          <Card className="border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaPills className="text-xl text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    <FaLightbulb className="inline mr-2 text-orange-500" />
                    Lưu ý quan trọng về thuốc tránh thai
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaShieldAlt className="text-orange-500" />
                        Sử dụng đúng cách
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Uống thuốc đúng giờ mỗi ngày</li>
                        <li>• Không bỏ quên liều nào</li>
                        <li>• Tham khảo ý kiến bác sĩ trước khi sử dụng</li>
                        <li>• Theo dõi tác dụng phụ</li>
                        <li>• Thiết lập nhắc nhở uống thuốc</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaBell className="text-orange-500" />
                        Nhắc nhở thuốc tránh thai
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Hệ thống sẽ nhắc nhở bạn uống thuốc tránh thai đúng giờ. 
                        Điều này rất quan trọng để đảm bảo hiệu quả tránh thai.
                      </p>
                                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium flex items-start gap-2">
                        <FaExclamationTriangle className="text-orange-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Lưu ý:</strong> Nếu quên uống thuốc, hãy uống ngay khi nhớ ra 
                        và sử dụng biện pháp bảo vệ bổ sung trong 7 ngày tiếp theo.</span>
                      </p>
                    </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaUserMd className="text-orange-500" />
                        Tư vấn y tế
                      </h4>
                      <p className="text-sm text-gray-700">
                        Nếu bạn đang sử dụng thuốc tránh thai, hãy tham khảo ý kiến bác sĩ 
                        để được tư vấn về cách sử dụng an toàn và hiệu quả. 
                        Hệ thống này chỉ hỗ trợ theo dõi, không thay thế tư vấn y tế chuyên môn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Các tính năng chính */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaChartBar className="text-blue-500" />
                Các tính năng chính
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCalendarAlt className="text-xl text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Theo Dõi</h4>
                  <p className="text-sm text-gray-600">
                    Ghi nhận và theo dõi chu kỳ kinh nguyệt hàng ngày
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaChartBar className="text-xl text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dự Đoán</h4>
                  <p className="text-sm text-gray-600">
                    Dự đoán ngày kinh nguyệt và ngày rụng trứng
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaBell className="text-xl text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Nhắc Nhở</h4>
                  <p className="text-sm text-gray-600">
                    Nhắc nhở uống thuốc và các sự kiện quan trọng
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-gray-500 mt-1 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <strong>Lưu ý:</strong> Tính năng này chỉ mang tính chất hỗ trợ và tham khảo. 
                  Để có thông tin chính xác về sức khỏe sinh sản, vui lòng tham khảo ý kiến 
                  của bác sĩ chuyên khoa. GenCare không chịu trách nhiệm về các quyết định 
                  y tế dựa trên thông tin từ hệ thống này.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-6">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8 py-3"
          >
            Tôi đã hiểu, bắt đầu sử dụng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstTimeGuideModal; 