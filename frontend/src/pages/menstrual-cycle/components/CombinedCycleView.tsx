import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { TodayStatus, CycleData } from '../../../services/menstrualCycleService';
import { FaHeart, FaCalendarAlt, FaChartBar, FaInfoCircle, FaEdit, FaTimes, FaSave, FaTint, FaCheck, FaEgg, FaBullseye, FaChevronLeft, FaChevronRight, FaTrash, FaPills, FaCog } from 'react-icons/fa';
import { menstrualCycleService } from '../../../services/menstrualCycleService';
import { toast } from 'react-hot-toast';
import CycleProgressCircle from './CycleProgressCircle';

interface CombinedCycleViewProps {
  todayStatus: TodayStatus | null;
  cycles: CycleData[];
  onRefresh: () => void;
  isFirstTimeUser: boolean;
  onShowGuide: () => void;
  pillSchedules?: any[];
  onTakePill?: (scheduleId: string) => Promise<void>;
  onShowPillSettings?: () => void;
}

const CombinedCycleView: React.FC<CombinedCycleViewProps> = ({
  todayStatus,
  cycles,
  onRefresh,
  isFirstTimeUser,
  onShowGuide,
  pillSchedules = [],
  onTakePill,
  onShowPillSettings
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Pill tracking logic
  const getPillScheduleForDate = (date: Date) => {
    if (!pillSchedules || !pillSchedules.length) return null;
    const dateString = getLocalDateString(date);
    return pillSchedules.find(schedule => {
      const scheduleDate = new Date(schedule.pill_start_date);
      return getLocalDateString(scheduleDate) === dateString;
    });
  };

  const handlePillClick = async (date: Date) => {
    if (!onTakePill) return;
    
    const pillSchedule = getPillScheduleForDate(date);
    if (!pillSchedule) {
      toast.error('Không có lịch uống thuốc cho ngày này');
      return;
    }

    if (pillSchedule.is_taken) {
      toast.success(`Ngày ${date.getDate()}/${date.getMonth() + 1} đã được đánh dấu là đã uống`);
      return;
    }

    try {
      await onTakePill(pillSchedule._id);
      toast.success(`✅ Đã đánh dấu ngày ${date.getDate()}/${date.getMonth() + 1} là đã uống thuốc`);
    } catch (error) {
      toast.error('❌ Không thể đánh dấu đã uống. Vui lòng thử lại.');
    }
  };

  // Ensure cycles is always an array
  const safeCycles = Array.isArray(cycles) ? cycles : [];

  // Fixed timezone functions
  const getLocalDateString = (date: Date): string => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.error('Error in getLocalDateString:', err);
      return '';
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    try {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    } catch (err) {
      console.error('Error in isSameDay:', err);
      return false;
    }
  };

  // Calculate cycle progress
  const calculateCycleProgress = () => {
    try {
      if (!todayStatus || !safeCycles?.length) return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
      
      const cycleLength = todayStatus.cycle_length || 28;
      
      if (todayStatus.day_in_cycle && todayStatus.cycle_phase) {
        const dayInCycle = todayStatus.day_in_cycle;
        const progress = (dayInCycle / cycleLength) * 100;
        return { progress, dayInCycle, phase: todayStatus.cycle_phase };
      }
      
          return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
    } catch (err) {
      console.error('Error in calculateCycleProgress:', err);
      return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'menstrual': return 'from-pink-400 to-rose-500';
      case 'follicular': return 'from-blue-400 to-indigo-500';
      case 'ovulation': return 'from-yellow-400 to-orange-500';
      case 'fertile': return 'from-green-400 to-emerald-500';
      case 'luteal': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'menstrual': return 'Giai đoạn Kinh nguyệt';
      case 'follicular': return 'Giai đoạn Nang trứng';
      case 'ovulation': return 'Giai đoạn Rụng trứng';
      case 'fertile': return 'Giai đoạn Thụ thai';
      case 'luteal': return 'Giai đoạn Luteal';
      default: return 'Không xác định';
    }
  };

  const isPeriodDay = (date: Date) => {
    try {
      if (!safeCycles?.length) return false;
      
      const dateString = getLocalDateString(date);
      return safeCycles.some(cycle => 
        cycle.period_days?.some(periodDate => {
          const cycleDate = new Date(periodDate);
          return getLocalDateString(cycleDate) === dateString;
        })
      );
    } catch (err) {
      console.error('Error in isPeriodDay:', err);
      return false;
    }
  };

  const isOvulationDay = (date: Date) => {
    try {
      if (!safeCycles?.length) return false;
      
      const latestCycle = safeCycles[0];
      if (!latestCycle.predicted_ovulation_date) return false;
      
      const ovulationDate = new Date(latestCycle.predicted_ovulation_date);
      return isSameDay(date, ovulationDate);
    } catch (err) {
      console.error('Error in isOvulationDay:', err);
      return false;
    }
  };

  const isFertileDay = (date: Date) => {
    try {
      if (!safeCycles?.length) return false;
      
      const latestCycle = safeCycles[0];
      if (!latestCycle.predicted_fertile_start || !latestCycle.predicted_fertile_end) return false;
        
      const fertileStart = new Date(latestCycle.predicted_fertile_start);
      const fertileEnd = new Date(latestCycle.predicted_fertile_end);
        
        return date >= fertileStart && date <= fertileEnd;
    } catch (err) {
      console.error('Error in isFertileDay:', err);
      return false;
    }
  };

  const getPredictedPeriodDays = (): Date[] => {
    try {
    if (!safeCycles?.length) return [];
    
      const latestCycle = safeCycles[0];
      if (!latestCycle.predicted_cycle_end) return [];
      
      const cycleStart = new Date(latestCycle.cycle_start_date);
      const cycleEnd = new Date(latestCycle.predicted_cycle_end);
      const periodLength = latestCycle.period_days?.length || 5;
      
      const predictedStart = new Date(cycleEnd);
      predictedStart.setDate(predictedStart.getDate() + 1);
      
      const predictedDays: Date[] = [];
      for (let i = 0; i < periodLength; i++) {
        const date = new Date(predictedStart);
        date.setDate(predictedStart.getDate() + i);
        predictedDays.push(date);
      }
    
    return predictedDays;
    } catch (err) {
      console.error('Error in getPredictedPeriodDays:', err);
      return [];
    }
  };

  const isPredictedPeriodDay = (date: Date) => {
    const predictedDays = getPredictedPeriodDays();
    return predictedDays.some(predictedDate => isSameDay(date, predictedDate));
  };

  const handleDeletePeriodDay = async (dateToDelete: Date) => {
    try {
      setIsDeleting(true);
      const dateString = getLocalDateString(dateToDelete);
      
      const response = await menstrualCycleService.deletePeriodDay(dateString);
      
      if (response.success) {
        toast.success('Đã xóa ngày hành kinh thành công');
        onRefresh();
      } else {
        toast.error(response.message || 'Lỗi khi xóa ngày hành kinh');
      }
    } catch (error: any) {
      console.error('Error deleting period day:', error);
      toast.error('Lỗi khi xóa ngày hành kinh');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDayClick = (date: Date) => {
    const dateString = getLocalDateString(date);
    
    // Check if date is in the future with proper timezone handling
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    console.log('[CombinedCycleView] Date validation:', {
      clickedDate: date.toISOString(),
      dateLocal: dateLocal.toISOString(),
      today: today.toISOString(),
      todayLocal: todayLocal.toISOString(),
      isFuture: dateLocal > todayLocal
    });
    
    if (dateLocal > todayLocal) {
      toast.error('Không thể chọn ngày trong tương lai');
      return;
    }
    
    if (selectedPeriodDays.includes(dateString)) {
      setSelectedPeriodDays(selectedPeriodDays.filter(d => d !== dateString));
    } else {
      setSelectedPeriodDays([...selectedPeriodDays, dateString]);
    }
  };

  const handleSavePeriodDays = async () => {
    if (selectedPeriodDays.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày hành kinh');
      return;
    }

    // Check for future dates with proper timezone handling
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const hasFutureDate = selectedPeriodDays.some(dateString => {
      const date = new Date(dateString);
      const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dateLocal > todayLocal;
    });
    
    if (hasFutureDate) {
      toast.error('Không thể chọn ngày trong tương lai');
      return;
    }

    try {
    setIsSaving(true);
    
      const response = await menstrualCycleService.processCycle(selectedPeriodDays);
      
      if (response.success) {
        toast.success('Đã lưu ngày hành kinh thành công');
        setSelectedPeriodDays([]);
        onRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi lưu ngày');
      }
    } catch (error: any) {
      console.error('Error saving period days:', error);
      toast.error('Có lỗi xảy ra khi lưu ngày hành kinh');
    } finally {
      setIsSaving(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const calendar = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      calendar.push(date);
    }

    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    return (
      <div className="space-y-4">
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-2"
          >
            <FaChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="text-xs"
            >
              Hôm nay
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <FaChevronRight className="w-4 h-4" />
          </Button>
            
            {/* Pill Settings Button */}
            {onShowPillSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowPillSettings}
                className="p-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                title="Cài đặt nhắc nhở thuốc"
              >
                <FaCog className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
              {day}
            </div>
          ))}
          {calendar.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, new Date());
            const isPeriod = isPeriodDay(date);
            const isOvulation = isOvulationDay(date);
            const isFertile = isFertileDay(date);
            const isPredicted = isPredictedPeriodDay(date);
            const isFuture = date > new Date();
            
            const isSelected = selectedPeriodDays.includes(getLocalDateString(date));
            
            // Pill tracking
            const pillSchedule = getPillScheduleForDate(date);
            const hasPill = !!pillSchedule;
            const isPillTaken = pillSchedule?.is_taken;
            const isPillHormone = pillSchedule?.pill_status === 'hormone';
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square text-xs p-1 rounded-md border transition-all relative
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isPeriod ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white' : ''}
                  ${isOvulation && !isPeriod ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' : ''}
                  ${isFertile && !isPeriod ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white' : ''}
                  ${isPredicted && !isPeriod ? 'bg-gradient-to-br from-blue-400 to-indigo-400 text-white' : ''}
                  ${isSelected && !isPeriod ? 'bg-pink-200 border-pink-500' : ''}
                  ${hasPill && !isPillTaken && !isPeriod ? 'bg-purple-100 border-purple-300' : ''}
                  ${isFuture ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                  ${!isCurrentMonth ? 'bg-gray-50' : ''}
                `}
              >
                <div className="flex items-center justify-center h-full relative">
                  {date.getDate()}
                  
                  {/* Pill indicator with pill number */}
                  {hasPill && (
                    <div className="absolute top-0 right-0">
                      {isPillTaken ? (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          <FaCheck className="text-white text-xs" />
                </div>
                      ) : (
                        <div 
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            isPillHormone 
                              ? 'bg-pink-200 border-pink-400 text-pink-700' 
                              : 'bg-gray-200 border-gray-400 text-gray-600'
                          }`}
                          title={`Viên thuốc ${pillSchedule.pill_number}${pillSchedule.reminder_enabled ? ' - Có nhắc nhở' : ' - Không nhắc nhở'}`}
                        >
                          {pillSchedule.pill_number}
                        </div>
                )}
              </div>
                  )}
        </div>
                
                {/* Delete button for period days */}
                {isPeriod && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePeriodDay(date);
                    }}
                    disabled={isDeleting}
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <FaTrash className="h-2 w-2" />
                  </Button>
                )}
                
                {/* Pill click button */}
                {hasPill && !isPeriod && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePillClick(date);
                    }}
                    className="absolute -bottom-1 -right-1 h-4 w-4 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                  >
                    <FaPills className="h-2 w-2" />
                  </Button>
                )}
                  </div>
            );
          })}
                </div>
              </div>
    );
  };

  const { progress, dayInCycle, phase } = calculateCycleProgress();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Left Column - Cycle Progress Circle */}
      <div className="lg:col-span-1 order-1 lg:order-1">
            {todayStatus && (
          <CycleProgressCircle
            currentDay={dayInCycle}
            cycleLength={todayStatus.cycle_length || 28}
            cyclePhase={phase as 'menstrual' | 'follicular' | 'ovulation' | 'luteal'}
            isPeriodDay={todayStatus.is_period_day || false}
            pillSchedules={pillSchedules}
            onTakePill={onTakePill}
            onShowPillSettings={onShowPillSettings}
          />
        )}
      </div>

      {/* Middle Column - Calendar */}
      <div className="lg:col-span-1 order-2 lg:order-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaCalendarAlt className="text-purple-500" />
              Lịch chu kỳ
            </CardTitle>
            <CardDescription>
              Chọn các ngày kinh nguyệt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCalendar()}
            
            {/* Save Button */}
            {selectedPeriodDays.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                <div className="text-sm text-pink-800">
                  Đã chọn {selectedPeriodDays.length} ngày hành kinh
                </div>
                <Button
                  onClick={handleSavePeriodDays}
                  disabled={isSaving}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  size="sm"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaSave className="h-4 w-4" />
                      Lưu ngày
                    </div>
                  )}
                </Button>
              </div>
            )}
            
            {/* Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Chú thích:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded"></div>
                  <span>Ngày kinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded"></div>
                  <span>Rụng trứng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-400 rounded"></div>
                  <span>Thụ thai</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-400 rounded"></div>
                  <span>Dự đoán kinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-200 border border-pink-500 rounded"></div>
                  <span>Đã chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 text-gray-400 rounded"></div>
                  <span>Tương lai</span>
                </div>
                {/* Pill tracking legend */}
                {pillSchedules && pillSchedules.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded flex items-center justify-center text-xs font-bold text-purple-700">
                        1
                      </div>
                      <span>Viên thuốc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-xs" />
                      </div>
                      <span>Đã uống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-pink-200 border border-pink-400 rounded-full flex items-center justify-center text-xs font-bold text-pink-700">
                        1
                      </div>
                      <span>Thuốc nội tiết</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        1
                      </div>
                      <span>Thuốc giả dược</span>
                    </div>
                  </>
                )}
              </div>
                </div>
              </CardContent>
            </Card>
      </div>

      {/* Right Column - Notes and Guide */}
      <div className="lg:col-span-1 order-3 lg:order-3">
        <div className="space-y-4">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FaInfoCircle className="text-blue-500" />
                Hướng dẫn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Click vào ngày trên lịch để chọn/bỏ chọn ngày hành kinh</li>
                <li>• Ngày đã chọn sẽ hiển thị màu hồng nhạt</li>
                <li>• Bấm &quot;Lưu ngày&quot; để lưu các ngày đã chọn</li>
                <li>• Bạn có thể xóa ngày đã lưu bằng nút xóa trên ngày</li>
                <li>• Hệ thống sẽ tự động tính toán và dự đoán chu kì</li>
                {pillSchedules && pillSchedules.length > 0 && (
                  <>
                    <li>• Số viên thuốc hiển thị trên mỗi ngày</li>
                    <li>• Dấu tích xanh = đã uống, số viên = chưa uống</li>
                    <li>• Hồng = thuốc nội tiết, Xám = thuốc giả dược</li>
                    <li>• Nhấp vào icon viên thuốc để đánh dấu đã uống</li>
                    <li>• Nhấp vào icon ⚙️ để cài đặt giờ nhắc nhở</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Prediction Info */}
          {safeCycles?.length > 0 && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FaChartBar className="text-blue-500" />
                  Dự đoán chu kỳ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const latestCycle = safeCycles[0];
                  
                  return (
                    <div className="space-y-2 text-xs">
                      {latestCycle.predicted_ovulation_date && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Rụng trứng:</span>
                          <span className="font-medium text-blue-800">
                            {new Date(latestCycle.predicted_ovulation_date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {latestCycle.predicted_fertile_start && latestCycle.predicted_fertile_end && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Thụ thai:</span>
                          <span className="font-medium text-blue-800">
                            {new Date(latestCycle.predicted_fertile_start).toLocaleDateString('vi-VN')} - {new Date(latestCycle.predicted_fertile_end).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {todayStatus?.next_cycle_start && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Chu kỳ tiếp:</span>
                          <span className="font-medium text-blue-800">
                            {new Date(todayStatus.next_cycle_start).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {todayStatus?.cycle_length && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Độ dài chu kỳ:</span>
                          <span className="font-medium text-blue-800">
                            {todayStatus.cycle_length} ngày
                          </span>
                        </div>
                      )}
                      {todayStatus?.period_length && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Độ dài kinh nguyệt:</span>
                          <span className="font-medium text-blue-800">
                            {todayStatus.period_length} ngày
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
         
          {/* First Time User Guide */}
          {isFirstTimeUser && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-yellow-800">
                  <FaInfoCircle className="text-yellow-600" />
                  Người dùng mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-yellow-700 mb-3">
                  Chào mừng bạn đến với GenCare! Hãy xem hướng dẫn để sử dụng hiệu quả.
                </p>
                <Button
                  onClick={onShowGuide}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs w-full"
                >
                  Xem hướng dẫn
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedCycleView; 
 