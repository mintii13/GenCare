import React from 'react';
import { Card } from '../../../components/ui/card';
import menstralCycleImage from '../../../assets/images/menstral-cycle.png';

interface CycleProgressCircleProps {
  currentDay: number;
  cycleLength: number;
  cyclePhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  isPeriodDay: boolean;
  periodLength?: number; // Thêm độ dài kỳ kinh thực tế
  ovulationDay?: number; // Thêm ngày rụng trứng thực tế
}

const CycleProgressCircle: React.FC<CycleProgressCircleProps> = ({
  currentDay,
  cycleLength,
  cyclePhase,
  isPeriodDay,
  periodLength = 5, // Mặc định 5 ngày nếu không có dữ liệu
  ovulationDay = Math.floor(cycleLength / 2) // Mặc định giữa chu kỳ nếu không có dữ liệu
}) => {

  // Vòng tròn tiến trình đơn giản với 4 giai đoạn cố định
  const phases = [
    { name: 'Hành kinh', start: 1, end: 5, color: '#ef4444' },
    { name: 'Giai đoạn nang', start: 6, end: 13, color: '#f97316' },
    { name: 'Rụng trứng', start: 14, end: 15, color: '#0ea5e9' },
    { name: 'Giai đoạn hoàng thể', start: 16, end: cycleLength, color: '#22c55e' }
  ];

  // Tính toán góc cho từng giai đoạn
  const getPhaseAngle = (start: number, end: number) => {
    // Các giai đoạn cũng tính theo tiến trình % tương tự
    // Ngày 1 ở vị trí 6 giờ (270 độ)
    const startAngle = 270 + (start / cycleLength) * 360;
    const endAngle = 270 + (end / cycleLength) * 360;
    return { startAngle, endAngle, sweepAngle: endAngle - startAngle };
  };

  return (
    <Card className="p-6 bg-yellow-50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chu kỳ kinh nguyệt</h3>
        <div className="text-2xl font-bold text-purple-600 mb-2">
          {isPeriodDay ? `${currentDay} ngày` : `${currentDay} ngày`}
        </div>
        <p className="text-sm text-gray-600">
          {isPeriodDay ? (
            `Ngày ${currentDay} trong kỳ hành kinh - Hành kinh`
          ) : (
            `Ngày ${currentDay} / ${cycleLength} - ${
              cyclePhase === 'menstrual' ? 'Hành kinh' : 
              cyclePhase === 'follicular' ? 'Giai đoạn nang' :
              cyclePhase === 'ovulation' ? 'Rụng trứng' : 'Giai đoạn hoàng thể'
            }`
          )}
        </p>
      </div>

      <div className="relative w-96 h-96 mx-auto">
        {/* Hình ảnh chu kỳ kinh nguyệt */}
        <div className="relative w-full h-full">
          <img 
            src={menstralCycleImage} 
            alt="Chu kỳ kinh nguyệt" 
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('Error loading image:', e);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('Image loaded successfully')}
          />
          
          {/* Thông tin ở giữa */}
          {/* <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full w-28 h-28 flex items-center justify-center shadow-lg border-2 border-purple-200">
              <div>
                <div className="text-2xl font-bold text-gray-800">{currentDay}</div>
                <div className="text-xs text-gray-500">ngày</div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
      
      {/* Ghi chú về hình ảnh */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-sm text-yellow-800 text-center">
          <strong>Lưu ý:</strong> Hình ảnh chỉ mang tính chất tham khảo, không thay thế cho tư vấn y tế chuyên nghiệp.
        </div>
      </div>

      {/* Chú thích các giai đoạn */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {phases.map((phase, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-sm text-gray-700">{phase.name}</span>
          </div>
        ))}
      </div>

                {/* Thông tin bổ sung */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Thông tin hôm nay:</div>
              <div>• Giai đoạn: {cyclePhase === 'menstrual' ? 'Hành kinh' : 
                cyclePhase === 'follicular' ? 'Giai đoạn nang' :
                cyclePhase === 'ovulation' ? 'Rụng trứng' : 'Giai đoạn hoàng thể'}</div>
              <div>• Ngày thứ {currentDay} trong chu kỳ</div>
              {isPeriodDay && <div>• Đang trong thời kỳ hành kinh</div>}
            </div>
          </div>
    </Card>
  );
};

export default CycleProgressCircle; 