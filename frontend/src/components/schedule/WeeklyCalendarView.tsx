import React from 'react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DAY_NAMES, DAY_LABELS, DayName, DaySchedule, WorkingDay } from '../../types/schedule';
import { formatDateDisplay, getCurrentWeekLabel, canNavigateToPreviousWeek } from '../../utils/dateUtils';
import { getSlotStatusColor, isSlotSelected, canSelectSlot } from '../../utils/slotUtils';

interface WeeklyCalendarViewProps {
  currentWeek: Date;
  weeklyData?: {
    days: { [key: string]: DaySchedule };
    summary?: {
      total_working_days: number;
      total_available_slots: number;
      total_booked_slots: number;
    };
  } | null;
  scheduleData?: {
    working_days: { [key: string]: WorkingDay };
    default_slot_duration: number;
    notes?: string;
  };
  selectedSlot?: { date: string; startTime: string; endTime: string } | null;
  mode: 'slot-picker' | 'schedule-manager' | 'read-only';
  onSlotSelect?: (date: string, startTime: string, endTime: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  currentWeek,
  weeklyData,
  scheduleData,
  selectedSlot,
  mode,
  onSlotSelect,
  onPreviousWeek,
  onNextWeek,
  loading = false,
  error = null,
  onRetry
}) => {
  
  const handleSlotClick = (date: string, startTime: string, endTime: string, isAvailable: boolean) => {
    if (mode !== 'slot-picker' || !onSlotSelect) return;
    if (!canSelectSlot(date, startTime, isAvailable)) return;
    
    onSlotSelect(date, startTime, endTime);
  };

  // Tạo time slots từ 8:00 đến 18:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is within working hours
  const isTimeSlotWorking = (time: string, workingDay?: WorkingDay): boolean => {
    if (!workingDay?.is_available) return false;
    
    const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const startMinutes = parseInt(workingDay.start_time.split(':')[0]) * 60 + parseInt(workingDay.start_time.split(':')[1]);
    const endMinutes = parseInt(workingDay.end_time.split(':')[0]) * 60 + parseInt(workingDay.end_time.split(':')[1]);
    
    // Check if in break time
    if (workingDay.break_start && workingDay.break_end) {
      const breakStartMinutes = parseInt(workingDay.break_start.split(':')[0]) * 60 + parseInt(workingDay.break_start.split(':')[1]);
      const breakEndMinutes = parseInt(workingDay.break_end.split(':')[0]) * 60 + parseInt(workingDay.break_end.split(':')[1]);
      
      if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
        return false;
      }
    }
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  // Check if slot is booked
  const isSlotBooked = (date: string, time: string, dayName: string): any => {
    const dayData = weeklyData?.days[dayName];
    
    return dayData?.booked_appointments?.find(appointment => {
      const appointmentStart = appointment.start_time;
      const appointmentEnd = appointment.end_time;
      return time >= appointmentStart && time < appointmentEnd;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header với navigation */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <button
          onClick={onPreviousWeek}
          disabled={!canNavigateToPreviousWeek(currentWeek)}
          className="flex items-center px-3 py-2 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tuần trước
        </button>
        
        <h3 className="text-xl font-bold">
          {getCurrentWeekLabel(currentWeek)}
        </h3>
        
        <button
          onClick={onNextWeek}
          className="flex items-center px-3 py-2 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
        >
          Tuần sau
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary info */}
      {weeklyData?.summary && (
        <div className="px-4 py-3 bg-blue-50 border-b">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center text-blue-700">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Ngày làm việc: <strong>{weeklyData.summary.total_working_days}</strong></span>
            </div>
            <div className="flex items-center text-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Slot có sẵn: <strong>{weeklyData.summary.total_available_slots}</strong></span>
            </div>
            <div className="flex items-center text-red-700">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Đã đặt: <strong>{weeklyData.summary.total_booked_slots}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row - Days */}
          <div className="grid grid-cols-8 border-b-2 border-gray-200">
            <div className="p-3 text-center font-semibold text-gray-700 bg-gray-50 border-r">
              Giờ
            </div>
            {DAY_LABELS.map((dayLabel, index) => {
              const dayDate = addDays(currentWeek, index);
              const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div 
                  key={index} 
                  className={`p-3 text-center font-semibold border-r ${
                    isToday 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="text-sm">{dayLabel}</div>
                  <div className={`text-xs mt-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {format(dayDate, 'dd/MM', { locale: vi })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-100">
              {/* Time Label */}
              <div className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r flex items-center justify-center">
                {timeSlot}
              </div>

              {/* Day Cells */}
              {DAY_NAMES.map((dayName, dayIndex) => {
                const dayDate = addDays(currentWeek, dayIndex);
                const dayDateString = format(dayDate, 'yyyy-MM-dd');
                const workingDay = scheduleData?.working_days[dayName as DayName];
                const dayData = weeklyData?.days[dayName];
                
                                 const isWorking = isTimeSlotWorking(timeSlot, workingDay);
                 const bookedAppointment = isSlotBooked(dayDateString, timeSlot, dayName);
                 const isToday = dayDateString === format(new Date(), 'yyyy-MM-dd');
                
                // Find available slot for this time
                const availableSlot = dayData?.available_slots?.find(slot => 
                  slot.start_time === timeSlot && slot.is_available
                );

                const isSelected = selectedSlot && 
                  selectedSlot.date === dayDateString && 
                  selectedSlot.startTime === timeSlot;

                let cellClass = "p-1 border-r min-h-[40px] relative transition-colors duration-200 ";
                let cellContent = null;

                if (!isWorking) {
                  // Non-working hours
                  cellClass += isToday ? "bg-blue-50" : "bg-gray-50";
                } else if (bookedAppointment) {
                  // Booked appointment
                  cellClass += "bg-red-100 border-red-200";
                  cellContent = (
                    <div className="text-xs p-1 text-red-700 font-medium">
                      <div className="flex items-center justify-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Đã đặt
                      </div>
                    </div>
                  );
                } else if (availableSlot && mode === 'slot-picker') {
                  // Available slot for booking
                  cellClass += isSelected 
                    ? "bg-blue-200 border-blue-300 cursor-pointer" 
                    : "bg-green-100 hover:bg-green-200 border-green-200 cursor-pointer";
                  cellContent = (
                    <button
                      onClick={() => handleSlotClick(dayDateString, timeSlot, availableSlot.end_time, true)}
                      className="w-full h-full text-xs text-green-700 font-medium flex items-center justify-center"
                      disabled={!canSelectSlot(dayDateString, timeSlot, true)}
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Có sẵn
                    </button>
                  );
                                 } else if (isWorking) {
                   // Working hours but no available slot
                   cellClass += isToday ? "bg-blue-50" : "bg-white";
                   if (mode === 'schedule-manager' || mode === 'read-only') {
                     cellContent = (
                       <div className="w-full h-full flex items-center justify-center">
                         <div className="w-2 h-2 bg-blue-400 rounded-full" title="Giờ làm việc"></div>
                       </div>
                     );
                   }
                 } else {
                   // Default case - non-working or no schedule data
                   cellClass += isToday ? "bg-blue-50" : "bg-gray-50";
                 }

                return (
                  <div key={dayIndex} className={cellClass}>
                    {cellContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span>Có thể đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
            <span>Đã đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span>Giờ làm việc</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-2"></div>
            <span>Không làm việc</span>
          </div>
          {selectedSlot && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded mr-2"></div>
              <span>Đã chọn</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {scheduleData?.notes && (
        <div className="p-4 bg-yellow-50 border-t">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Ghi chú:</p>
              <p className="text-sm text-yellow-700 mt-1">{scheduleData.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendarView; 