import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/Input';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaSave, FaTrash, FaEdit, FaBug } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { CycleData, menstrualCycleService } from '../../../services/menstrualCycleService';
import { toast } from 'react-hot-toast';
import MoodModal from './MoodModal';

interface CycleCalendarProps {
  cycles: CycleData[];
  onRefresh: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isPeriodDay: boolean;
  isOvulationDay: boolean;
  isFertileDay: boolean;
  isPredictedPeriod: boolean;
  isPredictedOvulation: boolean;
  isPredictedFertile: boolean;
  isToday: boolean;
  isSelected: boolean; // For new period tracking
  intensity?: 'light' | 'medium' | 'heavy';
}

interface MoodData {
  mood: string;
  energy: string;
  symptoms: string[];
  notes?: string;
}

const CycleCalendar: React.FC<CycleCalendarProps> = ({ cycles, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<Date[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedDateForMood, setSelectedDateForMood] = useState<Date | null>(null);
  const [dayMoodData, setDayMoodData] = useState<{[key: string]: MoodData}>({});
  const [debugMode, setDebugMode] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [moodModalSavedSuccessfully, setMoodModalSavedSuccessfully] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<{[key: string]: number}>({});
  const [pendingRemoval, setPendingRemoval] = useState<Date | null>(null);

  const currentCycle = cycles.length > 0 ? cycles[0] : null;

  // Helper function to parse notes with mood data
  const parseNotesWithMood = (notes?: string) => {
    if (!notes) return { userNotes: '', moodData: null };
    
    try {
      const parsed = JSON.parse(notes);
      if (parsed.user_notes !== undefined && parsed.mood_data) {
        return {
          userNotes: parsed.user_notes || '',
          moodData: parsed.mood_data
        };
      }
    } catch (e) {
      // If not JSON, treat as regular notes
    }
    
    return { userNotes: notes, moodData: null };
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateInRange = (date: Date, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);
    return date >= start && date <= end;
  };

  const isDateSelected = (date: Date) => {
    return selectedPeriodDays.some(selectedDate => isSameDay(selectedDate, date));
  };

  const handleDayClick = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    
    // Kiểm tra xem ngày này có phải là ngày period hiện có không
    const isExistingPeriodDay = cycles.some(cycle => cycle.period_days.includes(dateKey));
    const isSelectedDay = selectedPeriodDays.some(selectedDate => selectedDate.toISOString().split('T')[0] === dateKey);
    const currentTime = Date.now();
    
    if (isExistingPeriodDay) {
      // Xử lý double click cho ngày period đã lưu
      if (lastClickTime && dateKey === Object.keys(lastClickTime)[0] && currentTime - lastClickTime[dateKey] < 400) {
        // Double-click detected - xóa ngày khỏi database
        setPendingRemoval(date);
        setShowMoodModal(true);
      } else {
        // Single click - hiển thị instruction
        setPendingRemoval(date);
        setTimeout(() => setPendingRemoval(null), 3000);
      }
    } else if (isSelectedDay) {
      // Xử lý double click cho ngày đã chọn (chưa lưu)
      if (lastClickTime && dateKey === Object.keys(lastClickTime)[0] && currentTime - lastClickTime[dateKey] < 400) {
        // Double-click detected - xóa khỏi selection
        setSelectedPeriodDays(prev => prev.filter(d => d.toISOString().split('T')[0] !== dateKey));
        
        // Xóa mood data nếu có
        setDayMoodData(prev => {
          const newData = { ...prev };
          delete newData[dateKey];
          return newData;
        });
      } else {
        // Single click - hiển thị instruction
        setPendingRemoval(date);
        setTimeout(() => setPendingRemoval(null), 3000);
      }
    } else {
      // Ngày mới - thêm vào selection và mở mood modal
      setSelectedPeriodDays(prev => [...prev, date]);
      setSelectedDateForMood(date);
      setShowMoodModal(true);
    }
    
    setLastClickTime(prev => ({
      ...prev,
      [dateKey]: currentTime
    }));
  };

  const clearSelection = () => {
    setSelectedPeriodDays([]);
    setNotes('');
    setSelectedDay(null);
    setDayMoodData({});
    setLastClickTime({});
    setPendingRemoval(null);
  };

  const handleRemoveFromDatabase = async (dateToRemove: Date) => {
    setIsSaving(true);
    
    try {
      const dateToRemoveStr = dateToRemove.toISOString().split('T')[0];
      
      const existingCyclesResponse = await menstrualCycleService.getCycles();
      
      if (!existingCyclesResponse.success || !existingCyclesResponse.data) {
        toast.error('Không thể tải dữ liệu chu kì hiện tại');
        return;
      }

      let allExistingPeriodDays: string[] = [];
      existingCyclesResponse.data.forEach(cycle => {
        if (cycle.period_days && Array.isArray(cycle.period_days)) {
          cycle.period_days.forEach(day => {
            const dayStr = new Date(day).toISOString().split('T')[0];
            if (!allExistingPeriodDays.includes(dayStr)) {
              allExistingPeriodDays.push(dayStr);
            }
          });
        }
      });

      const updatedPeriodDays = allExistingPeriodDays.filter(day => day !== dateToRemoveStr);

      if (updatedPeriodDays.length === allExistingPeriodDays.length) {
        toast.error('Không tìm thấy ngày cần xóa trong dữ liệu');
        return;
      }

      const requestData = {
        period_days: updatedPeriodDays,
        notes: undefined // Giữ notes cũ hoặc để undefined
      };

      const response = await menstrualCycleService.processCycle(requestData);

      if (response && response.success) {
        toast.success(`Đã xóa ngày ${dateToRemove.toLocaleDateString('vi-VN')} khỏi chu kì`);
        
        // Reset pending removal state
        setPendingRemoval(null);
        setLastClickTime(prev => {
          const newTimes = { ...prev };
          delete newTimes[dateToRemoveStr];
          return newTimes;
        });
        
        // Refresh data
        onRefresh();
      } else {
        toast.error('Có lỗi khi xóa ngày khỏi chu kì');
      }
    } catch (error: any) {
      toast.error('Lỗi khi xóa ngày khỏi chu kì');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoodSave = (moodData: MoodData) => {
    if (!selectedDateForMood) return;
    
    const dateKey = selectedDateForMood.toISOString().split('T')[0];
    
    // Cập nhật mood data
    setDayMoodData(prev => {
      const newData = {
        ...prev,
        [dateKey]: moodData
      };
      return newData;
    });
    
    // Đánh dấu là đã lưu thành công TRƯỚC KHI đóng modal
    setMoodModalSavedSuccessfully(true);
    setShowMoodModal(false);
    setSelectedDateForMood(null);
  };

  const handleMoodModalClose = () => {
    if (!moodModalSavedSuccessfully && selectedDateForMood) {
      // User cancelled without saving - remove day from selection
      const dateKey = selectedDateForMood.toISOString().split('T')[0];
      setSelectedPeriodDays(prev => prev.filter(d => d.toISOString().split('T')[0] !== dateKey));
    } else if (moodModalSavedSuccessfully) {
      // User saved successfully - keeping day in selection
    }
    
    // Reset all modal-related state
    setShowMoodModal(false);
    setSelectedDateForMood(null);
    setMoodModalSavedSuccessfully(false); // Reset flag
  };

  const saveCycle = async () => {
    if (selectedPeriodDays.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ngày có kinh');
      return;
    }

    setIsSaving(true);
    
    try {
      // Lấy dữ liệu cũ từ API
      let allExistingPeriodDays: string[] = [];
      let combinedNotes = notes;
      
             try {
         const existingResponse = await menstrualCycleService.getCycles();
         if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
           // Lấy từ cycle đầu tiên
           const firstCycle = existingResponse.data[0];
           allExistingPeriodDays = firstCycle.period_days || [];
           combinedNotes = firstCycle.notes || notes;
         }
       } catch (error) {
         // Nếu chưa có dữ liệu cũ thì bỏ qua
       }
      
      // Thêm ngày mới vào danh sách cũ
      const newPeriodDays = selectedPeriodDays
        .sort((a, b) => a.getTime() - b.getTime())
        .map(date => date.toISOString().split('T')[0]);
      const allPeriodDays = [...new Set([...allExistingPeriodDays, ...newPeriodDays])].sort();
      
      const requestData = {
        period_days: allPeriodDays,
        notes: combinedNotes,
        dayMoodData: {
          ...dayMoodData
        }
      };
      
      const response = await menstrualCycleService.processCycle(requestData);
      
      if (response && response.success) {
        clearSelection();
        onRefresh();
        toast.success('Đã ghi nhận chu kì thành công!');
      } else {
        const errorMsg = response?.message || 'Có lỗi xảy ra khi lưu chu kì';
        toast.error(errorMsg);
      }
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi lưu chu kì';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến server';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Debug API Test Function
  const testApiConnection = async () => {
    setTestResult('Đang test API connection...');
    
    try {
      // Test 1: Check API endpoint availability
      
      // Test với dữ liệu sample
      const testData = {
        period_days: [new Date().toISOString().split('T')[0]],
        notes: 'Test API connection'
      };
      
      setTestResult('Đang gửi request test...');
      
      const response = await menstrualCycleService.processCycle(testData);
      
      
      if (response && response.success) {
        setTestResult('✅ API hoạt động bình thường! Response: ' + JSON.stringify(response, null, 2));
        onRefresh(); // Refresh to see test data
      } else {
        setTestResult('⚠️ API phản hồi nhưng không thành công: ' + JSON.stringify(response, null, 2));
      }
    } catch (error: any) {

      let errorDetails = '';
      if (error?.response) {
        errorDetails = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
      } else if (error?.request) {
        errorDetails = 'Không nhận được phản hồi từ server. Server có thể không chạy.';
      } else {
        errorDetails = error.message || 'Unknown error';
      }
    
      setTestResult(`❌ API Test thất bại: ${errorDetails}`);
    }
  };

  // Detailed Flow Analysis Function
  const analyzeUpdateFlow = () => {
    const flowAnalysis = `
🔍 LUỒNG UPDATE LỊCH CHU KÌ - PHÂN TÍCH CHI TIẾT:

📋 FRONTEND FLOW:
1. User chọn ngày trong lịch (handleDayClick)
2. Ngày được thêm vào selectedPeriodDays state
3. MoodModal hiển thị để người dùng nhập tâm trạng
4. User nhấn "Lưu chu kì" → gọi saveCycle()
5. saveCycle() chuẩn bị dữ liệu và gọi API

📤 API CALL:
- Endpoint: POST /api/menstrual-cycle/processMenstrualCycle  
- Headers: Authorization Bearer token
- Body: { period_days: ['2025-06-25'], notes: 'mood data...' }

🔧 BACKEND FLOW:
1. Controller: menstrualCycleController.ts
   - Authenticate user (JWT middleware)
   - Extract user_id from token
   - Parse period_days và notes
   - Call MenstrualCycleService.processPeriodDays()

2. Service: menstrualCycleService.ts  
   - Sort và group period_days theo ngày liên tiếp
   - Tính cycle_length dựa trên chu kì trước
   - Predict ovulation, fertile window, next period
   - Delete old cycles của user
   - Insert new cycles vào database

3. Repository: menstrualCycleRepository.ts
   - deleteCyclesByUser() - xóa data cũ
   - insertCycles() - lưu data mới

📥 RESPONSE FLOW:
- Backend trả về: { success: true, data: cycles[] }
- Frontend nhận response
- Gọi onRefresh() để reload data
- CycleCalendar re-render với data mới

🚨 POTENTIAL ISSUES:
- Auth token expired/missing
- Backend server not running  
- Database connection issues
- Date format mismatch
- Network connectivity
- CORS configuration

💡 CURRENT STATE:
- Selected Days: ${selectedPeriodDays.length}
- Auth Token: ${localStorage.getItem('gencare_auth_token') ? 'Present' : 'Missing'}
- Current Cycles: ${cycles.length}
- Backend URL: /api/menstrual-cycle/processMenstrualCycle
    `;
    
    setTestResult(flowAnalysis);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isPeriodDay: false,
        isOvulationDay: false,
        isFertileDay: false,
        isPredictedPeriod: false,
        isPredictedOvulation: false,
        isPredictedFertile: false,
        isToday: isSameDay(date, today),
        isSelected: isDateSelected(date)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      let isPeriodDay = false;
      let isOvulationDay = false;
      let isFertileDay = false;
      let isPredictedPeriod = false;
      let isPredictedOvulation = false;
      let isPredictedFertile = false;

      // Check actual data from cycles
      cycles.forEach(cycle => {
        cycle.period_days.forEach(periodDay => {
          if (isSameDay(date, new Date(periodDay))) {
            isPeriodDay = true;
          }
        });
      });

      // Check predictions from current cycle
      if (currentCycle) {
        if (currentCycle.predicted_ovulation_date && 
            isSameDay(date, new Date(currentCycle.predicted_ovulation_date))) {
          if (date > today) {
            isPredictedOvulation = true;
          } else {
            isOvulationDay = true;
          }
        }

        if (currentCycle.predicted_fertile_start && currentCycle.predicted_fertile_end &&
            isDateInRange(date, currentCycle.predicted_fertile_start, currentCycle.predicted_fertile_end)) {
          if (date > today) {
            isPredictedFertile = true;
          } else {
            isFertileDay = true;
          }
        }

        if (currentCycle.predicted_cycle_end && 
            isSameDay(date, new Date(currentCycle.predicted_cycle_end))) {
          if (date > today) {
            isPredictedPeriod = true;
          }
        }
      }

      days.push({
        date,
        isCurrentMonth: true,
        isPeriodDay,
        isOvulationDay,
        isFertileDay,
        isPredictedPeriod,
        isPredictedOvulation,
        isPredictedFertile,
        isToday: isSameDay(date, today),
        isSelected: isDateSelected(date)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isPeriodDay: false,
        isOvulationDay: false,
        isFertileDay: false,
        isPredictedPeriod: false,
        isPredictedOvulation: false,
        isPredictedFertile: false,
        isToday: isSameDay(date, today),
        isSelected: isDateSelected(date)
      });
    }

    return days;
  }, [currentDate, cycles, currentCycle, selectedPeriodDays]);

  const getDayStyles = (day: CalendarDay) => {
    let baseClasses = "w-full h-10 sm:h-12 flex items-center justify-center text-sm rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden border-2 border-transparent touch-manipulation ";
    
    if (!day.isCurrentMonth) {
      baseClasses += "text-gray-300 hover:bg-gray-50 ";
    } else {
      baseClasses += "text-gray-900 hover:scale-105 active:scale-95 ";
    }

    // Check if this day is pending removal (user clicked once)
    const isPendingRemoval = pendingRemoval && isSameDay(day.date, pendingRemoval);

    // Selected for new period (highest priority)
    if (day.isSelected) {
      if (isPendingRemoval) {
        baseClasses += "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg ring-2 ring-orange-300 ring-offset-2 animate-pulse ";
      } else {
        baseClasses += "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg ring-2 ring-pink-300 ring-offset-2 ";
      }
    }
    // Existing period days
    else if (day.isPeriodDay) {
      if (isPendingRemoval) {
        baseClasses += "bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg ring-2 ring-red-300 ring-offset-2 animate-pulse hover:shadow-xl ";
      } else {
        baseClasses += "bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg hover:shadow-xl ";
      }
    } else if (day.isOvulationDay) {
      baseClasses += "bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg hover:shadow-xl ";
    } else if (day.isFertileDay) {
      baseClasses += "bg-gradient-to-br from-purple-200 to-pink-300 text-purple-800 shadow-md hover:shadow-lg ";
    } 
    // Predictions with dotted styles
    else if (day.isPredictedPeriod) {
      baseClasses += "bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 border-2 border-dashed border-pink-400 hover:bg-pink-100 ";
    } else if (day.isPredictedOvulation) {
      baseClasses += "bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 border-2 border-dashed border-purple-400 hover:bg-purple-100 ";
    } else if (day.isPredictedFertile) {
      baseClasses += "bg-gradient-to-br from-purple-25 to-pink-25 text-purple-600 border border-dashed border-purple-300 hover:bg-purple-50 ";
    } else {
      baseClasses += "hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 hover:border-pink-300 hover:bg-pink-50 ";
    }

    // Today highlight
    if (day.isToday) {
      baseClasses += "ring-3 ring-pink-400 ring-offset-2 ";
    }

    return baseClasses;
  };

  const getDayContent = (day: CalendarDay) => {
    return (
      <div className="relative w-full h-full flex items-center justify-center group">
        <span className="relative z-10 font-medium">{day.date.getDate()}</span>
        
        {/* Sparkle effect for special days */}
        {(day.isPeriodDay || day.isOvulationDay || day.isSelected) && (
          <HiSparkles className="absolute top-1 right-1 h-2 w-2 text-white/70" />
        )}
        
        {/* Prediction indicator */}
        {(day.isPredictedPeriod || day.isPredictedOvulation || day.isPredictedFertile) && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full opacity-60"></div>
        )}

        {/* Selection indicator */}
        {day.isSelected && (
          <div className="absolute inset-0 border-2 border-white/50 rounded-xl"></div>
        )}

        {/* Hover tooltip */}
        {day.isCurrentMonth && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
            {getTooltipContent(day)}
          </div>
        )}

        {/* Click indicator */}
        <div className="absolute inset-0 bg-pink-200 opacity-0 group-active:opacity-30 transition-opacity duration-150 rounded-xl"></div>
      </div>
    );
  };

  const getTooltipContent = (day: CalendarDay) => {
    const isPendingRemoval = pendingRemoval && isSameDay(day.date, pendingRemoval);
    
    if (day.isSelected) {
      if (isPendingRemoval) {
        return 'Nhấn đúp để bỏ chọn ngày này';
      }
      return 'Ngày đã chọn - Nhấn đúp để bỏ chọn';
    }
    if (day.isPeriodDay) {
      if (isPendingRemoval) {
        return 'Nhấn đúp để xóa ngày này khỏi chu kì';
      }
      return 'Ngày có kinh - Nhấn đúp để xóa';
    }
    if (day.isOvulationDay) return 'Ngày rụng trứng';
    if (day.isFertileDay) return 'Cửa sổ sinh sản';
    if (day.isPredictedPeriod) return 'Dự đoán kinh nguyệt';
    if (day.isPredictedOvulation) return 'Dự đoán rụng trứng';
    if (day.isPredictedFertile) return 'Dự đoán cửa sổ sinh sản';
    return 'Click để chọn ngày có kinh';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header - Always Active */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={`bg-gradient-to-r ${selectedPeriodDays.length > 0 ? 'from-pink-600 via-purple-500 to-indigo-700' : 'from-pink-500 via-purple-500 to-indigo-600'} p-6`}>
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaCalendarAlt className="h-6 w-6" />
                Lịch Chu Kì
                {selectedPeriodDays.length > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 ml-2">
                    <FaEdit className="h-3 w-3 mr-1" />
                    {selectedPeriodDays.length} ngày đã chọn
                  </Badge>
                )}
              </h2>
              <p className="text-white/90 mt-1">
                {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                {selectedPeriodDays.length === 0 && (
                  <span className="ml-2">• Click vào ngày để ghi nhận chu kì</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="text-white hover:bg-white/20 border border-white/20"
              >
                <FaChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-white hover:bg-white/20 border border-white/20 px-4"
              >
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="text-white hover:bg-white/20 border border-white/20"
              >
                <FaChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Button - Fixed Position */}
        <div className="fixed top-20 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
            className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 bg-yellow-50 shadow-lg"
          >
            <FaBug className="h-3 w-3 mr-1" />
            {debugMode ? 'Ẩn Debug' : 'Debug API'}
          </Button>
        </div>

        {/* Period Input Controls - Always Visible */}
        {selectedPeriodDays.length > 0 && (
          <div className="p-4 bg-pink-50 border-b space-y-4">
            {/* Period Selection Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-pink-800">Ghi nhận chu kì mới</h3>
                <p className="text-sm text-pink-600">
                  Đã chọn: {selectedPeriodDays.length} ngày kinh
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearSelection}
                  className="border-gray-300"
                >
                  <FaTrash className="h-3 w-3 mr-1" />
                  Xóa
                </Button>
                <Button 
                  onClick={saveCycle}
                  disabled={selectedPeriodDays.length === 0 || isSaving}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <FaSave className="h-3 w-3 mr-1" />
                  {isSaving ? 'Đang lưu...' : 'Lưu chu kì'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDebugMode(!debugMode)}
                  className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                >
                  <FaBug className="h-3 w-3 mr-1" />
                  Debug
                </Button>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <Input
                placeholder="Ghi chú cho chu kì này (tùy chọn)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            {/* Selected dates preview */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-pink-700">Ngày đã chọn:</span>
              {selectedPeriodDays
                .sort((a, b) => a.getTime() - b.getTime())
                .map((date, index) => {
                  const dateKey = date.toISOString().split('T')[0];
                  const hasMoodData = dayMoodData[dateKey];
                  return (
                    <Badge key={index} className={`${hasMoodData ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-pink-100 text-pink-800 border-pink-200'}`}>
                      {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      {hasMoodData && ' 💝'}
                    </Badge>
                  );
                })
              }
            </div>
          </div>
        )}

        <CardContent className="p-6">
          {/* Enhanced Legend */}
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl">
            <h4 className="font-semibold mb-3 text-gray-800">Hướng dẫn sử dụng:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              {selectedPeriodDays.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-sm ring-1 ring-pink-300"></div>
                  <span className="font-medium">Đang chọn</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg shadow-sm"></div>
                <span className="font-medium">Kinh nguyệt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg shadow-sm"></div>
                <span className="font-medium">Rụng trứng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-200 to-pink-300 rounded-lg shadow-sm"></div>
                <span className="font-medium">Cửa sổ sinh sản</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-pink-50 border-2 border-dashed border-pink-400 rounded-lg"></div>
                <span className="font-medium">Dự đoán</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>💡 <strong>Mẹo sử dụng:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Click</strong> vào ngày để chọn kinh nguyệt mới</li>
                <li><strong>Nhấn đúp</strong> vào ngày đã chọn để bỏ chọn</li>
                <li><strong>Nhấn đúp</strong> vào ngày đã lưu để xóa khỏi database</li>
              </ul>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="w-full">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={getDayStyles(day)}
                  title={getTooltipContent(day)}
                  onClick={() => handleDayClick(day.date)}
                >
                  {getDayContent(day)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Cycle Info - Always Visible */}
      {currentCycle && selectedPeriodDays.length === 0 && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Chu Kì Hiện Tại</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/50 backdrop-blur rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">Dữ liệu đã ghi nhận:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Ngày có kinh: {currentCycle.period_days.length} ngày
                      </span>
                    </div>
                    {currentCycle.cycle_length && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          Độ dài chu kì: {currentCycle.cycle_length} ngày
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/50 backdrop-blur rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">Dự đoán:</h4>
                  <div className="space-y-2 text-sm">
                    {currentCycle.predicted_ovulation_date && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-dashed border-purple-300 rounded-full"></div>
                        <span className="font-medium">
                          Rụng trứng: {new Date(currentCycle.predicted_ovulation_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                    {currentCycle.predicted_fertile_start && currentCycle.predicted_fertile_end && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-200 to-pink-300 border-2 border-dashed border-purple-300 rounded-full"></div>
                        <span className="font-medium">
                          Cửa sổ sinh sản: {new Date(currentCycle.predicted_fertile_start).toLocaleDateString('vi-VN')} - {new Date(currentCycle.predicted_fertile_end).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                    {currentCycle.predicted_cycle_end && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-pink-200 to-rose-300 border-2 border-dashed border-pink-300 rounded-full"></div>
                        <span className="font-medium">
                          Chu kì tiếp theo: {new Date(currentCycle.predicted_cycle_end).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {currentCycle.notes && (
              <div className="mt-4 space-y-4">
                {(() => {
                  const { userNotes, moodData } = parseNotesWithMood(currentCycle.notes);
                  return (
                    <>
                      {userNotes && (
                        <div className="p-4 bg-yellow-100/50 backdrop-blur rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Ghi chú:</strong> {userNotes}
                          </p>
                        </div>
                      )}
                      {moodData && (
                        <div className="p-4 bg-purple-100/50 backdrop-blur rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-3">Dữ liệu tâm trạng:</h4>
                          <div className="space-y-3">
                            {Object.entries(moodData).map(([date, mood]: [string, any]) => (
                              <div key={date} className="bg-white/50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-purple-700">
                                    {new Date(date).toLocaleDateString('vi-VN')}
                                  </span>
                                  <div className="flex gap-2">
                                    {mood.mood && (
                                      <Badge className="bg-pink-100 text-pink-800 text-xs">
                                        {mood.mood}
                                      </Badge>
                                    )}
                                    {mood.energy && (
                                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                                        {mood.energy}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {mood.symptoms && mood.symptoms.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {mood.symptoms.map((symptom: string, idx: number) => (
                                      <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs">
                                        {symptom}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {mood.notes && (
                                  <p className="text-xs text-purple-600 italic">"{mood.notes}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Selected Day Details */}
      {selectedDay && selectedPeriodDays.length === 0 && (
        <Card className="border-2 border-pink-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HiSparkles className="h-5 w-5 text-pink-500" />
              Chi tiết ngày {selectedDay.date.toLocaleDateString('vi-VN')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-pink-800 font-medium">
                {getTooltipContent(selectedDay)}
              </p>
              {selectedDay.isToday && (
                <Badge className="mt-2 bg-pink-100 text-pink-800">
                  Hôm nay
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel */}
      {debugMode && (
        <Card className="border-2 border-yellow-300 shadow-lg">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <FaBug className="h-5 w-5" />
              Debug Panel - API Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={testApiConnection}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Test API Connection
                </Button>
                <Button 
                  onClick={analyzeUpdateFlow}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Analyze Update Flow
                </Button>
                <Button 
                  onClick={() => setTestResult('')}
                  size="sm"
                  variant="outline"
                >
                  Clear Results
                </Button>
              </div>
              
              {testResult && (
                <div className="bg-white p-3 rounded border border-gray-300">
                  <strong className="text-sm">Test Result:</strong>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border max-h-40 overflow-y-auto">
                    {testResult}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <strong className="text-blue-800">Current State:</strong>
                  <ul className="mt-1 space-y-1 text-blue-700">
                    <li>Selected Days: {selectedPeriodDays.length}</li>
                    <li>Notes: {notes ? 'Yes' : 'No'}</li>
                    <li>Mood Data: {Object.keys(dayMoodData).length} entries</li>
                    <li>Current Cycles: {cycles.length}</li>
                    <li>Today Status: {selectedPeriodDays.length > 0 ? 'Adding new cycle' : 'Normal view'}</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <strong className="text-green-800">API Info:</strong>
                  <ul className="mt-1 space-y-1 text-green-700">
                    <li>Base URL: /api</li>
                    <li>Endpoint: /menstrual-cycle/processMenstrualCycle</li>
                    <li>Auth Token: {localStorage.getItem('gencare_auth_token') ? 'Present' : 'Missing'}</li>
                    <li>User: {localStorage.getItem('user') ? 'Logged in' : 'Not logged in'}</li>
                    <li>Current Time: {new Date().toLocaleTimeString('vi-VN')}</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs">
                  <strong className="text-amber-800">🔧 Troubleshooting Steps:</strong>
                  <ol className="mt-2 space-y-1 text-amber-700 list-decimal list-inside">
                    <li><strong>Backend:</strong> Check server running on port 3000</li>
                    <li><strong>Auth:</strong> Verify login status and token validity</li>
                    <li><strong>Network:</strong> Check browser DevTools Network tab</li>
                    <li><strong>Console:</strong> Look for error messages in browser console</li>
                    <li><strong>Data:</strong> Try "Analyze Update Flow" button above</li>
                  </ol>
                </div>

                <div className="bg-red-50 p-3 rounded border border-red-200 text-xs">
                  <strong className="text-red-800">🚨 Common Issues & Solutions:</strong>
                  <div className="mt-2 space-y-2 text-red-700">
                    <div><strong>401 Unauthorized:</strong> Đăng nhập lại để refresh token</div>
                    <div><strong>Network Error:</strong> Kiểm tra backend server chạy chưa</div>
                    <div><strong>404 Not Found:</strong> Check API endpoint URL in browser network tab</div>
                    <div><strong>No response:</strong> CORS hoặc network connectivity issue</div>
                    <div><strong>Success: false:</strong> Check backend logs for detailed error</div>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded border border-green-200 text-xs">
                  <strong className="text-green-800">✅ Expected Flow:</strong>
                  <div className="mt-2 space-y-1 text-green-700">
                    <div>1. Chọn ngày → Popup mood modal</div>
                    <div>2. Lưu mood → Add to selected days</div>
                    <div>3. Nhấn "Lưu chu kì" → API call</div>
                    <div>4. API success → Auto refresh calendar</div>
                    <div>5. Calendar shows new cycle data</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Modal */}
      <MoodModal
        isOpen={showMoodModal}
        selectedDate={selectedDateForMood || new Date()}
        onClose={handleMoodModalClose}
        onSave={handleMoodSave}
      />
      
      {/* Debug: Current State */}
      {debugMode && (
        <div className="fixed top-4 right-4 bg-yellow-100 p-3 rounded-lg border border-yellow-300 text-xs z-40 max-w-xs">
          <strong>Debug State:</strong>
                     <ul className="mt-1 space-y-1">
             <li>Selected Days: {selectedPeriodDays.length}</li>
             <li>Show Modal: {showMoodModal ? 'Yes' : 'No'}</li>
             <li>Selected Date: {selectedDateForMood?.toDateString() || 'None'}</li>
             <li>Saved Successfully: {moodModalSavedSuccessfully ? 'Yes' : 'No'}</li>
             <li>Mood Data Entries: {Object.keys(dayMoodData).length}</li>
             <li>Pending Removal: {pendingRemoval?.toLocaleDateString('vi-VN') || 'None'}</li>
             <li>Click Times: {Object.keys(lastClickTime).length} tracked</li>
           </ul>
        </div>
      )}
    </div>
  );
};

export default CycleCalendar; 