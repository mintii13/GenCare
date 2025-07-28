import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { TodayStatus, CycleData } from '../../../services/menstrualCycleService';
import { FaHeart, FaCalendarAlt, FaChartBar, FaInfoCircle, FaEdit, FaTimes, FaSave, FaTint, FaSmile, FaMeh, FaFrown, FaBatteryFull, FaBatteryHalf, FaBatteryEmpty, FaCheck, FaEgg, FaBullseye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MoodDataModal from '../../../components/menstrual-cycle/MoodDataModal';
import { DailyMoodData, PeriodDay, ProcessCycleWithMoodRequest, menstrualCycleService } from '../../../services/menstrualCycleService';

interface CombinedCycleViewProps {
  todayStatus: TodayStatus | null;
  cycles: CycleData[];
  onRefresh: () => void;
  isFirstTimeUser: boolean;
  onShowGuide: () => void;
  pillSchedules?: any[];
}

const CombinedCycleView: React.FC<CombinedCycleViewProps> = ({
  todayStatus,
  cycles,
  onRefresh,
  isFirstTimeUser,
  onShowGuide,
  pillSchedules = []
}) => {
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<PeriodDay[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedDateForMood, setSelectedDateForMood] = useState<Date | null>(null);
  const [moodModalSavedSuccessfully, setMoodModalSavedSuccessfully] = useState(false);
  const [hoverMoodData, setHoverMoodData] = useState<{ data: DailyMoodData; date: Date; position: { x: number; y: number } } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Ensure cycles is always an array
  const safeCycles = Array.isArray(cycles) ? cycles : [];

  // Fixed timezone functions - Move up to avoid ReferenceError
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

  // Calculate cycle progress - Use backend data when available
  const calculateCycleProgress = () => {
    try {
      if (!todayStatus || !safeCycles?.length) return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
      
      const latestCycle = safeCycles[0];
      // Use backend's calculated cycle length if available, otherwise default to 28
      const cycleLength = todayStatus.day_in_cycle ? 
        (todayStatus.day_in_cycle > 28 ? todayStatus.day_in_cycle : 28) : 28;
      
      console.log('[CycleProgress] Latest cycle data:', {
        cycleStartDate: latestCycle.cycle_start_date,
        cycleLength: latestCycle.cycle_length,
        usingCycleLength: cycleLength,
        periodDays: latestCycle.period_days?.map(pd => pd.date),
        predictedCycleEnd: latestCycle.predicted_cycle_end
      });
      
      // Use backend data if available
      if (todayStatus.day_in_cycle && todayStatus.cycle_phase) {
        const dayInCycle = todayStatus.day_in_cycle;
        const progress = (dayInCycle / cycleLength) * 100;
        console.log('[CycleProgress] Using backend data:', { dayInCycle, phase: todayStatus.cycle_phase, progress });
        return { progress, dayInCycle, phase: todayStatus.cycle_phase };
      }
      
      // Fallback to frontend calculation
      const cycleStartDate = new Date(latestCycle.cycle_start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      cycleStartDate.setHours(0, 0, 0, 0);
      
      // Calculate days since cycle start
      const daysSinceStart = Math.floor((today.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('[CycleProgress] Debug info:', {
        today: today.toISOString().split('T')[0],
        cycleStartDate: cycleStartDate.toISOString().split('T')[0],
        daysSinceStart,
        cycleLength,
        predictedCycleEnd: latestCycle.predicted_cycle_end
      });
      
      let dayInCycle = 0;
      let progress = 0;
      
      // If today is before cycle start, we're in a previous cycle
      if (daysSinceStart < 0) {
        // Check if we have predicted cycle end from backend
        if (latestCycle.predicted_cycle_end) {
          const predictedEnd = new Date(latestCycle.predicted_cycle_end);
          const totalCycleDays = Math.floor((predictedEnd.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
          dayInCycle = totalCycleDays + daysSinceStart + 1;
          progress = Math.max(0, (dayInCycle / cycleLength) * 100);
        } else {
          return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
        }
      } else {
        // Calculate actual day in cycle (not using modulo)
        dayInCycle = daysSinceStart + 1;
        
        // If we've exceeded the cycle length, we're in the next cycle
        if (dayInCycle > cycleLength) {
          // Check if we have a predicted next cycle start
          if (latestCycle.predicted_cycle_end) {
            const predictedNextStart = new Date(latestCycle.predicted_cycle_end);
            const daysSinceNextStart = Math.floor((today.getTime() - predictedNextStart.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceNextStart >= 0) {
              dayInCycle = daysSinceNextStart + 1;
            } else {
              // We're between cycles, show the last day of current cycle
              dayInCycle = cycleLength;
            }
          } else {
            // No prediction, show the last day of current cycle
            dayInCycle = cycleLength;
          }
        }
        
        progress = (dayInCycle / cycleLength) * 100;
      }
      
      // Ensure dayInCycle is within valid range
      dayInCycle = Math.max(1, Math.min(dayInCycle, cycleLength));
      
      // Determine phase based on day in cycle
      let phase = 'Unknown';
      if (dayInCycle <= 5) {
        phase = 'Menstrual';
      } else if (dayInCycle <= 14) {
        phase = 'Follicular';
      } else if (dayInCycle === 15) {
        phase = 'Ovulation';
      } else {
        phase = 'Luteal';
      }
      
      // Check if today matches any predicted dates from backend
      if (latestCycle.predicted_ovulation_date && isSameDay(today, new Date(latestCycle.predicted_ovulation_date))) {
        phase = 'Ovulation';
      } else if (latestCycle.predicted_fertile_start && latestCycle.predicted_fertile_end) {
        const fertileStart = new Date(latestCycle.predicted_fertile_start);
        const fertileEnd = new Date(latestCycle.predicted_fertile_end);
        if (today >= fertileStart && today <= fertileEnd) {
          phase = 'Fertile';
        }
      }
      
      console.log('[CycleProgress] Frontend calculation result:', { dayInCycle, phase, progress });
      return { progress, dayInCycle, phase };
    } catch (err) {
      console.error('Error in calculateCycleProgress:', err);
      setError('Lỗi khi tính toán tiến trình chu kỳ');
      return { progress: 0, dayInCycle: 0, phase: 'Unknown' };
    }
  };

  const { progress, dayInCycle, phase } = calculateCycleProgress();

  // Debug info
  console.log('[CombinedCycleView] Render state:', {
    cyclesType: typeof cycles,
    cyclesIsArray: Array.isArray(cycles),
    cyclesLength: cycles?.length || 0,
    safeCyclesLength: safeCycles.length,
    todayStatus: !!todayStatus,
    selectedPeriodDaysLength: selectedPeriodDays.length,
    currentMonth: currentMonth.toISOString().split('T')[0]
  });

  // Show loading if cycles is not ready (not an array)
  if (!Array.isArray(cycles)) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <span className="ml-3 text-gray-600">Đang tải dữ liệu chu kỳ...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Menstrual': return 'from-pink-400 to-rose-500';
      case 'Follicular': return 'from-blue-400 to-indigo-500';
      case 'Ovulation': return 'from-yellow-400 to-orange-500';
      case 'Fertile': return 'from-green-400 to-emerald-500';
      case 'Luteal': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'Menstrual': return 'Giai đoạn Kinh nguyệt';
      case 'Follicular': return 'Giai đoạn Nang trứng';
      case 'Ovulation': return 'Giai đoạn Rụng trứng';
      case 'Fertile': return 'Giai đoạn Thụ thai';
      case 'Luteal': return 'Giai đoạn Luteal';
      default: return 'Không xác định';
    }
  };

  const isDateSelected = (date: Date) => {
    try {
      return selectedPeriodDays.some(periodDay => 
        isSameDay(new Date(periodDay.date), date)
      );
    } catch (err) {
      console.error('Error in isDateSelected:', err);
      return false;
    }
  };

  const isPeriodDay = (date: Date) => {
    try {
      if (!safeCycles?.length || !Array.isArray(safeCycles)) return false;
      
      return safeCycles.some(cycle => 
        cycle.period_days?.some(periodDay => 
          isSameDay(new Date(periodDay.date), date)
        )
      );
    } catch (err) {
      console.error('Error in isPeriodDay:', err);
      return false;
    }
  };

  // Thêm các hàm để tính toán dự đoán - sử dụng dữ liệu từ backend
  const isOvulationDay = (date: Date) => {
    try {
      if (!safeCycles?.length || !Array.isArray(safeCycles)) return false;
      
      return safeCycles.some(cycle => 
        cycle.predicted_ovulation_date && 
        isSameDay(new Date(cycle.predicted_ovulation_date), date)
      );
    } catch (err) {
      console.error('Error in isOvulationDay:', err);
      return false;
    }
  };

  const isFertileDay = (date: Date) => {
    try {
      if (!safeCycles?.length || !Array.isArray(safeCycles)) return false;
      
      return safeCycles.some(cycle => {
        if (!cycle.predicted_fertile_start || !cycle.predicted_fertile_end) return false;
        
        const fertileStart = new Date(cycle.predicted_fertile_start);
        const fertileEnd = new Date(cycle.predicted_fertile_end);
        
        return date >= fertileStart && date <= fertileEnd;
      });
    } catch (err) {
      console.error('Error in isFertileDay:', err);
      return false;
    }
  };

  const getPredictedPeriodDays = (): Date[] => {
    if (!safeCycles?.length) return [];
    
    const predictedDays: Date[] = [];
    
    // Lấy tất cả các ngày dự đoán từ các chu kỳ
    safeCycles.forEach(cycle => {
      if (cycle.predicted_cycle_end) {
        const cycleEnd = new Date(cycle.predicted_cycle_end);
        // Tạo 7 ngày dự đoán từ ngày kết thúc chu kỳ
        for (let i = 0; i < 7; i++) {
          const predictedDay = new Date(cycleEnd);
          predictedDay.setDate(cycleEnd.getDate() + i);
          predictedDays.push(predictedDay);
        }
      }
    });
    
    return predictedDays;
  };

  const isPredictedPeriodDay = (date: Date) => {
    const predictedDays = getPredictedPeriodDays();
    return predictedDays.some(predictedDay => isSameDay(date, predictedDay));
  };

  const handleDateClick = (date: Date) => {
    const dateString = getLocalDateString(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Kiểm tra ngày trong tương lai
    if (date > today) {
      // Show toast error
      return;
    }

    if (isDateSelected(date)) {
      // Remove from selection
      setSelectedPeriodDays(prev => 
        prev.filter(periodDay => !isSameDay(new Date(periodDay.date), date))
      );
    } else {
      // Add to selection only - don't open modal yet
      const newPeriodDay: PeriodDay = {
        date: dateString,
        mood_data: {
          mood: 'neutral',
          energy: 'medium',
          symptoms: [],
          notes: ''
        }
      };
      setSelectedPeriodDays(prev => [...prev, newPeriodDay]);
    }
  };

  const handleRemovePeriodDay = async (dateToRemove: Date) => {
    try {
      const updatedSelection = selectedPeriodDays.filter(periodDay => 
        !isSameDay(new Date(periodDay.date), dateToRemove)
      );
      
      setSelectedPeriodDays(updatedSelection);
    } catch (error: any) {
      console.error('Lỗi khi xóa ngày:', error);
    }
  };

  const handleMoodSave = async (moodData: DailyMoodData) => {
    if (!selectedDateForMood) return;

    const dateString = getLocalDateString(selectedDateForMood);
    
    try {
      const response = await menstrualCycleService.updatePeriodDayMood(dateString, moodData);
      
      if (response.success) {
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
        
        await onRefresh();
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu cảm xúc:', error);
    }
  };

  const handleMoodModalClose = () => {
    setShowMoodModal(false);
    setSelectedDateForMood(null);
  };

  const handleOpenMoodModal = (date: Date) => {
    // Check if the date is selected in current session
    const isDateSelected = selectedPeriodDays.some(pd => {
      const pdDate = new Date(pd.date);
      return isSameDay(pdDate, date);
    });
    
    // Check if the date exists in saved cycles
    const isDateSaved = safeCycles.some(cycle => 
      cycle.period_days?.some(pd => {
        const pdDate = new Date(pd.date);
        return isSameDay(pdDate, date);
      })
    );
    
    if (!isDateSelected && !isDateSaved) {
      alert('Vui lòng chọn ngày này trước khi ghi mood!');
      return;
    }
    
    setSelectedDateForMood(date);
    setShowMoodModal(true);
  };

  const clearSelection = () => {
    setSelectedPeriodDays([]);
  };

  const validatePeriodDays = (periodDays: PeriodDay[]): { isValid: boolean; message?: string } => {
    if (periodDays.length === 0) {
      return { isValid: false, message: 'Vui lòng chọn ít nhất một ngày kinh nguyệt!' };
    }

    // Validate period length (1-7 days is more flexible)
    if (periodDays.length < 1 || periodDays.length > 7) {
      return { 
        isValid: false, 
        message: `Kỳ kinh nguyệt phải từ 1-7 ngày (hiện tại: ${periodDays.length} ngày)!` 
      };
    }

    // Validate consecutive days
    const sortedDays = periodDays
      .map(pd => new Date(pd.date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 1; i < sortedDays.length; i++) {
      const diffMs = sortedDays[i].getTime() - sortedDays[i-1].getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays !== 1) {
        return { isValid: false, message: 'Các ngày trong cùng kỳ kinh phải liên tục!' };
      }
    }

    // Validate time range (not too far in past/future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const periodDay of periodDays) {
      const dayDate = new Date(periodDay.date);
      if (dayDate > today) {
        return { isValid: false, message: 'Không thể chọn ngày trong tương lai!' };
      }
      if (dayDate < sixMonthsAgo) {
        return { isValid: false, message: 'Không thể chọn ngày quá xa trong quá khứ (tối đa 6 tháng)!' };
      }
    }
    
    return { isValid: true };
  };

  const saveCycle = async () => {
    const validation = validatePeriodDays(selectedPeriodDays);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setIsSaving(true);
    
    try {
      // Debug: Log the actual data being sent
      console.log('[CombinedCycleView] saveCycle - selectedPeriodDays:', selectedPeriodDays);
      console.log('[CombinedCycleView] saveCycle - selectedPeriodDays types:', selectedPeriodDays.map(pd => ({
        date: pd.date,
        dateType: typeof pd.date,
        moodDataType: typeof pd.mood_data
      })));

      const request: ProcessCycleWithMoodRequest = {
        period_days: selectedPeriodDays
      };

      console.log('[CombinedCycleView] saveCycle - request:', request);

      const response = await menstrualCycleService.processCycleWithMood(request);

      console.log('[CombinedCycleView] saveCycle - response:', response);
      
      if (response.success) {
        console.log('[CombinedCycleView] saveCycle - success, data:', response.data);
        setSelectedPeriodDays([]);
        await onRefresh();
        alert('Lưu chu kì thành công!');
      } else {
        console.error('[CombinedCycleView] saveCycle - error:', response.message);
        alert('Lỗi khi lưu chu kì: ' + (response.message || 'Không xác định'));
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu chu kì:', error);
      alert('Lỗi khi lưu chu kì: ' + (error.message || 'Không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  const getMoodDataForDate = (date: Date): DailyMoodData => {
    const dateString = getLocalDateString(date);
    
    // First check in selectedPeriodDays (frontend state)
    const selectedPeriodDay = selectedPeriodDays.find(pd => pd.date === dateString);
    if (selectedPeriodDay?.mood_data) {
      return selectedPeriodDay.mood_data;
    }
    
    // Then check in cycles (backend data)
    if (safeCycles && safeCycles.length > 0) {
      for (const cycle of safeCycles) {
        const periodDay = cycle.period_days?.find(pd => {
          const pdDate = new Date(pd.date);
          return isSameDay(pdDate, date);
        });
        if (periodDay?.mood_data) {
          return periodDay.mood_data;
        }
      }
    }
    
    // Default mood data
    return {
      mood: 'neutral',
      energy: 'medium',
      symptoms: [],
      notes: ''
    };
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Enhanced calendar render with navigation
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

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
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <FaChevronRight className="w-4 h-4" />
          </Button>
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
            const isSelected = isDateSelected(date);
            const isPeriod = isPeriodDay(date);
            const isOvulation = isOvulationDay(date);
            const isFertile = isFertileDay(date);
            const isPredicted = isPredictedPeriodDay(date);
            const moodData = getMoodDataForDate(date);
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                onMouseEnter={(e) => {
                  if (moodData && moodData.mood !== 'neutral') {
                    setHoverMoodData({
                      data: moodData,
                      date: date,
                      position: { x: e.clientX, y: e.clientY }
                    });
                  }
                }}
                onMouseLeave={() => setHoverMoodData(null)}
                className={`
                  aspect-square text-xs p-1 cursor-pointer rounded-md border transition-all relative
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' : ''}
                  ${isPeriod && !isSelected ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white' : ''}
                  ${isOvulation && !isSelected ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' : ''}
                  ${isFertile && !isSelected ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white' : ''}
                  ${isPredicted && !isSelected ? 'bg-gradient-to-br from-blue-400 to-indigo-400 text-white' : ''}
                  ${!isCurrentMonth ? 'bg-gray-50' : 'hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center justify-center h-full">
                  {date.getDate()}
                </div>
                {/* Mood indicator dot */}
                {moodData && moodData.mood !== 'neutral' && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-yellow-400"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Error Display */}
      {error && (
        <div className="lg:col-span-3">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-sm font-medium">⚠️ Lỗi:</span>
                <span className="text-sm">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Left Column - Cycle Progress Circle */}
      <div className="lg:col-span-1 order-1 lg:order-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaChartBar className="text-pink-500" />
              Tiến trình chu kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            {/* Progress Circle */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <div 
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, #ec4899 0deg, #8b5cf6 ${progress * 3.6}deg, #e5e7eb ${progress * 3.6}deg, #e5e7eb 360deg)`
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{dayInCycle}</span>
                    <span className="text-xs text-gray-600">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Info */}
            <div className="text-center">
              <Badge className={`bg-gradient-to-r ${getPhaseColor(phase)} text-white mb-2`}>
                {getPhaseText(phase)}
              </Badge>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Ngày {dayInCycle} / {todayStatus?.day_in_cycle && todayStatus.day_in_cycle > 28 ? todayStatus.day_in_cycle : 28}
                </p>
                <p className="text-xs text-gray-500">
                  Chu kỳ {todayStatus?.day_in_cycle && todayStatus.day_in_cycle > 28 ? todayStatus.day_in_cycle : 28} ngày
                  {todayStatus?.day_in_cycle && todayStatus.day_in_cycle > 28 && (
                    <span className="text-blue-600 ml-1">(cá nhân)</span>
                  )}
                </p>
                {safeCycles?.[0]?.period_days?.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Kinh nguyệt {safeCycles[0].period_days.length} ngày
                  </p>
                )}
              </div>
            </div>

            {/* Today Status */}
            {todayStatus && (
              <div className="w-full space-y-3">
                <h4 className="font-semibold text-gray-700">Hôm nay:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Trạng thái:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {todayStatus.is_period_day ? 'Đang có kinh' : 
                       todayStatus.is_ovulation_day ? 'Rụng trứng' :
                       todayStatus.is_fertile_day ? 'Thụ thai' : 'Bình thường'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Khả năng thai:</span>
                    <Badge className={
                      todayStatus.pregnancy_chance === 'high' ? 'bg-red-100 text-red-800' :
                      todayStatus.pregnancy_chance === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {todayStatus.pregnancy_chance === 'high' ? 'Cao' :
                       todayStatus.pregnancy_chance === 'medium' ? 'Trung bình' : 'Thấp'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
          </CardContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chú thích</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded"></div>
                  <span>Ngày kinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded"></div>
                  <span>Đã chọn</span>
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
              </div>
            </CardContent>
          </Card>

        </Card>
      </div>

      {/* Right Column - Notes and Guide */}
      <div className="lg:col-span-1 order-3 lg:order-3">
        <div className="space-y-4">
          {/* Selected days summary - Moved here to avoid overlap */}
          {selectedPeriodDays.length > 0 && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FaCalendarAlt className="text-purple-500" />
                  Đã chọn ({selectedPeriodDays.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedPeriodDays.map((periodDay, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200 shadow-sm"
                    >
                      <span 
                        className="text-xs font-medium text-gray-700 cursor-pointer hover:text-purple-600"
                        onClick={() => handleOpenMoodModal(new Date(periodDay.date))}
                        title="Click để ghi mood"
                      >
                        {new Date(periodDay.date).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMoodModal(new Date(periodDay.date))}
                          className="text-blue-500 hover:text-blue-700 p-1 h-6 w-6"
                          title="Ghi mood"
                        >
                          <FaEdit className="text-xs" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePeriodDay(new Date(periodDay.date))}
                          className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
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
                    className="text-gray-600 hover:text-gray-800 flex-1 text-xs"
                  >
                    <FaTimes className="mr-1" />
                    Xóa tất cả
                  </Button>
                  <Button
                    onClick={saveCycle}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white flex-1 text-xs"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
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
              </CardContent>
            </Card>
          )}

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
                <li>• Chọn <strong>1-7 ngày liên tục</strong></li>
                <li>• Các ngày phải <strong>liên tục</strong></li>
                <li>• Chỉ chọn ngày trong <strong>quá khứ</strong></li>
                <li>• Click vào ngày để chọn</li>
                <li>• Click vào tên ngày để ghi mood</li>
                <li>• Có thể ghi mood trước khi lưu chu kỳ</li>
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



          {/* Legend */}
         
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

      {/* Mood Modal */}
      {showMoodModal && selectedDateForMood && (
        <MoodDataModal
          isOpen={showMoodModal}
          onClose={handleMoodModalClose}
          date={selectedDateForMood ? getLocalDateString(selectedDateForMood) : ''}
          existingMoodData={selectedDateForMood ? getMoodDataForDate(selectedDateForMood) : undefined}
          onSave={() => {
            setMoodModalSavedSuccessfully(true);
            setTimeout(() => setMoodModalSavedSuccessfully(false), 3000);
            onRefresh(); // Refresh to get updated data
          }}
        />
      )}

      {/* Mood Data Tooltip */}
      {hoverMoodData && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
          style={{
            left: hoverMoodData.position.x + 10,
            top: hoverMoodData.position.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-xs">
            <div className="font-medium text-gray-900 mb-2">
              {hoverMoodData.date.toLocaleDateString('vi-VN')}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tâm trạng:</span>
                <span className="font-medium">
                  {hoverMoodData.data.mood === 'happy' ? '😊 Vui vẻ' :
                   hoverMoodData.data.mood === 'sad' ? '😢 Buồn' :
                   hoverMoodData.data.mood === 'tired' ? '😴 Mệt mỏi' :
                   hoverMoodData.data.mood === 'excited' ? '🤩 Hồi hộp' :
                   hoverMoodData.data.mood === 'calm' ? '😌 Bình tĩnh' :
                   hoverMoodData.data.mood === 'stressed' ? '😰 Căng thẳng' :
                   '😐 Bình thường'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Năng lượng:</span>
                <span className="font-medium">
                  {hoverMoodData.data.energy === 'high' ? '⚡ Cao' :
                   hoverMoodData.data.energy === 'medium' ? '🔋 Trung bình' :
                   '🔋 Thấp'}
                </span>
              </div>
              {hoverMoodData.data.symptoms && hoverMoodData.data.symptoms.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Triệu chứng:</span>
                  <span className="font-medium text-xs">
                    {hoverMoodData.data.symptoms.slice(0, 2).join(', ')}
                    {hoverMoodData.data.symptoms.length > 2 && '...'}
                  </span>
                </div>
              )}
              {hoverMoodData.data.notes && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Ghi chú:</span>
                  <span className="font-medium text-xs">
                    {hoverMoodData.data.notes.length > 30 
                      ? hoverMoodData.data.notes.substring(0, 30) + '...'
                      : hoverMoodData.data.notes}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedCycleView; 
 