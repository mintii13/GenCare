import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/Input';
import { CycleData, menstrualCycleService } from '../../../services/menstrualCycleService';
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
  FaRegCircle
} from 'react-icons/fa';

interface CycleCalendarProps {
  cycles: CycleData[];
  onRefresh: () => void;
}

interface MoodData {
  mood: string;
  energy: string;
  symptoms: string[];
  notes?: string;
}

const CycleCalendar: React.FC<CycleCalendarProps> = ({ cycles, onRefresh }) => {
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<Date[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedDateForMood, setSelectedDateForMood] = useState<Date | null>(null);
  const [dayMoodData, setDayMoodData] = useState<{ [key: string]: MoodData }>({});
  const [moodModalSavedSuccessfully, setMoodModalSavedSuccessfully] = useState(false);
  
  // Hover mood tooltip state
  const [hoverMoodData, setHoverMoodData] = useState<{ data: MoodData; date: Date; position: { x: number; y: number } } | null>(null);

  // Current cycle for predictions
  const currentCycle = cycles && cycles.length > 0 ? cycles[0] : null;

  // Helper function to convert date to local date string (fix timezone issue)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseNotesWithMood = (notes?: string) => {
    if (!notes) return { cleanNotes: '', moodData: null };
    
    const moodDataIndex = notes.indexOf('MOOD_DATA:');
    if (moodDataIndex === -1) {
      return { cleanNotes: notes, moodData: null };
    }
    
    const cleanNotes = notes.substring(0, moodDataIndex).trim();
    const moodDataStr = notes.substring(moodDataIndex + 10);
    
    try {
      const moodData = JSON.parse(moodDataStr);
      return { cleanNotes, moodData };
    } catch (error) {
      return { cleanNotes: notes, moodData: null };
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateSelected = (date: Date) => {
    return selectedPeriodDays.some(selectedDate => isSameDay(selectedDate, date));
  };

  const isPeriodDay = (date: Date) => {
    return cycles.some(cycle => 
      cycle.period_days.some(periodDay => {
        const periodDate = new Date(periodDay);
        return isSameDay(date, periodDate);
      })
    );
  };

  const isPredictedPeriodDay = (date: Date) => {
    if (!currentCycle?.predicted_cycle_end) {
      return false;
    }
    const predictedDate = new Date(currentCycle.predicted_cycle_end);
    const isSame = isSameDay(date, predictedDate);
    const isFuture = date > new Date();
    return isSame && isFuture;
  };

  const isOvulationDay = (date: Date) => {
    if (!currentCycle?.predicted_ovulation_date) {
      return false;
    }
    const ovulationDate = new Date(currentCycle.predicted_ovulation_date);
    return isSameDay(date, ovulationDate);
  };

  const isFertileDay = (date: Date) => {
    if (!currentCycle?.predicted_fertile_start || !currentCycle?.predicted_fertile_end) {
      return false;
    }
    const fertileStart = new Date(currentCycle.predicted_fertile_start);
    const fertileEnd = new Date(currentCycle.predicted_fertile_end);
    return date >= fertileStart && date <= fertileEnd;
  };

  const handleDateClick = (date: Date) => {
    if (isPeriodDay(date)) {
      return;
    }

    if (isDateSelected(date)) {
      const dateKey = getLocalDateString(date);
      
      // Remove from mood data if exists
      if (dayMoodData[dateKey]) {
        setDayMoodData(prev => {
          const newData = { ...prev };
          delete newData[dateKey];
          return newData;
        });
      }
      
      // Remove from selected dates
      setSelectedPeriodDays(prev => 
        prev.filter(selectedDate => !isSameDay(selectedDate, date))
      );
    } else {
      setSelectedPeriodDays(prev => [...prev, date]);
      
      // Open mood modal for this date
      setSelectedDateForMood(date);
      setMoodModalSavedSuccessfully(false);
      setShowMoodModal(true);
    }
  };

  const handleRemoveFromDatabase = async (dateToRemove: Date) => {
    if (!confirm(`Bạn có chắc muốn xóa ngày ${dateToRemove.toLocaleDateString('vi-VN')} khỏi chu kì?`)) {
      return;
    }

    setIsSaving(true);
    
    try {
      let allExistingPeriodDays: string[] = [];
      
      try {
        const existingResponse = await menstrualCycleService.getCycles();
        
        if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
          allExistingPeriodDays = existingResponse.data
            .flatMap(cycle => cycle.period_days)
            .filter((v, i, arr) => arr.indexOf(v) === i);
        }
      } catch (error) {
        toast.error('Không thể lấy dữ liệu chu kì hiện tại');
        return;
      }

      const dateToRemoveStr = getLocalDateString(dateToRemove);
      
      // Debug: Hiển thị dữ liệu để kiểm tra
      console.log('Debug xóa ngày:');
      console.log('Ngày cần xóa:', dateToRemoveStr);
      console.log('Danh sách ngày hiện có:', allExistingPeriodDays);
      
      // Kiểm tra với nhiều format khác nhau
      const dateToRemoveISOStr = dateToRemove.toISOString().split('T')[0];
      console.log('Ngày cần xóa (ISO):', dateToRemoveISOStr);
      
      // Tạo Vietnam time zone date để tránh lỗi múi giờ
      const vietnamDate = new Date(dateToRemove.getTime() - (dateToRemove.getTimezoneOffset() * 60000));
      const vietnamDateStr = vietnamDate.toISOString().split('T')[0];
      console.log('Ngày cần xóa (Vietnam):', vietnamDateStr);
      
      // Thử filter với tất cả các format
      let updatedPeriodDays = allExistingPeriodDays.filter(day => 
        day !== dateToRemoveStr && 
        day !== dateToRemoveISOStr && 
        day !== vietnamDateStr
      );
      
      // Nếu vẫn không tìm thấy, thử so sánh theo Date object
      if (updatedPeriodDays.length === allExistingPeriodDays.length) {
        console.log('Thử so sánh Date objects...');
        updatedPeriodDays = allExistingPeriodDays.filter(day => {
          const dayDate = new Date(day);
          const isSame = isSameDay(dayDate, dateToRemove);
          console.log(`So sánh ${day} với ${dateToRemoveStr}: ${isSame}`);
          return !isSame;
        });
      }

      console.log('Danh sách sau khi filter:', updatedPeriodDays);
      console.log('Số lượng trước/sau:', allExistingPeriodDays.length, '/', updatedPeriodDays.length);

      // Kiểm tra xem có xóa được ngày nào không
      if (updatedPeriodDays.length === allExistingPeriodDays.length) {
        toast.error(`Không tìm thấy ngày ${dateToRemoveStr} trong dữ liệu chu kì`);
        console.warn('Không tìm thấy ngày để xóa');
        return;
      }

      // Nếu xóa hết ngày thì xóa toàn bộ chu kì
      if (updatedPeriodDays.length === 0) {
        console.log('Xóa hết ngày trong chu kì - sẽ xóa toàn bộ chu kì');
        // Có thể gọi API xóa chu kì hoặc để trống
        toast.success(`Đã xóa ngày ${dateToRemove.toLocaleDateString('vi-VN')} - chu kì đã trống`);
        onRefresh();
        return;
      }

      const requestData = {
        period_days: updatedPeriodDays,
        notes: undefined
      };

      const response = await menstrualCycleService.processCycle(requestData);

      if (response && response.success) {
        toast.success(`Đã xóa ngày ${dateToRemove.toLocaleDateString('vi-VN')} khỏi chu kì`);
        onRefresh();
      } else {
        toast.error('Có lỗi khi xóa ngày khỏi chu kì');
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa ngày:', error);
      toast.error('Lỗi khi xóa ngày khỏi chu kì');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoodSave = (moodData: MoodData) => {
    if (!selectedDateForMood) return;
    
    const dateKey = getLocalDateString(selectedDateForMood);
    setDayMoodData(prev => ({
        ...prev,
        [dateKey]: moodData
    }));
    
    setMoodModalSavedSuccessfully(true);
    setShowMoodModal(false);
    setSelectedDateForMood(null);
  };

  const handleMoodModalClose = () => {
    if (!moodModalSavedSuccessfully && selectedDateForMood) {
      const dateKey = getLocalDateString(selectedDateForMood);
      setSelectedPeriodDays(prev => prev.filter(d => getLocalDateString(d) !== dateKey));
    }
    
    setShowMoodModal(false);
    setSelectedDateForMood(null);
    setMoodModalSavedSuccessfully(false);
  };

  const saveCycle = async () => {
    if (selectedPeriodDays.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ngày có kinh');
      return;
    }

    setIsSaving(true);
    
    try {
      let allExistingPeriodDays: string[] = [];
      let combinedNotes = notes;
      
      try {
        const existingResponse = await menstrualCycleService.getCycles();
        
        if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
          allExistingPeriodDays = existingResponse.data
            .flatMap(cycle => cycle.period_days)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          combinedNotes = existingResponse.data
            .map(cycle => cycle.notes)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .join('\n');
        }
      } catch (error) {
        // No existing cycles found, creating new one
      }

      const newPeriodDays = selectedPeriodDays.map(date => {
        const localDateString = getLocalDateString(date);
        return localDateString;
      });

      newPeriodDays.forEach(newDay => {
        if (!allExistingPeriodDays.includes(newDay)) {
          allExistingPeriodDays.push(newDay);
        }
      });

      allExistingPeriodDays.sort();

      let finalNotes = combinedNotes;
      if (Object.keys(dayMoodData).length > 0) {
        const moodDataStr = JSON.stringify(dayMoodData, null, 2);
        finalNotes = finalNotes ? `${finalNotes}\nMOOD_DATA:${moodDataStr}` : `MOOD_DATA:${moodDataStr}`;
      }

      const requestData = {
        period_days: allExistingPeriodDays,
        notes: finalNotes || undefined
      };

      const response = await menstrualCycleService.processCycle(requestData);

      if (response && response.success) {
        toast.success('Đã lưu chu kì thành công!');
        setSelectedPeriodDays([]);
        setNotes('');
        setDayMoodData({});
        
        await onRefresh();
      } else {
        toast.error(`Lỗi khi lưu chu kì: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error('Lỗi khi lưu chu kì');
    } finally {
      setIsSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedPeriodDays([]);
    setNotes('');
    setDayMoodData({});
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const classes = [];
    
    if (isDateSelected(date)) {
      classes.push('selected-period');
    } else if (isPeriodDay(date)) {
      classes.push('period-day');
    } else if (isOvulationDay(date)) {
      classes.push('ovulation-day');
    } else if (isFertileDay(date)) {
      classes.push('fertile-day');
    } else if (isPredictedPeriodDay(date)) {
      classes.push('predicted-period');
    }

    return classes.join(' ');
  };

  const getMoodDataForDate = (date: Date) => {
    const dateKey = getLocalDateString(date);
    
    // Check in current selection
    if (dayMoodData[dateKey]) {
      return dayMoodData[dateKey];
    }
    
    // Check in existing cycle notes
    if (currentCycle?.notes) {
      const { moodData } = parseNotesWithMood(currentCycle.notes);
      if (moodData && moodData[dateKey]) {
        return moodData[dateKey];
      }
    }
    
    return null;
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const handleMoodHover = (e: React.MouseEvent, data: MoodData) => {
      e.stopPropagation();
      setHoverMoodData({
        data,
        date,
        position: { x: e.clientX, y: e.clientY }
      });
    };

    const handleMoodLeave = () => {
      setHoverMoodData(null);
    };

    const content = [];
    
    if (isPeriodDay(date)) {
      content.push(
        <div key="period" className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
               onClick={(e) => {
                 e.stopPropagation();
                 handleRemoveFromDatabase(date);
               }}>
            <FaTimes className="text-white text-xs cursor-pointer" />
          </div>
        </div>
      );
    } else if (isDateSelected(date)) {
      content.push(
        <div key="selected" className="absolute inset-0 flex items-center justify-center">
          <FaCircle className="text-pink-500 text-lg" />
        </div>
      );
    } else if (isOvulationDay(date)) {
      content.push(
        <div key="ovulation" className="absolute top-0 right-0">
          <FaEgg className="text-yellow-500 text-xs" />
        </div>
      );
    } else if (isFertileDay(date)) {
      content.push(
        <div key="fertile" className="absolute top-0 right-0">
          <FaVenus className="text-blue-400 text-xs" />
        </div>
      );
    } else if (isPredictedPeriodDay(date)) {
      content.push(
        <div key="predicted" className="absolute top-0 right-0">
          <FaRegCircle className="text-pink-300 text-xs" />
        </div>
      );
    }

    // Add mood indicator with React Icons
    const moodData = getMoodDataForDate(date);
    if (moodData) {
      const MoodIcon = moodData.mood === 'happy' ? FaSmile : 
                      moodData.mood === 'sad' ? FaFrown :
                      moodData.mood === 'neutral' ? FaMeh : FaMeh;
      
      const moodColor = moodData.mood === 'happy' ? 'text-green-500' : 
                       moodData.mood === 'sad' ? 'text-red-500' :
                       moodData.mood === 'neutral' ? 'text-gray-500' : 'text-gray-500';
      
      content.push(
        <div key="mood" 
             className={`absolute bottom-0 left-0 text-xs cursor-pointer ${moodColor}`}
             onMouseEnter={(e) => handleMoodHover(e, moodData)}
             onMouseLeave={handleMoodLeave}>
          <MoodIcon />
        </div>
      );
    }

    return content.length > 0 ? <div className="relative w-full h-full">{content}</div> : null;
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaHeart className="text-pink-500" />
                Lịch Chu Kì
              </CardTitle>
              <CardDescription className="text-gray-600">
                Click vào ngày để ghi nhận chu kì
              </CardDescription>
            </div>
          </div>
        </div>

        {selectedPeriodDays.length > 0 && (
          <div className="px-6 py-4 bg-pink-50 border-b border-pink-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-pink-700">Ngày đã chọn:</span>
                {selectedPeriodDays
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date, index) => {
                    const dateKey = getLocalDateString(date);
                    const hasMoodData = dayMoodData[dateKey];
                    return (
                      <Badge key={index} className={`${hasMoodData ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-pink-100 text-pink-800 border-pink-200'}`}>
                        {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        {hasMoodData && <FaSmile className="ml-1 text-xs" />}
                      </Badge>
                    );
                  })
                }
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={saveCycle}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center gap-2"
                >
                  <FaSave />
                  {isSaving ? 'Đang lưu...' : 'Lưu chu kì'}
                </Button>
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                >
                  <FaTimes />
                  Xóa chọn
                </Button>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-6">

          <div className="calendar-container">
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={getTileClassName}
              tileContent={getTileContent}
              showNeighboringMonth={false}
              locale="vi-VN"
              prev2Label={null}
              next2Label={null}
            />
          </div>
        </CardContent>
      </Card>
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-xl border border-purple-100">
            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
              <FaEye className="text-purple-500" />
              Hướng dẫn sử dụng:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              {selectedPeriodDays.length > 0 && (
                <div className="flex items-center gap-2">
                  <FaCircle className="text-pink-500 text-sm" />
                  <span className="font-medium">Đang chọn</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg shadow-sm"></div>
                <span className="font-medium">Kinh nguyệt</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEgg className="text-yellow-500 text-sm" />
                <span className="font-medium">Rụng trứng</span>
              </div>
              <div className="flex items-center gap-2">
                <FaVenus className="text-blue-400 text-sm" />
                <span className="font-medium">Cửa sổ sinh sản</span>
              </div>
              <div className="flex items-center gap-2">
                <FaRegCircle className="text-pink-300 text-sm" />
                <span className="font-medium">Dự đoán</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Mẹo sử dụng:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Click</strong> vào ngày để chọn kinh nguyệt mới</li>
                <li><strong>Click</strong> vào ngày đã chọn để bỏ chọn</li>
                <li><strong>Click</strong> vào ngày đã lưu để xóa khỏi database</li>
              </ul>
            </div>
          </div>

      {/* Cycle Summary */}
      {currentCycle && selectedPeriodDays.length === 0 && (
        <Card className="border-0 shadow-md">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{currentCycle.period_days.length}</div>
                  <div className="text-xs text-gray-600">Ngày kinh</div>
                </div>
                {currentCycle.cycle_length && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{currentCycle.cycle_length}</div>
                    <div className="text-xs text-gray-600">Chu kì (ngày)</div>
                  </div>
                )}
                {currentCycle.predicted_ovulation_date && (
                  <div className="text-center">
                    <div className="text-sm font-semibold text-indigo-600">
                      {new Date(currentCycle.predicted_ovulation_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-600">Rụng trứng</div>
                  </div>
                )}
                {currentCycle.predicted_cycle_end && (
                  <div className="text-center">
                    <div className="text-sm font-semibold text-pink-600">
                      {new Date(currentCycle.predicted_cycle_end).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-600">Kì tiếp theo</div>
                  </div>
                )}
                
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <FaEye />
                Di chuột qua ngày có kinh để xem tâm trạng
              </div>
            </div>
          </div>
        </Card>
        
      )}

      <MoodModal
        isOpen={showMoodModal}
        selectedDate={selectedDateForMood || new Date()}
        onClose={handleMoodModalClose}
        onSave={handleMoodSave}
      />

      {/* Mood Hover Tooltip */}
      {hoverMoodData && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
          style={{ 
            left: hoverMoodData.position.x + 10,
            top: hoverMoodData.position.y - 50
          }}
        >
          <div className="text-sm">
            <div className="font-medium">
              {hoverMoodData.date.toLocaleDateString('vi-VN')}
            </div>
            <div className="text-gray-600">
              Tâm trạng: {hoverMoodData.data.mood}
            </div>
            <div className="text-gray-600">
              Năng lượng: {hoverMoodData.data.energy}
            </div>
            {hoverMoodData.data.symptoms.length > 0 && (
              <div className="text-gray-600">
                Triệu chứng: {hoverMoodData.data.symptoms.join(', ')}
              </div>
            )}
          </div>
          
        </div>
      )}

      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, #fdf7ff 0%, #fef7f7 50%, #f0f9ff 100%);
          font-family: 'Inter', sans-serif;
          line-height: 1.4;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(168, 85, 247, 0.1);
        }
        
        .calendar-container .react-calendar__tile {
          position: relative;
          height: 65px;
          border: none;
          background: rgba(255, 255, 255, 0.7);
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          padding: 8px;
          margin: 3px;
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.05);
        }
        
        .calendar-container .react-calendar__tile:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(168, 85, 247, 0.15);
        }
        
        .calendar-container .react-calendar__tile.period-day {
          background: linear-gradient(135deg, #fecaca 0%, #f9a8d4 50%, #ec4899 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(236, 72, 153, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .calendar-container .react-calendar__tile.selected-period {
          background: linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 50%, #a855f7 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(168, 85, 247, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.4);
          animation: pulse 2s infinite;
        }
        
        .calendar-container .react-calendar__tile.ovulation-day {
          background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 50%, #d8b4fe 100%);
          color: #7c3aed;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(168, 85, 247, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.4);
        }
        
        .calendar-container .react-calendar__tile.fertile-day {
          background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #3b82f6 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .calendar-container .react-calendar__tile.predicted-period {
          background: linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 50%, #c084fc 100%);
          color: #7c3aed;
          font-weight: 600;
          box-shadow: 0 6px 15px rgba(192, 132, 252, 0.2);
          border: 2px solid rgba(168, 85, 247, 0.2);
        }
        
        .calendar-container .react-calendar__tile--active {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #4f46e5;
          font-weight: 600;
          border: 2px solid #a5b4fc;
        }
        
        .calendar-container .react-calendar__tile--now {
          background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
          color: #ea580c;
          font-weight: 600;
          border: 2px solid #fdba74;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
        }
        
        .calendar-container .react-calendar__navigation {
          margin-bottom: 20px;
          padding: 0 10px;
        }
        
        .calendar-container .react-calendar__navigation button {
          color: #7c3aed;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          font-size: 16px;
          font-weight: 600;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          margin: 4px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
        }
        
        .calendar-container .react-calendar__navigation button:hover {
          background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.2);
        }
        
        .calendar-container .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 12px;
          color: #a855f7;
          padding: 15px 0;
          letter-spacing: 1px;
        }
        
        .calendar-container .react-calendar__month-view__weekdays__weekday {
          padding: 10px;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 10px;
          margin: 2px;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .calendar-container .react-calendar__tile.period-day:hover,
        .calendar-container .react-calendar__tile.selected-period:hover,
        .calendar-container .react-calendar__tile.ovulation-day:hover,
        .calendar-container .react-calendar__tile.fertile-day:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 30px rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CycleCalendar; 