import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { FaCalendarAlt, FaHeart, FaBullseye, FaTint, FaStar, FaLock, FaMobileAlt, FaLightbulb, FaUserPlus } from 'react-icons/fa';
import { HiSparkles, HiSun, HiMoon } from 'react-icons/hi';
import { CycleData, TodayStatus } from '../../../services/menstrualCycleService';

interface CycleDashboardProps {
  cycles: CycleData[];
  todayStatus: TodayStatus | null;
  onRefresh: () => void;
  isFirstTimeUser?: boolean;
  onShowGuide?: () => void;
}

// Circular Progress Component giống Flo
const CircularProgress: React.FC<{
  progress: number;
  cycleDay: number;
  totalDays: number;
  phase: string;
}> = ({ progress, cycleDay, totalDays, phase }) => {
  const radius = 180;
  const strokeWidth = 18;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'period': return '#E91E63';
      case 'follicular': return '#9C27B0';
      case 'ovulation': return '#673AB7';
      case 'luteal': return '#3F51B5';
      default: return '#E0E0E0';
    }
  };

  const getPhaseGradient = (phase: string) => {
    switch (phase) {
      case 'period': return 'from-pink-400 to-rose-600';
      case 'follicular': return 'from-purple-400 to-pink-600';
      case 'ovulation': return 'from-purple-600 to-indigo-700';
      case 'luteal': return 'from-indigo-500 to-purple-700';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Background Circle */}
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#F3F4F6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getPhaseColor(phase)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getPhaseGradient(phase)} flex items-center justify-center shadow-lg`}>
          <div className="text-center text-white">
            <div className="text-2xl font-bold">{cycleDay}</div>
            <div className="text-sm opacity-90">ngày</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CycleDashboard: React.FC<CycleDashboardProps> = ({ cycles, todayStatus, isFirstTimeUser, onShowGuide }) => {
  const currentCycle = cycles.length > 0 ? cycles[0] : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCycleProgress = (cycle: CycleData) => {
    if (!cycle.cycle_length) return 0;
    
    const startDate = new Date(cycle.cycle_start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.min((daysPassed / cycle.cycle_length) * 100, 100);
  };

  const getCycleDay = (cycle: CycleData) => {
    const startDate = new Date(cycle.cycle_start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getCurrentPhase = () => {
    if (!todayStatus) return 'unknown';
    if (todayStatus.is_period_day) return 'period';
    if (todayStatus.is_ovulation_day) return 'ovulation';
    if (todayStatus.is_fertile_day) return 'follicular';
    return 'luteal';
  };

  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'period':
        return {
          name: 'Kinh nguyệt',
          description: 'Giai đoạn kinh nguyệt',
          icon: <FaTint className="h-4 w-4" />,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          borderColor: 'border-pink-200'
        };
      case 'follicular':
        return {
          name: 'Cửa sổ sinh sản',
          description: 'Khả năng thụ thai cao',
          icon: <HiSun className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'ovulation':
        return {
          name: 'Rụng trứng',
          description: 'Khả năng thụ thai cao nhất',
          icon: <HiSparkles className="h-4 w-4" />,
          color: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-300'
        };
      case 'luteal':
        return {
          name: 'Giai đoạn Luteal',
          description: 'Chuẩn bị cho chu kì tiếp theo',
          icon: <HiMoon className="h-4 w-4" />,
          color: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200'
        };
      default:
        return {
          name: 'Không xác định',
          description: 'Đang phân tích chu kì',
          icon: <FaCalendarAlt className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  if (!currentCycle) {
    return (
      <div className="space-y-6">
        {/* Enhanced Hero Empty State */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-8 sm:p-12">
            <div className="text-center text-white">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                  <FaHeart className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <HiSparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-3">Chào mừng đến với GenCare</h2>
              <p className="text-white/90 mb-8 text-lg max-w-md mx-auto">
                Hãy bắt đầu hành trình theo dõi chu kì kinh nguyệt để có những dự đoán chính xác nhất
              </p>

              {/* Steps */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Ghi nhận chu kì</h3>
                  <p className="text-sm text-white/80">Thêm ngày kinh nguyệt đầu tiên</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Theo dõi hàng ngày</h3>
                  <p className="text-sm text-white/80">Ghi chú triệu chứng và tâm trạng</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Nhận dự đoán</h3>
                  <p className="text-sm text-white/80">Dự báo chu kì và rụng trứng</p>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto">
                <p className="text-sm mb-4 flex items-start gap-2">
                  <FaLightbulb className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Bắt đầu ngay:</strong> Hãy sử dụng tab "Lịch Chu Kì" để thêm ngày kinh nguyệt đầu tiên</span>
                </p>
                
                {isFirstTimeUser && onShowGuide && (
                  <div className="mb-4 p-3 bg-yellow-400/20 border border-yellow-300/30 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2 flex items-center gap-2">
                      <FaUserPlus className="text-yellow-600" />
                      <span><strong>Người dùng mới:</strong> Xem hướng dẫn chi tiết để sử dụng hiệu quả</span>
                    </p>
                    <button
                      onClick={onShowGuide}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full transition-colors"
                    >
                      Xem hướng dẫn
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <FaStar className="text-yellow-300" />
                    Miễn phí
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <FaLock className="text-green-300" />
                    Bảo mật
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <FaMobileAlt className="text-blue-300" />
                    Thông báo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const cycleDay = getCycleDay(currentCycle);
  const cycleProgress = getCycleProgress(currentCycle);
  const currentPhase = getCurrentPhase();
  const phaseInfo = getPhaseInfo(currentPhase);

  return (
    <div className="space-y-4">
      {/* Main Cycle Display - Flo Style */}
      <Card className="overflow-hidden shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow duration-300">
        <div className={`bg-gradient-to-br from-white via-gray-50/30 to-white ${phaseInfo.bgColor}/20 p-4 sm:p-6`}>
          {/* Mobile Layout */}
          <div className="flex flex-col items-center gap-6 xl:hidden">
            {/* Circular Progress for Mobile */}
            <div className="flex-shrink-0">
              <CircularProgress
                progress={cycleProgress}
                cycleDay={cycleDay}
                totalDays={currentCycle.cycle_length || 28}
                phase={currentPhase}
              />
            </div>
            
            {/* Phase Info for Mobile */}
            <div className="text-center w-full">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${phaseInfo.bgColor} ${phaseInfo.borderColor} border mb-3`}>
                <span className={phaseInfo.color}>{phaseInfo.icon}</span>
                <span className={`text-sm font-medium ${phaseInfo.color}`}>
                  {phaseInfo.name}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ngày {cycleDay} của chu kì
              </h2>
              
              <p className="text-gray-600 mb-4">
                {phaseInfo.description}
              </p>

              {todayStatus && (
                <div className="flex justify-center mb-4">
                  <Badge className={`${phaseInfo.bgColor} ${phaseInfo.color} border-0 text-sm px-3 py-1`}>
                    {todayStatus.pregnancy_chance === 'high' ? 'Khả năng thụ thai cao' :
                     todayStatus.pregnancy_chance === 'medium' ? 'Khả năng thụ thai trung bình' :
                     'Khả năng thụ thai thấp'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Stats for Mobile */}
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              {/* Next Ovulation */}
              {currentCycle.predicted_ovulation_date && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-lg flex items-center justify-center text-white">
                      <FaBullseye className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Rụng trứng</h3>
                      <p className="text-lg font-bold text-indigo-600">
                        {getDaysUntil(currentCycle.predicted_ovulation_date) === 0 ? 'Hôm nay' :
                         getDaysUntil(currentCycle.predicted_ovulation_date) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_ovulation_date)} ngày` : 
                         'Đã qua'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentCycle.predicted_ovulation_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fertile Window */}
              {currentCycle.predicted_fertile_start && currentCycle.predicted_fertile_end && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <FaHeart className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Cửa sổ sinh sản</h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {formatDate(currentCycle.predicted_fertile_start)} - {formatDate(currentCycle.predicted_fertile_end)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Còn {getDaysUntil(currentCycle.predicted_fertile_start) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_fertile_start)} ngày` : 
                         todayStatus?.is_fertile_day ? 'Hiện tại' : 'Đã qua'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Period */}
              {currentCycle.predicted_cycle_end && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-lg flex items-center justify-center text-white">
                      <FaTint className="h-4 w-4" />    
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Kì kinh tiếp theo</h3>
                      <p className="text-lg font-bold text-indigo-600">
                        {getDaysUntil(currentCycle.predicted_cycle_end) === 0 ? 'Hôm nay' :
                         getDaysUntil(currentCycle.predicted_cycle_end) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_cycle_end)} ngày` : 
                         'Trễ'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentCycle.predicted_cycle_end)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden xl:grid xl:grid-cols-12 xl:gap-8 xl:items-center">
            {/* Left - Circular Progress */}
            <div className="xl:col-span-4 flex justify-center">
              <CircularProgress
                progress={cycleProgress}
                cycleDay={cycleDay}
                totalDays={currentCycle.cycle_length || 28}
                phase={currentPhase}
              />
            </div>

            {/* Center - Phase Info */}
            <div className="xl:col-span-4 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${phaseInfo.bgColor} ${phaseInfo.borderColor} border mb-3`}>
                <span className={phaseInfo.color}>{phaseInfo.icon}</span>
                <span className={`text-sm font-medium ${phaseInfo.color}`}>
                  {phaseInfo.name}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ngày {cycleDay} của chu kì
              </h2>
              
              <p className="text-gray-600 mb-4">
                {phaseInfo.description}
              </p>

              {todayStatus && (
                <div className="flex justify-center">
                  <Badge className={`${phaseInfo.bgColor} ${phaseInfo.color} border-0 text-sm px-3 py-1`}>
                    {todayStatus.pregnancy_chance === 'high' ? 'Khả năng thụ thai cao' :
                     todayStatus.pregnancy_chance === 'medium' ? 'Khả năng thụ thai trung bình' :
                     'Khả năng thụ thai thấp'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Right - Stats */}
            <div className="xl:col-span-4 flex flex-col gap-3">
              {/* Next Ovulation */}
              {currentCycle.predicted_ovulation_date && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-lg flex items-center justify-center text-white">
                      <FaBullseye className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Rụng trứng</h3>
                      <p className="text-lg font-bold text-indigo-600">
                        {getDaysUntil(currentCycle.predicted_ovulation_date) === 0 ? 'Hôm nay' :
                         getDaysUntil(currentCycle.predicted_ovulation_date) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_ovulation_date)} ngày` : 
                         'Đã qua'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentCycle.predicted_ovulation_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fertile Window */}
              {currentCycle.predicted_fertile_start && currentCycle.predicted_fertile_end && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <FaHeart className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Cửa sổ sinh sản</h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {formatDate(currentCycle.predicted_fertile_start)} - {formatDate(currentCycle.predicted_fertile_end)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Còn {getDaysUntil(currentCycle.predicted_fertile_start) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_fertile_start)} ngày` : 
                         todayStatus?.is_fertile_day ? 'Hiện tại' : 'Đã qua'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Period */}
              {currentCycle.predicted_cycle_end && (
                <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-gray-200/30 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-lg flex items-center justify-center text-white">
                      <FaTint className="h-4 w-4" />    
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">Kì kinh tiếp theo</h3>
                      <p className="text-lg font-bold text-indigo-600">
                        {getDaysUntil(currentCycle.predicted_cycle_end) === 0 ? 'Hôm nay' :
                         getDaysUntil(currentCycle.predicted_cycle_end) > 0 ? 
                         `${getDaysUntil(currentCycle.predicted_cycle_end)} ngày` : 
                         'Trễ'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(currentCycle.predicted_cycle_end)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CycleDashboard; 