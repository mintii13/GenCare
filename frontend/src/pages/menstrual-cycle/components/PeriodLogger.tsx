import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { FaTimes, FaCalendarAlt, FaPlus, FaMinus, FaLightbulb } from 'react-icons/fa';
import { menstrualCycleService } from '../../../services/menstrualCycleService';
import { toast } from 'react-hot-toast';

interface PeriodLoggerProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PeriodLogger: React.FC<PeriodLoggerProps> = ({ onClose, onSuccess }) => {
  const [periodDates, setPeriodDates] = useState<string[]>([
    new Date().toISOString().split('T')[0] // Today's date by default
  ]);
  const [loading, setLoading] = useState(false);
  const addDate = () => {
    setPeriodDates([...periodDates, '']);
  };

  const removeDate = (index: number) => {
    if (periodDates.length > 1) {
      setPeriodDates(periodDates.filter((_, i) => i !== index));
    }
  };

  const updateDate = (index: number, date: string) => {
    const updated = [...periodDates];
    updated[index] = date;
    setPeriodDates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const validDates = periodDates.filter(date => date !== '');
    if (validDates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày');
      return;
    }

    // Check for future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const hasFutureDate = validDates.some(date => new Date(date) > today);
    
    if (hasFutureDate) {
      toast.error('Không thể chọn ngày trong tương lai');
      return;
    }

    try {
      setLoading(true);
      
      // Chuẩn bị dữ liệu gửi lên server - chỉ gửi mảng ngày
      const response = await menstrualCycleService.processCycle(validDates);

      if (response.success) {
        toast.success('Đã ghi nhận thành công');
        onSuccess();
      } else {
        console.error('API error response:', response);
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Network error:', error);
      
      // Hiển thị lỗi chi tiết từ server nếu có
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Hiển thị lỗi validation từ Joi
        const errorMessages = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join(', ')
          : error.response.data.errors;
        toast.error(`Dữ liệu không hợp lệ: ${errorMessages}`);
      } else if (error.message) {
        toast.error(`Lỗi: ${error.message}`);
      } else {
        toast.error('Lỗi khi lưu dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const suggestConsecutiveDates = (startDate: string, days: number) => {
    if (!startDate) return;
    
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setPeriodDates(dates);
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FaCalendarAlt className="h-5 w-5 text-pink-600" />
                Ghi Nhận Kinh Nguyệt
              </CardTitle>
              <CardDescription>
                Chọn các ngày bạn có kinh trong chu kì này
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-1 h-auto"
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Period Dates */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Ngày có kinh</Label>
                
                {/* Quick suggestions */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Gợi ý nhanh:</p>
                  <div className="flex flex-wrap gap-2">
                    {[3, 4, 5, 6, 7].map(days => (
                      <Button
                        key={days}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => suggestConsecutiveDates(
                          periodDates[0] || new Date().toISOString().split('T')[0], 
                          days
                        )}
                        className="text-xs"
                      >
                        {days} ngày
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date inputs */}
                <div className="space-y-3">
                  {periodDates.map((date, index) => (
                    <div key={index} className="flex items-center gap-2 relative">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => updateDate(index, e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                          required={index === 0}
                        />
                      </div>
                      {periodDates.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDate(index)}
                          className="p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          <FaMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDate}
                    className="w-full flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <FaPlus className="h-4 w-4" />
                    Thêm ngày
                  </Button>
                </div>
              </div>



              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <FaLightbulb className="text-blue-600" />
                  Mẹo:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ghi nhận đầy đủ tất cả ngày có kinh để dự đoán chính xác</li>
                  <li>• Hệ thống sẽ tự động tính toán và dự đoán chu kì tiếp theo</li>
                  <li>• Bạn có thể xóa ngày đã lưu nhầm trong lịch</li>
                </ul>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </div>
                  ) : (
                    'Lưu'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PeriodLogger; 