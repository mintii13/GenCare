import React from 'react';
import { Card } from '../../../components/ui/card';

interface CycleProgressCircleProps {
  currentDay: number;
  cycleLength: number;
  cyclePhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  isPeriodDay: boolean;
  pillSchedules?: any[];
  onTakePill?: (scheduleId: string) => Promise<void>;
  onShowPillSettings?: () => void;
}

const CycleProgressCircle: React.FC<CycleProgressCircleProps> = ({
  currentDay,
  cycleLength,
  cyclePhase,
  isPeriodDay,
  pillSchedules = [],
  onTakePill,
  onShowPillSettings
}) => {

  
  // Định nghĩa các giai đoạn chu kỳ
  const phases = [
    { name: 'Hành kinh', start: 1, end: 5, color: '#ef4444' },
    { name: 'Giai đoạn nang', start: 6, end: 13, color: '#f97316' },
    { name: 'Rụng trứng', start: 14, end: 15, color: '#0ea5e9' },
    { name: 'Giai đoạn hoàng thể', start: 16, end: cycleLength, color: '#22c55e' }
  ];

  // Pill tracking logic
  const getTodayPillInfo = () => {
    if (!pillSchedules || !pillSchedules.length) return null;
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return pillSchedules.find(schedule => {
      const scheduleDate = new Date(schedule.pill_start_date);
      const scheduleString = scheduleDate.toISOString().split('T')[0];
      return scheduleString === todayString;
    });
  };

  const todayPill = getTodayPillInfo();

  // Tính toán góc cho từng giai đoạn
  const getPhaseAngle = (start: number, end: number) => {
    // Các giai đoạn cũng tính theo tiến trình % tương tự
    // Ngày 1 ở vị trí 6 giờ (270 độ)
    const startAngle = 270 + (start / cycleLength) * 360;
    const endAngle = 270 + (end / cycleLength) * 360;
    return { startAngle, endAngle, sweepAngle: endAngle - startAngle };
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-green-50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chu kỳ kinh nguyệt</h3>
        <p className="text-sm text-gray-600">
          Ngày {currentDay} / {cycleLength} - {cyclePhase === 'menstrual' ? 'Hành kinh' : 
            cyclePhase === 'follicular' ? 'Giai đoạn nang' :
            cyclePhase === 'ovulation' ? 'Rụng trứng' : 'Giai đoạn hoàng thể'}
        </p>
      </div>

      <div className="relative w-64 h-64 mx-auto">
        {/* Vòng tròn nền */}
        <svg width="256" height="256" viewBox="0 0 256 256">
          {/* Các giai đoạn */}
          {phases.map((phase, index) => {
            const { startAngle, sweepAngle } = getPhaseAngle(phase.start, phase.end);
            const radius = 100;
            const centerX = 128;
            const centerY = 128;
            
                         const startRad = (startAngle * Math.PI) / 180;
             const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            const largeArcFlag = sweepAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={index}
                d={pathData}
                fill={phase.color}
                opacity={0.8}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}
          

          
          {/* Số ngày xung quanh vòng tròn */}
          {Array.from({ length: cycleLength }, (_, i) => {
            const day = i + 1;
            // Số ngày cũng tính theo tiến trình % tương tự
            // Ngày 1 ở vị trí 6 giờ (270 độ)
            const angle = 270 + (day / cycleLength) * 360;
            const rad = (angle * Math.PI) / 180;
            const radius = 115;
            const x = 128 + radius * Math.cos(rad);
            const y = 128 + radius * Math.sin(rad);
            
            return (
              <text
                key={day}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-xs font-medium ${
                  day === currentDay ? 'text-red-600 font-bold' : 'text-gray-600'
                }`}
              >
                {day}
              </text>
            );
          })}
        </svg>
        
        {/* Thông tin ở giữa */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
            <div>
              <div className="text-2xl font-bold text-gray-800">{currentDay}</div>
              <div className="text-xs text-gray-500">ngày</div>
            </div>
          </div>
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
          
          {/* Pill tracking status */}
          {todayPill && (
            <>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="font-medium mb-1">Thuốc tránh thai:</div>
                <div>• Trạng thái: {todayPill.is_taken ? 'Đã uống' : 'Chưa uống'}</div>
                <div>• Nhắc nhở: {todayPill.reminder_enabled ? todayPill.reminder_time : 'Tắt'}</div>
                {onShowPillSettings && (
                  <button
                    onClick={onShowPillSettings}
                    className="mt-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Cài đặt nhắc nhở
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CycleProgressCircle; 