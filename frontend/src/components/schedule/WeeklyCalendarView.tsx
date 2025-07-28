import React, { useState, useMemo } from 'react';
import { addDays, format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DAY_NAMES, DAY_LABELS, DayName, DaySchedule, WorkingDay } from '../../types/schedule';
import { formatDateDisplay, getCurrentWeekLabel, canNavigateToPreviousWeek } from '../../utils/dateUtils';
import { FaExclamationTriangle, FaClock, FaBan, FaCheckCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
  mode: 'slot-picker' | 'schedule-manager' | 'read-only' | 'booking';
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

  // State để quản lý ngày được chọn (chỉ cho slot-picker mode)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(currentWeek, i);
      const dayDateString = format(dayDate, 'yyyy-MM-dd');
      if (dayDateString === today) {
        return i;
      }
    }
    return 0;
  });

  // Tạo time slots cho booking mode (7:00 - 18:00, mỗi 1 giờ)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push({ startTime, endTime, displayTime: `${hour}h-${hour + 1}h` });
    }
    return slots;
  }, []);

  const handleSlotClick = (date: string, startTime: string, endTime: string) => {
    if (!onSlotSelect) return;

    // Validation cho booking
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

  // Tạo danh sách các ngày trong tuần
  const weekDays = DAY_LABELS.map((dayLabel, dayIndex) => {
    const dayName = DAY_NAMES[dayIndex];
    const dayDate = addDays(currentWeek, dayIndex);
    const dayDateString = format(dayDate, 'yyyy-MM-dd');
    const dayData = weeklyData?.days[dayName];
    const isDayToday = isToday(dayDate);

    return {
      index: dayIndex,
      label: dayLabel,
      name: dayName,
      date: dayDate,
      dateString: dayDateString,
      data: dayData,
      isToday: isDayToday,
      slotsCount: dayData?.available_slots?.length || 0,
      isWorkingDay: dayData && dayData.total_slots > 0
    };
  });

  const getSlotInfo = (day: any, timeSlot: any) => {
    if (!day.data || day.data.total_slots === 0) {
      return { type: 'not-working', available: false };
    }

    const slotDateTime = new Date(`${day.dateString}T${timeSlot.startTime}:00`);
    const now = new Date();
    const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isPast = slotDateTime <= now;

    // Kiểm tra slot có available không
    const availableSlot = day.data.available_slots?.find((slot: any) =>
      slot.start_time === timeSlot.startTime && slot.is_available
    );

    // Kiểm tra slot có bị đặt không
    const isBooked = day.data.booked_appointments?.some((appt: any) =>
      appt.status !== 'cancelled' &&
      timeSlot.startTime >= appt.start_time &&
      timeSlot.startTime < appt.end_time
    );

    const isSelected = selectedSlot &&
      selectedSlot.date === day.dateString &&
      selectedSlot.startTime === timeSlot.startTime;

    if (isBooked) {
      return { type: 'booked', available: false };
    }

    if (isPast) {
      return { type: 'past', available: false };
    }

    if (!availableSlot) {
      return { type: 'unavailable', available: false };
    }

    if (diffHours < 2) {
      return { type: 'restricted', available: true, diffHours }; // Cho phép click slot quá gần
    }

    if (isSelected) {
      return { type: 'selected', available: true };
    }

    return { type: 'available', available: true };
  };

  const getSlotClassName = (slotInfo: any) => {
    const baseClass = "w-full h-12 text-xs font-medium rounded transition-all duration-200 border cursor-pointer relative overflow-hidden";

    switch (slotInfo.type) {
      case 'not-working':
        return baseClass + " bg-gray-100 border-gray-200 cursor-not-allowed opacity-50";
      case 'booked':
        return baseClass + " bg-red-100 border-red-300 text-red-700 cursor-not-allowed";
      case 'past':
        return baseClass + " bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed opacity-60";
      case 'unavailable':
        return baseClass + " bg-gray-100 border-gray-200 cursor-not-allowed opacity-70";
      case 'restricted':
        return baseClass + " bg-yellow-100 border-yellow-300 text-yellow-700 cursor-pointer hover:bg-yellow-200 hover:border-yellow-400";
      case 'selected':
        return baseClass + " bg-blue-500 border-blue-600 text-white shadow-md transform scale-105 z-10";
      case 'available':
        return baseClass + " bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400 hover:shadow-sm hover:scale-105 hover:z-10";
      default:
        return baseClass + " bg-gray-100 border-gray-200";
    }
  };

  // Tính toán số slot thực sự có thể đặt được
  const getBookableSlots = () => {
    if (!weeklyData?.days) return 0;
    
    let bookableCount = 0;
    const now = new Date();
    
    // Duyệt qua tất cả các ngày trong tuần
    Object.values(weeklyData.days).forEach(dayData => {
      if (!dayData || dayData.total_slots === 0) return;
      
      // Duyệt qua tất cả time slots (7h-18h)
      for (let hour = 7; hour <= 17; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Tìm ngày tương ứng với dayData
        const dayName = Object.keys(weeklyData.days).find(key => weeklyData.days[key] === dayData);
        if (!dayName) continue;
        
        const dayIndex = DAY_NAMES.indexOf(dayName as DayName);
        if (dayIndex === -1) continue;
        
        const dayDate = addDays(currentWeek, dayIndex);
        const dayDateString = format(dayDate, 'yyyy-MM-dd');
        
        // Kiểm tra slot có thể đặt được không
        const slotDateTime = new Date(`${dayDateString}T${startTime}:00`);
        const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isPast = slotDateTime <= now;
        
        // Kiểm tra slot có available không
        const availableSlot = dayData.available_slots?.find((slot: any) =>
          slot.start_time === startTime && slot.is_available
        );
        
        // Kiểm tra slot có bị đặt không
        const isBooked = dayData.booked_appointments?.some((appt: any) =>
          appt.status !== 'cancelled' &&
          startTime >= appt.start_time &&
          startTime < appt.end_time
        );
        
        // Slot có thể đặt được nếu:
        // 1. Có available slot
        // 2. Không bị đặt
        // 3. Không phải quá khứ
        // 4. Đặt trước ít nhất 2 giờ
        if (availableSlot && !isBooked && !isPast && diffHours >= 2) {
          bookableCount++;
        }
      }
    });
    
    return bookableCount;
  };

  // Tính toán số slot có thể đặt được cho từng ngày
  const getBookableSlotsForDay = (dayData: any, dayIndex: number) => {
    if (!dayData || dayData.total_slots === 0) return 0;
    
    let bookableCount = 0;
    const now = new Date();
    const dayDate = addDays(currentWeek, dayIndex);
    const dayDateString = format(dayDate, 'yyyy-MM-dd');
    
    // Duyệt qua tất cả time slots (7h-18h)
    for (let hour = 7; hour <= 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Kiểm tra slot có thể đặt được không
      const slotDateTime = new Date(`${dayDateString}T${startTime}:00`);
      const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isPast = slotDateTime <= now;
      
      // Kiểm tra slot có available không
      const availableSlot = dayData.available_slots?.find((slot: any) =>
        slot.start_time === startTime && slot.is_available
      );
      
      // Kiểm tra slot có bị đặt không
      const isBooked = dayData.booked_appointments?.some((appt: any) =>
        appt.status !== 'cancelled' &&
        startTime >= appt.start_time &&
        startTime < appt.end_time
      );
      
      // Slot có thể đặt được nếu:
      // 1. Có available slot
      // 2. Không bị đặt
      // 3. Không phải quá khứ
      // 4. Đặt trước ít nhất 2 giờ
      if (availableSlot && !isBooked && !isPast && diffHours >= 2) {
        bookableCount++;
      }
    }
    
    return bookableCount;
  };

  const bookableSlots = getBookableSlots();

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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <button
          onClick={onPreviousWeek}
          disabled={!canNavigateToPreviousWeek(currentWeek)}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="mr-2" />
          Tuần trước
        </button>

        <h2 className="text-2xl font-bold">
          {getCurrentWeekLabel(currentWeek)}
        </h2>

        <button
          onClick={onNextWeek}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
        >
          Tuần sau
          <FaChevronRight className="ml-2" />
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
              <span className="text-green-700 font-medium">Có thể đặt: {bookableSlots}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-700 font-medium">Đã đặt: {weeklyData.summary.total_booked_slots}</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Rules Alert */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="text-blue-600 text-lg mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Quy tắc đặt lịch hẹn</h4>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <FaClock className="text-blue-500 flex-shrink-0 text-sm" />
                  <span>Không thể đặt lịch trong <strong>quá khứ</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-orange-700">
                  <FaExclamationTriangle className="text-orange-500 flex-shrink-0 text-sm" />
                  <span>Đặt trước tối thiểu <strong>2 giờ</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-green-700">
                  <FaCheckCircle className="text-green-500 flex-shrink-0 text-sm" />
                  <span>Click vào ô xanh để <strong>đặt lịch</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content dựa trên mode */}
      {mode === 'booking' ? (
        // Calendar Grid cho booking mode
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row - Days of Week */}
              <div className="grid grid-cols-8 gap-1 mb-4">
                <div className="h-16 flex items-center justify-center font-semibold text-gray-600 bg-gray-50 rounded">
                  Giờ
                </div>
                {weekDays.map((day) => (
                  <div key={day.index} className={`h-16 flex flex-col items-center justify-center rounded border-2 ${day.isToday
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : day.isWorkingDay
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                    <div className="font-semibold text-sm">{day.label}</div>
                    <div className="text-xs">{format(day.date, 'dd/MM', { locale: vi })}</div>
                    {day.isToday && (
                      <div className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full mt-1">
                        Hôm nay
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-1">
                {timeSlots.map((timeSlot, timeIndex) => (
                  <div key={timeSlot.startTime} className="grid grid-cols-8 gap-1">
                    {/* Time Label */}
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
                      {timeSlot.displayTime}
                    </div>

                    {/* Slots for each day */}
                    {weekDays.map((day) => {
                      const slotInfo = getSlotInfo(day, timeSlot);

                      return (
                        <div
                          key={`${day.dateString}-${timeSlot.startTime}`}
                          className={getSlotClassName(slotInfo)}
                          onClick={() => slotInfo.available && handleSlotClick(day.dateString, timeSlot.startTime, timeSlot.endTime)}
                          title={
                            slotInfo.type === 'available' ? `Đặt lịch ${timeSlot.displayTime}` :
                              slotInfo.type === 'booked' ? 'Đã được đặt' :
                                slotInfo.type === 'past' ? 'Đã qua thời gian' :
                                  slotInfo.type === 'restricted' ? `Quá gần (${slotInfo.diffHours?.toFixed(1)}h)` :
                                    slotInfo.type === 'selected' ? 'Đã chọn' :
                                      slotInfo.type === 'not-working' ? 'Không làm việc' :
                                        'Không khả dụng'
                          }
                        >
                          <span className="flex items-center justify-center h-full text-xs font-bold">
                            {slotInfo.type === 'available' && timeSlot.displayTime}
                            {slotInfo.type === 'selected' && <FaCheckCircle />}
                            {slotInfo.type === 'booked' && <FaBan />}
                            {slotInfo.type === 'past' && <FaClock />}
                            {slotInfo.type === 'restricted' && <FaExclamationTriangle />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Original slot picker mode
        <>
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
                {weekDays.map((day) => {
                  const isPastDay = day.date < new Date() && !day.isToday;
                  const isNonWorkingDay = (!day.data || day.data.total_slots === 0);
                  const bookableSlotsForDay = getBookableSlotsForDay(day.data, day.index);

                  let optionText = `${day.label} - ${format(day.date, 'dd/MM', { locale: vi })}`;

                  if (day.isToday) {
                    optionText += ' (Hôm nay)';
                  } else if (isPastDay) {
                    optionText += ' (Đã qua)';
                  }

                  if (isNonWorkingDay) {
                    optionText += ' - Không làm việc';
                  } else if (bookableSlotsForDay > 0) {
                    optionText += ` - ${bookableSlotsForDay} slot có thể đặt`;
                  } else {
                    optionText += ' - Không có slot khả dụng';
                  }

                  return (
                    <option
                      key={day.index}
                      value={day.index}
                      disabled={isPastDay || isNonWorkingDay || bookableSlotsForDay === 0}
                    >
                      {optionText}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Selected Day Content - Existing slot picker logic */}
          <div className="p-6">
            <div className="text-center">
              <p className="text-gray-600">Mode slot-picker được giữ nguyên</p>
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
        <div className="text-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Chú thích trạng thái slot</h4>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-6 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span className="text-green-700">Có thể đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-4 bg-blue-500 border border-blue-600 rounded mr-2"></div>
            <span className="text-blue-700">Đã chọn</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
            <span className="text-red-700">Đã đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
            <span className="text-orange-700">Hạn chế (&lt; 2h)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-4 bg-gray-200 border border-gray-300 rounded mr-2"></div>
            <span className="text-gray-600">Đã qua/Không làm việc</span>
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-gray-500">
          Click vào ô xanh để đặt lịch hẹn
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