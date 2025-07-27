import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/Input';
import { CycleData, menstrualCycleService, PeriodDay, ProcessCycleWithMoodRequest } from '../../../services/menstrualCycleService';
import { PillSchedule } from '../../../services/pillTrackingService';
import { toast } from 'react-hot-toast';
import MoodModal from './MoodModal';
import { 
  FaHeart, 
  FaCircle, 
  FaTimes, 
  FaSave, 
  FaEye, 
  FaEgg,
  FaBullseye,
  FaVenus,
  FaSmile,
  FaFrown,
  FaMeh,
  FaRegCircle,
  FaTint,
  FaCheck,
  FaEdit,
  FaInfoCircle
} from 'react-icons/fa';

interface CycleCalendarProps {
  cycles: CycleData[];
  onRefresh: () => void;
  pillSchedules?: PillSchedule[];
}

// Import the correct type from service
import { DailyMoodData } from '../../../services/menstrualCycleService';

// Custom toast cho chu kỳ kinh nguyệt
function customMenstrualToast(message: string, type: 'success' | 'error' = 'success') {
  toast.custom((t) => (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border-2 ${type === 'success' ? 'bg-gradient-to-r from-pink-400 to-purple-400 border-pink-300' : 'bg-gradient-to-r from-rose-400 to-pink-500 border-rose-300'} text-white font-semibold animate-in fade-in-0 zoom-in-95`}
      style={{ minWidth: 260, maxWidth: 400 }}
    >
      <span className="text-2xl">
        {type === 'success' ? <FaHeart /> : <FaTint />}
      </span>
      <span className="text-base font-bold">{message}</span>
      <button onClick={() => toast.dismiss(t.id)} className="ml-auto text-white/70 hover:text-white text-lg">×</button>
    </div>
  ));
}

const CycleCalendar: React.FC<CycleCalendarProps> = ({ cycles, onRefresh, pillSchedules = [] }) => {
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<PeriodDay[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedDateForMood, setSelectedDateForMood] = useState<Date | null>(null);
  const [moodModalSavedSuccessfully, setMoodModalSavedSuccessfully] = useState(false);
  
  // Hover mood tooltip state
  const [hoverMoodData, setHoverMoodData] = useState<{ data: DailyMoodData; date: Date; position: { x: number; y: number } } | null>(null);
  const [hoverMood, setHoverMood] = useState<{date: Date, mood: DailyMoodData} | null>(null);

  // Current cycle for predictions
  const currentCycle = cycles && cycles.length > 0 ? cycles[0] : null;

  // Helper function to convert date to local date string (fix timezone issue)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateSelected = (date: Date) => {
    return selectedPeriodDays.some(periodDay => 
      isSameDay(new Date(periodDay.date), date)
    );
  };

  const isPeriodDay = (date: Date) => {
    if (!currentCycle) return false;
    return currentCycle.period_days.some(periodDay => 
      isSameDay(new Date(periodDay.date), date)
    );
  };

  const isPredictedPeriodDay = (date: Date) => {
    if (!currentCycle) return false;
    
    // Check if it's within the predicted cycle range
    const cycleStart = new Date(currentCycle.cycle_start_date);
    const predictedEnd = currentCycle.predicted_cycle_end ? new Date(currentCycle.predicted_cycle_end) : null;
    
    if (!predictedEnd) return false;
    
    return date >= cycleStart && date <= predictedEnd && !isPeriodDay(date);
  };

  const isOvulationDay = (date: Date) => {
    if (!currentCycle?.predicted_ovulation_date) return false;
    return isSameDay(date, new Date(currentCycle.predicted_ovulation_date));
  };

  const isFertileDay = (date: Date) => {
    if (!currentCycle?.predicted_fertile_start || !currentCycle?.predicted_fertile_end) return false;
    const fertileStart = new Date(currentCycle.predicted_fertile_start);
    const fertileEnd = new Date(currentCycle.predicted_fertile_end);
    return date >= fertileStart && date <= fertileEnd && !isOvulationDay(date);
  };

  const handleDateClick = (date: Date) => {
    const dateString = getLocalDateString(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Kiểm tra ngày trong tương lai
    if (date > today) {
      customMenstrualToast('Không thể chọn ngày trong tương lai!', 'error');
      return;
    }
    
    // Check if date is already selected
    const existingIndex = selectedPeriodDays.findIndex(periodDay => 
      isSameDay(new Date(periodDay.date), date)
    );

    if (existingIndex !== -1) {
      // Remove from selection
      const updatedSelection = selectedPeriodDays.filter((_, index) => index !== existingIndex);
      setSelectedPeriodDays(updatedSelection);
    } else {
      // Check if this date already has mood data in current cycle
      const existingMoodData = getMoodDataForDate(date);
      if (existingMoodData) {
        // If date has mood data, show modal instead of adding to selection
        setSelectedDateForMood(date);
        setShowMoodModal(true);
        return;
      }
      
      // Add to selection with default mood data
      const newPeriodDay: PeriodDay = {
        date: dateString,
        mood_data: {
          mood: 'neutral',
          energy: 'medium',
          symptoms: [],
          notes: undefined
        }
      };
      
      const updatedSelection = [...selectedPeriodDays, newPeriodDay];
      
      // Kiểm tra validation sau khi thêm ngày mới
      const validation = validatePeriodDays(updatedSelection);
      if (!validation.isValid && updatedSelection.length > 7) {
        customMenstrualToast(validation.message!, 'error');
        return;
      }
      
      setSelectedPeriodDays(updatedSelection);
    }
  };

  const handleRemovePeriodDay = async (dateToRemove: Date) => {
    try {
      const dateString = getLocalDateString(dateToRemove);
      
      // Remove from selected period days
      const updatedSelection = selectedPeriodDays.filter(periodDay => 
        !isSameDay(new Date(periodDay.date), dateToRemove)
      );
      
      setSelectedPeriodDays(updatedSelection);
      customMenstrualToast('Đã xóa ngày khỏi danh sách chọn!', 'success');
    } catch (error: any) {
      console.error('Lỗi khi xóa ngày:', error);
      handleDetailedError(error, 'Lỗi khi xóa ngày');
    }
  };

  const handleMoodSave = async (moodData: DailyMoodData) => {
    if (!selectedDateForMood) return;

    const dateString = getLocalDateString(selectedDateForMood);
    
    try {
      // Update mood data via API
      const response = await menstrualCycleService.updatePeriodDayMood(dateString, moodData);
      
      if (response.success) {
        // Update the selected period day with new mood data
        setSelectedPeriodDays(prev => 
          prev.map(periodDay => 
            periodDay.date === dateString 
              ? { ...periodDay, mood_data: moodData }
              : periodDay
          )
        );

        setMoodModalSavedSuccessfully(true);
        setTimeout(() => {
          setMoodModalSavedSuccessfully(false);
        }, 2000);
        
        // Refresh data to update calendar display
        await onRefresh();
        customMenstrualToast('Đã lưu cảm xúc thành công!', 'success');
      } else {
        customMenstrualToast(`Lỗi khi lưu cảm xúc: ${response.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu cảm xúc:', error);
      handleDetailedError(error, 'Lỗi khi lưu cảm xúc');
    }
  };

  const handleMoodModalClose = () => {
    setShowMoodModal(false);
    setSelectedDateForMood(null);
  };

  const handleDetailedError = (error: any, defaultMessage: string) => {
    console.error('Detailed error:', error);
    
    let errorMessage = defaultMessage;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    customMenstrualToast(errorMessage, 'error');
  };

  const saveCycle = async () => {
    // Validate period days
    const validation = validatePeriodDays(selectedPeriodDays);
    if (!validation.isValid) {
      customMenstrualToast(validation.message!, 'error');
      return;
    }

    setIsSaving(true);
    
    try {
      // Create request with selected period days
      const request: ProcessCycleWithMoodRequest = {
        period_days: selectedPeriodDays
      };

      const response = await menstrualCycleService.processCycleWithMood(request);
      
      if (response.success) {
        customMenstrualToast('Đã lưu chu kì thành công!', 'success');
        setSelectedPeriodDays([]);
        await onRefresh();
      } else {
        const errorMessage = response?.message || 'Không thể lưu chu kì';
        customMenstrualToast(`Lỗi khi lưu chu kì: ${errorMessage}`, 'error');
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu chu kì:', error);
      handleDetailedError(error, 'Lỗi khi lưu chu kì');
    } finally {
      setIsSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedPeriodDays([]);
  };

  // Validate period days for reasonable cycle length and continuity
  const validatePeriodDays = (periodDays: PeriodDay[]): { isValid: boolean; message?: string } => {
    if (periodDays.length === 0) {
      return { isValid: false, message: 'Vui lòng chọn ít nhất một ngày kinh nguyệt!' };
    }

    // Kiểm tra độ dài chu kỳ hợp lý (5-7 ngày)
    if (periodDays.length < 5 || periodDays.length > 7) {
      return { 
        isValid: false, 
        message: `Chu kỳ kinh nguyệt phải từ 5-7 ngày (hiện tại: ${periodDays.length} ngày)!` 
      };
    }

    // Kiểm tra các ngày phải liên tục
    const sortedDays = periodDays
      .map(pd => new Date(pd.date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 1; i < sortedDays.length; i++) {
      const diffMs = sortedDays[i].getTime() - sortedDays[i-1].getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays !== 1) {
        return { isValid: false, message: 'Các ngày kinh nguyệt phải liên tục!' };
      }
    }

    // Kiểm tra ngày không quá xa trong quá khứ (tối đa 6 tháng)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const periodDay of periodDays) {
      const dayDate = new Date(periodDay.date);
      if (dayDate < sixMonthsAgo) {
        return { isValid: false, message: 'Không thể chọn ngày quá xa trong quá khứ (tối đa 6 tháng)!' };
      }
    }

    return { isValid: true };
  };

  const renderCustomCalendar = () => {
    return (
      <div className="relative">
        <Calendar
          onChange={(value) => {
            if (value instanceof Date) {
              handleDateClick(value);
            }
          }}
          tileContent={getTileContent}
          className="w-full border-0 shadow-none"
          tileClassName={({ date, view }) => {
            if (view !== 'month') return '';
            
            let className = 'relative p-2 min-h-[60px] flex flex-col items-center justify-center';
            
            if (isPeriodDay(date)) {
              className += ' bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-lg shadow-md';
            } else if (isDateSelected(date)) {
              className += ' bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-lg shadow-md border-2 border-purple-300';
            } else if (isOvulationDay(date)) {
              className += ' bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-lg shadow-md';
            } else if (isFertileDay(date)) {
              className += ' bg-gradient-to-br from-green-400 to-emerald-400 text-white rounded-lg shadow-md';
            } else if (isPredictedPeriodDay(date)) {
              className += ' bg-gradient-to-br from-pink-200 to-rose-200 text-gray-700 rounded-lg border-2 border-dashed border-pink-300';
            }
            
            return className;
          }}
        />
      </div>
    );
  };

  const getMoodDataForDate = (date: Date) => {
    const dateKey = getLocalDateString(date);
    
    // Check in selected period days
    const selectedPeriodDay = selectedPeriodDays.find(periodDay => 
      periodDay.date === dateKey
    );
    if (selectedPeriodDay?.mood_data) {
      return selectedPeriodDay.mood_data;
    }
    
    // Check in current cycle period days
    if (currentCycle?.period_days) {
      const periodDay = currentCycle.period_days.find(day => 
        isSameDay(new Date(day.date), date)
      );
      if (periodDay?.mood_data) {
        return periodDay.mood_data;
      }
    }
    
    return null;
  };

  const hasReminderEmailSent = (date: Date): boolean => {
    return pillSchedules.some(schedule => {
      const scheduleDate = new Date(schedule.pill_start_date);
      return isSameDay(scheduleDate, date) && (schedule.reminder_sent_timestamps?.length || 0) > 0;
    });
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const moodData = getMoodDataForDate(date);
    const isPeriod = isPeriodDay(date) || isDateSelected(date);
    const hasReminder = hasReminderEmailSent(date);

    const handleMoodHover = (e: React.MouseEvent, data: DailyMoodData) => {
      setHoverMoodData({
        data,
        date,
        position: { x: e.clientX, y: e.clientY }
      });
    };

    const handleMoodLeave = () => {
      setHoverMoodData(null);
    };

    const handleMoodClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedDateForMood(date);
      setShowMoodModal(true);
    };

    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative"
        onMouseEnter={moodData ? (e) => handleMoodHover(e, moodData) : undefined}
        onMouseLeave={moodData ? handleMoodLeave : undefined}
      >
        {/* Date number */}
        <span className="text-sm font-semibold mb-1">
          {date.getDate()}
        </span>
        
        {/* Mood indicator */}
        {moodData && (
          <div 
            className="cursor-pointer hover:scale-110 transition-transform group"
            onClick={handleMoodClick}
          >
            {moodData.mood === 'happy' && <FaSmile className="text-yellow-300 text-lg group-hover:text-yellow-400" />}
            {moodData.mood === 'sad' && <FaFrown className="text-blue-300 text-lg group-hover:text-blue-400" />}
            {moodData.mood === 'tired' && <FaMeh className="text-gray-300 text-lg group-hover:text-gray-400" />}
            {moodData.mood === 'excited' && <FaSmile className="text-orange-300 text-lg group-hover:text-orange-400" />}
            {moodData.mood === 'calm' && <FaRegCircle className="text-green-300 text-lg group-hover:text-green-400" />}
            {moodData.mood === 'stressed' && <FaFrown className="text-red-300 text-lg group-hover:text-red-400" />}
            {moodData.mood === 'neutral' && <FaRegCircle className="text-gray-400 text-sm group-hover:text-gray-500" />}
          </div>
        )}
        
        {/* Period indicator */}
        {isPeriod && (
          <div className="absolute top-1 right-1">
            <FaTint className="text-white text-xs" />
          </div>
        )}
        
        {/* Mood data indicator */}
        {moodData && !isPeriod && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
          </div>
        )}
        
        {/* Reminder indicator */}
        {hasReminder && (
          <div className="absolute bottom-1 right-1">
            <FaCheck className="text-green-300 text-xs" />
          </div>
        )}
        
        {/* Prediction indicators */}
        {isOvulationDay(date) && (
          <div className="absolute top-1 left-1">
            <FaEgg className="text-yellow-300 text-xs" />
          </div>
        )}
        
        {isFertileDay(date) && (
          <div className="absolute bottom-1 left-1">
            <FaBullseye className="text-green-300 text-xs" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaVenus className="text-pink-500" />
          Lịch Chu Kỳ Kinh Nguyệt
        </CardTitle>
        <CardDescription>
          Chọn các ngày kinh nguyệt và ghi chú cảm xúc
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            {renderCustomCalendar()}
          </div>
          
          {/* Right Column - Controls and Info */}
          <div className="space-y-4 order-2 lg:order-2">
            {/* Selected days summary */}
            {selectedPeriodDays.length > 0 && (
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">
                    Ngày đã chọn ({selectedPeriodDays.length})
                  </h4>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPeriodDays.map((periodDay, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200 shadow-sm"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(periodDay.date).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDateForMood(new Date(periodDay.date));
                            setShowMoodModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Chỉnh sửa cảm xúc"
                        >
                          <FaEdit className="text-xs" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePeriodDay(new Date(periodDay.date))}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Xóa ngày"
                        >
                          <FaTimes className="text-xs" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="text-gray-600 hover:text-gray-800 flex-1"
                  >
                    <FaTimes className="mr-1" />
                    Xóa tất cả
                  </Button>
                  <Button
                    onClick={saveCycle}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white flex-1"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-1" />
                        Lưu chu kỳ
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaInfoCircle className="text-blue-500" />
                <span className="font-medium text-blue-800">Hướng dẫn:</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Chọn <strong>5-7 ngày liên tục</strong></li>
                <li>• Các ngày phải <strong>liên tục</strong></li>
                <li>• Chỉ chọn ngày trong <strong>quá khứ</strong></li>
                <li>• Click vào ngày để chọn/bỏ chọn</li>
                <li>• Click vào biểu tượng cảm xúc để chỉnh sửa</li>
              </ul>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Chú thích:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-rose-500 rounded"></div>
                  <span>Ngày kinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded"></div>
                  <span>Đã chọn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded"></div>
                  <span>Rụng trứng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-400 rounded"></div>
                  <span>Thụ thai</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
                  <span>Có cảm xúc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
             {/* Mood Modal */}
       {showMoodModal && selectedDateForMood && (
         <MoodModal
           isOpen={showMoodModal}
           onClose={handleMoodModalClose}
           onSave={handleMoodSave}
           initialMoodData={getMoodDataForDate(selectedDateForMood)}
           selectedDate={selectedDateForMood}
         />
       )}
      
      {/* Mood Tooltip */}
      {hoverMoodData && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-xs backdrop-blur-sm"
          style={{
            left: hoverMoodData.position.x + 10,
            top: hoverMoodData.position.y - 10,
            pointerEvents: 'none'
          }}
        >
          <div className="text-sm">
            <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FaTint className="text-pink-500" />
              {hoverMoodData.date.toLocaleDateString('vi-VN')}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs">Tâm trạng:</span>
                <div className="flex items-center gap-1">
                  {hoverMoodData.data.mood === 'happy' && <FaSmile className="text-yellow-500" />}
                  {hoverMoodData.data.mood === 'sad' && <FaFrown className="text-blue-500" />}
                  {hoverMoodData.data.mood === 'tired' && <FaMeh className="text-gray-500" />}
                  {hoverMoodData.data.mood === 'excited' && <FaSmile className="text-orange-500" />}
                  {hoverMoodData.data.mood === 'calm' && <FaRegCircle className="text-green-500" />}
                  {hoverMoodData.data.mood === 'stressed' && <FaFrown className="text-red-500" />}
                  {hoverMoodData.data.mood === 'neutral' && <FaRegCircle className="text-gray-400" />}
                  <span className="font-medium text-xs">
                    {hoverMoodData.data.mood === 'happy' && 'Vui vẻ'}
                    {hoverMoodData.data.mood === 'sad' && 'Buồn'}
                    {hoverMoodData.data.mood === 'tired' && 'Mệt mỏi'}
                    {hoverMoodData.data.mood === 'excited' && 'Hồi hộp'}
                    {hoverMoodData.data.mood === 'calm' && 'Bình tĩnh'}
                    {hoverMoodData.data.mood === 'stressed' && 'Căng thẳng'}
                    {hoverMoodData.data.mood === 'neutral' && 'Bình thường'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs">Năng lượng:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    hoverMoodData.data.energy === 'high' ? 'bg-green-500' :
                    hoverMoodData.data.energy === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium text-xs">
                    {hoverMoodData.data.energy === 'high' && 'Cao'}
                    {hoverMoodData.data.energy === 'medium' && 'Trung bình'}
                    {hoverMoodData.data.energy === 'low' && 'Thấp'}
                  </span>
                </div>
              </div>
              {hoverMoodData.data.symptoms.length > 0 && (
                <div>
                  <span className="text-gray-600 text-xs">Triệu chứng:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {hoverMoodData.data.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {hoverMoodData.data.notes && (
                <div>
                  <span className="text-gray-600 text-xs">Ghi chú:</span>
                  <div className="mt-1 text-xs italic text-gray-700 bg-gray-50 p-2 rounded">
                    {hoverMoodData.data.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CycleCalendar; 