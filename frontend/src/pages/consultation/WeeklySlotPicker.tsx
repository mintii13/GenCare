import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface WorkingHours {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
}

interface DaySchedule {
  date: string;
  is_working_day: boolean;
  working_hours?: WorkingHours;
  available_slots: TimeSlot[];
  total_slots: number;
  booked_appointments: Array<{
    appointment_id: string;
    start_time: string;
    end_time: string;
    status: string;
    customer_name: string;
  }>;
}

interface WeeklyScheduleData {
  week_start_date: string;
  week_end_date: string;
  consultant_id: string;
  schedule_id: string;
  days: {
    [key: string]: DaySchedule;
  };
  summary: {
    total_working_days: number;
    total_available_slots: number;
    total_booked_slots: number;
  };
}

interface Props {
  consultantId: string;
  onSlotSelect: (date: string, startTime: string, endTime: string) => void;
  selectedSlot?: { date: string; startTime: string; endTime: string } | null;
}

const WeeklySlotPicker: React.FC<Props> = ({ consultantId, onSlotSelect, selectedSlot }) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyData, setWeeklyData] = useState<WeeklyScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  useEffect(() => {
    fetchWeeklySchedule();
  }, [consultantId, currentWeek]);

  const fetchWeeklySchedule = async () => {
    if (!consultantId) return;

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/weekly-schedule/weekly-slots/${consultantId}?week_start_date=${weekStartDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setWeeklyData(data.data);
      } else {
        setError(data.message || 'Không thể tải lịch làm việc');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleSlotClick = (date: string, startTime: string, endTime: string) => {
    onSlotSelect(date, startTime, endTime);
  };

  const isSlotSelected = (date: string, startTime: string, endTime: string) => {
    return selectedSlot?.date === date && 
           selectedSlot?.startTime === startTime && 
           selectedSlot?.endTime === endTime;
  };

  const formatDateDisplay = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM', { locale: vi });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải lịch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchWeeklySchedule}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-600">
          <p>Chuyên gia chưa có lịch làm việc cho tuần này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousWeek}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          disabled={loading}
        >
          ←
        </button>
        
        <div className="text-center">
          <h3 className="font-semibold text-lg">
            Tuần {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
          </h3>
          <p className="text-sm text-gray-600">
            {weeklyData.summary.total_available_slots} slot trống / {weeklyData.summary.total_available_slots + weeklyData.summary.total_booked_slots} tổng slot
          </p>
        </div>
        
        <button
          onClick={handleNextWeek}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          disabled={loading}
        >
          →
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((dayName, index) => {
          const dayData = weeklyData.days[dayName];
          const currentDate = addDays(currentWeek, index);
          const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isPast = currentDate < new Date();

          return (
            <div key={dayName} className="min-h-[200px]">
              {/* Day Header */}
              <div className={`text-center p-2 rounded-t-lg border-b ${
                isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'
              }`}>
                <div className="font-medium text-sm">{dayLabels[index]}</div>
                <div className="text-xs">{formatDateDisplay(format(currentDate, 'yyyy-MM-dd'))}</div>
              </div>

              {/* Day Content */}
              <div className="border border-t-0 rounded-b-lg p-2 min-h-[150px]">
                {!dayData?.is_working_day ? (
                  <div className="text-center text-gray-400 text-sm mt-4">
                    Nghỉ làm
                  </div>
                ) : isPast ? (
                  <div className="text-center text-gray-400 text-sm mt-4">
                    Đã qua
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Working Hours Info */}
                    {dayData.working_hours && (
                      <div className="text-xs text-gray-600 mb-2">
                        {dayData.working_hours.start_time} - {dayData.working_hours.end_time}
                        {dayData.working_hours.break_start && (
                          <div>Nghỉ: {dayData.working_hours.break_start} - {dayData.working_hours.break_end}</div>
                        )}
                      </div>
                    )}

                    {/* Available Slots */}
                    {dayData.available_slots?.filter(slot => slot.is_available).map((slot, slotIndex) => (
                      <button
                        key={slotIndex}
                        onClick={() => handleSlotClick(format(currentDate, 'yyyy-MM-dd'), slot.start_time, slot.end_time)}
                        className={`w-full text-xs p-1 rounded border transition-colors ${
                          isSlotSelected(format(currentDate, 'yyyy-MM-dd'), slot.start_time, slot.end_time)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {slot.start_time} - {slot.end_time}
                      </button>
                    ))}

                    {/* Booked Slots */}
                    {dayData.booked_appointments?.map((appointment, index) => (
                      <div
                        key={index}
                        className="w-full text-xs p-1 rounded bg-red-50 text-red-700 border border-red-200"
                        title={`Đã đặt bởi ${appointment.customer_name}`}
                      >
                        {appointment.start_time} - {appointment.end_time}
                      </div>
                    ))}

                    {/* No slots available */}
                    {dayData.available_slots?.filter(slot => slot.is_available).length === 0 && 
                     dayData.booked_appointments?.length === 0 && (
                      <div className="text-center text-gray-400 text-sm mt-4">
                        Không có slot
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span>Slot trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Đã chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Nghỉ làm</span>
        </div>
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Đã chọn:</strong> {format(new Date(selectedSlot.date), 'EEEE, dd/MM/yyyy', { locale: vi })} 
            , {selectedSlot.startTime} - {selectedSlot.endTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklySlotPicker; 