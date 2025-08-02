import React, { useMemo, useState } from 'react';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { PillSchedule } from '../../../services/pillTrackingService';
import { toast } from 'react-hot-toast';
import { FaCheck } from 'react-icons/fa';

interface PillCalendarProps {
  schedules: PillSchedule[];
  onTakePill: (scheduleId: string) => Promise<void>;
}

const PillCalendar: React.FC<PillCalendarProps> = ({ schedules, onTakePill }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PillSchedule>();
    schedules.forEach(schedule => {
        map.set(format(parseISO(schedule.pill_start_date), 'yyyy-MM-dd'), schedule);
    });
    return map;
  }, [schedules]);

  // Tính toán thống kê
  const stats = useMemo(() => {
    const total = schedules.length;
    const taken = schedules.filter(s => s.is_taken).length;
    const hormone = schedules.filter(s => s.pill_status === 'hormone').length;
    const placebo = schedules.filter(s => s.pill_status === 'placebo').length;
    const hormoneTaken = schedules.filter(s => s.pill_status === 'hormone' && s.is_taken).length;
    const placeboTaken = schedules.filter(s => s.pill_status === 'placebo' && s.is_taken).length;
    
    return {
      total,
      taken,
      remaining: total - taken,
      hormone,
      placebo,
      hormoneTaken,
      placeboTaken,
      progress: total > 0 ? Math.round((taken / total) * 100) : 0
    };
  }, [schedules]);

  const handleDayClick = async (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const event = eventsByDate.get(dayKey);
    const dayStart = startOfDay(day);

    if (!event) {
        return; // Không có lịch uống thuốc cho ngày này
    }

    if (isBefore(today, dayStart)) {
        toast.error('Không thể đánh dấu ngày trong tương lai');
        return;
    }

    if (event.is_taken) {
        toast.success(`Ngày ${format(day, 'dd/MM/yyyy')} đã được đánh dấu là đã uống`);
        return;
    }
    
    try {
      await onTakePill(event._id);
      toast.success(`✅ Đã đánh dấu ngày ${format(day, 'dd/MM/yyyy')} là đã uống thuốc`);
    } catch (error) {
      toast.error('❌ Không thể đánh dấu đã uống. Vui lòng thử lại.');
    }
  };

  const modifiers = {
    taken: (day: Date) => {
      const event = eventsByDate.get(format(day, 'yyyy-MM-dd'));
      return event?.is_taken || false;
    },
    hormone: (day: Date) => {
        const event = eventsByDate.get(format(day, 'yyyy-MM-dd'));
        return event?.pill_status === 'hormone' && !event.is_taken;
    },
    placebo: (day: Date) => {
        const event = eventsByDate.get(format(day, 'yyyy-MM-dd'));
        return event?.pill_status === 'placebo' && !event.is_taken;
    },
  };

  const modifiersClassNames = {
    today: 'bg-blue-100 text-blue-800 font-bold rounded-full',
    taken: 'bg-green-100 text-green-800 font-semibold relative',
    hormone: 'bg-pink-100',
    placebo: 'bg-gray-200',
  };

  // Custom component để hiển thị ngày với ô tích
  const renderDay = (props: any) => {
    const { day } = props;
    const dayKey = format(day, 'yyyy-MM-dd');
    const event = eventsByDate.get(dayKey);
    const isTaken = event?.is_taken || false;
    const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isPast = isBefore(day, today);
    const hasPill = !!event;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={`text-sm ${isPast && !isTaken && hasPill ? 'text-red-500 font-semibold' : ''}`}>
          {format(day, 'd')}
        </span>
        {isTaken && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <FaCheck className="text-white text-xs" />
          </div>
        )}
        {isToday && !isTaken && hasPill && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
        )}
        {isPast && !isTaken && hasPill && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Thống kê */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tiến độ uống thuốc</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex justify-between">
            <span>Đã uống:</span>
            <span className="font-semibold text-green-600">{stats.taken}/{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span>Còn lại:</span>
            <span className="font-semibold text-orange-600">{stats.remaining}</span>
          </div>
          <div className="flex justify-between">
            <span>Thuốc nội tiết:</span>
            <span className="font-semibold text-pink-600">{stats.hormoneTaken}/{stats.hormone}</span>
          </div>
          <div className="flex justify-between">
            <span>Thuốc giả dược:</span>
            <span className="font-semibold text-gray-600">{stats.placeboTaken}/{stats.placebo}</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Tiến độ</span>
            <span>{stats.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${stats.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <DayPicker
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays
        className="w-full"
        components={{
          Day: renderDay
        }}
      />
       <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-700">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-pink-100 rounded-full border border-pink-300"></div>
                <span>Thuốc nội tiết</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded-full border border-gray-300"></div>
                <span>Thuốc giả dược</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                </div>
                <span>Đã uống</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Hôm nay</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Quên uống</span>
            </div>
        </div>
    </div>
  );
};

export default PillCalendar; 