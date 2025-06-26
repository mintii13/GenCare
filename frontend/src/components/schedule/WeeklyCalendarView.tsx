import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DAY_NAMES, DAY_LABELS, DayName, DaySchedule, WorkingDay } from '../../types/schedule';
import { formatDateDisplay, getCurrentWeekLabel, canNavigateToPreviousWeek } from '../../utils/dateUtils';
import { FaExclamationTriangle } from 'react-icons/fa';

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
  
  // State để quản lý ngày được chọn - mặc định chọn ngày hôm nay
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Tìm index của ngày hôm nay trong tuần
    const today = format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(currentWeek, i);
      const dayDateString = format(dayDate, 'yyyy-MM-dd');
      if (dayDateString === today) {
        return i;
      }
    }
    return 0; // Fallback về ngày đầu tiên nếu không tìm thấy hôm nay
  });
  
  const handleSlotClick = (date: string, startTime: string, endTime: string) => {
    if (mode !== 'slot-picker' || !onSlotSelect) return;
    
    const slotDateTime = new Date(`${date}T${startTime}:00`);
    const now = new Date();
    const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (slotDateTime <= now) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Không thể chọn thời gian đã qua');
      });
      return;
    }
    
    if (diffHours < 2) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(`Lịch hẹn phải được đặt trước ít nhất 2 giờ. Hiện tại chỉ còn ${diffHours.toFixed(1)} giờ.`);
      });
      return;
    }
    
    onSlotSelect(date, startTime, endTime);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <div className="text-6xl mb-4">
              <FaExclamationTriangle />
            </div>
            <p className="text-lg">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // Tạo danh sách các ngày trong tuần
  const weekDays = DAY_LABELS.map((dayLabel, dayIndex) => {
    const dayName = DAY_NAMES[dayIndex];
    const dayDate = addDays(currentWeek, dayIndex);
    const dayDateString = format(dayDate, 'yyyy-MM-dd');
    const dayData = weeklyData?.days[dayName];
    const isToday = dayDateString === format(new Date(), 'yyyy-MM-dd');
    
    return {
      index: dayIndex,
      label: dayLabel,
      name: dayName,
      date: dayDate,
      dateString: dayDateString,
      data: dayData,
      isToday,
      slotsCount: dayData?.available_slots?.length || 0
    };
  });

  // Lấy thông tin ngày được chọn
  const selectedDay = weekDays[selectedDayIndex];
  const selectedDayData = selectedDay?.data;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <button
          onClick={onPreviousWeek}
          disabled={!canNavigateToPreviousWeek(currentWeek)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Tuần trước
        </button>
        
        <h2 className="text-2xl font-bold">
          {getCurrentWeekLabel(currentWeek)}
        </h2>
        
        <button
          onClick={onNextWeek}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
        >
          Tuần sau →
        </button>
      </div>

      {/* Summary */}
      {weeklyData?.summary && (
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-blue-700 font-medium">Ngày làm việc: {weeklyData.summary.total_working_days}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700 font-medium">Slot có sẵn: {weeklyData.summary.total_available_slots}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-700 font-medium">Đã đặt: {weeklyData.summary.total_booked_slots}</span>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector Dropdown */}
      <div className="p-6 border-b bg-gray-50">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Chọn ngày để xem lịch trống:
          </label>
          <select
            value={selectedDayIndex}
            onChange={(e) => setSelectedDayIndex(parseInt(e.target.value))}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            {weekDays.map((day) => (
              <option key={day.index} value={day.index}>
                {day.label} - {format(day.date, 'dd/MM', { locale: vi })}
                {day.isToday && ' (Hôm nay)'}
                {day.slotsCount > 0 && ` - ${day.slotsCount} slots`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Day Content */}
      <div className="p-6">
        {selectedDay && (
          <div className="max-w-4xl mx-auto">
            {/* Selected Day Header */}
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${selectedDay.isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                {selectedDay.label}
              </h3>
              <p className="text-gray-600">
                {format(selectedDay.date, 'dd/MM/yyyy', { locale: vi })}
                {selectedDay.isToday && (
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                    Hôm nay
                  </span>
                )}
              </p>
            </div>

            {/* Slots Grid */}
            {!selectedDayData?.available_slots || selectedDayData.available_slots.length === 0 ? (
              selectedDayData && selectedDayData.total_slots === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚫</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">Không làm việc</h4>
                  <p className="text-gray-500">Ngày này không có lịch làm việc</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">Không có lịch trống</h4>
                  <p className="text-gray-500">Ngày này không có slot nào khả dụng</p>
                </div>
              )
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Tất cả khung giờ trong ngày
                  </h4>
                  <div className="text-sm text-gray-600">
                    {selectedDayData.available_slots.length} trống • {selectedDayData.booked_appointments?.length || 0} đã đặt
                  </div>
                </div>
                
                {/* Combined Slots Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {/* Booked Appointments */}
                  {selectedDayData.booked_appointments && selectedDayData.booked_appointments.map((appointment, appointmentIndex) => (
                    <div
                      key={`booked-${appointmentIndex}`}
                      className="w-full px-4 py-4 text-center font-semibold rounded-xl border-2 bg-red-100 text-red-700 border-red-300 cursor-not-allowed"
                    >
                      <div className="text-lg font-bold">{appointment.start_time}</div>
                      <div className="text-sm opacity-75">đến {appointment.end_time}</div>
                      <div className="text-xs mt-2 font-medium">
                        Đã đặt
                      </div>
                    </div>
                  ))}
                  
                  {/* Available Slots */}
                  {selectedDayData.available_slots.map((slot, slotIndex) => {
                    const slotDateTime = new Date(`${selectedDay.dateString}T${slot.start_time}:00`);
                    const now = new Date();
                    const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const isPast = slotDateTime <= now;
                    const isRestricted = diffHours < 2 && !isPast;
                    
                    const isSelected = selectedSlot && 
                      selectedSlot.date === selectedDay.dateString && 
                      selectedSlot.startTime === slot.start_time;

                    const isBooked = selectedDayData.booked_appointments?.some(appointment => {
                      return slot.start_time >= appointment.start_time && slot.start_time < appointment.end_time;
                    });

                    let buttonClass = "w-full px-4 py-4 text-center font-semibold rounded-xl transition-all duration-200 border-2 ";
                    let buttonContent = (
                      <div>
                        <div className="text-lg font-bold">{slot.start_time}</div>
                        <div className="text-sm opacity-75">đến {slot.end_time}</div>
                      </div>
                    );
                    let statusText = "";
                    let isClickable = false;

                    if (isBooked) {
                      buttonClass += "bg-red-100 text-red-700 border-red-300 cursor-not-allowed";
                      statusText = "Đã đặt";
                    } else if (isPast) {
                      buttonClass += "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed";
                      statusText = "Đã qua";
                    } else if (isRestricted) {
                      buttonClass += "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 cursor-pointer transform hover:scale-105";
                      statusText = "Hạn chế";
                      isClickable = mode === 'slot-picker';
                    } else if (slot.is_available) {
                      if (isSelected) {
                        buttonClass += "bg-blue-200 text-blue-800 border-blue-400 cursor-pointer shadow-lg transform scale-105";
                        statusText = "Đã chọn";
                      } else {
                        buttonClass += "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer transform hover:scale-105 hover:shadow-md";
                        statusText = "Có thể đặt";
                      }
                      isClickable = mode === 'slot-picker';
                    }

                    return (
                      <button
                        key={slotIndex}
                        onClick={() => isClickable ? handleSlotClick(selectedDay.dateString, slot.start_time, slot.end_time) : undefined}
                        disabled={!isClickable}
                        className={buttonClass}
                        title={`${slot.start_time} - ${slot.end_time} (${statusText})`}
                      >
                        {buttonContent}
                        <div className="text-xs mt-2 font-medium">
                          {statusText}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
        <div className="text-center mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Chú thích màu sắc</h4>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
            <span>Có thể đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded mr-2"></div>
            <span>Hạn chế (&lt; 2h)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded mr-2"></div>
            <span>Đã đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded mr-2"></div>
            <span>Đã chọn</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
            <span>Không có/Đã qua</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {scheduleData?.notes && (
        <div className="px-6 py-4 bg-yellow-50 border-t">
          <div className="flex items-start">
            <div className="text-2xl mr-3">📝</div>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Ghi chú quan trọng:</p>
              <p className="text-sm text-yellow-700 mt-1">{scheduleData.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendarView;