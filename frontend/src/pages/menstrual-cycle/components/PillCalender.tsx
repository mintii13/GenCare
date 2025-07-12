import React, { useMemo, useState } from 'react';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { PillSchedule } from '../../../services/pillTrackingService';
import { toast } from 'react-hot-toast';

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

  const handleDayClick = async (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const event = eventsByDate.get(dayKey);
    const dayStart = startOfDay(day);

    if (!event || isBefore(today, dayStart) || event.is_taken) {
        return;
    }
    
    try {
      await onTakePill(event._id);
      toast.success(`Đã đánh dấu ngày ${format(day, 'dd/MM/yyyy')} là đã uống.`);
    } catch (error) {
      toast.error('Không thể đánh dấu đã uống. Vui lòng thử lại.');
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
    taken: 'text-gray-400 line-through opacity-60',
    hormone: 'bg-pink-100',
    placebo: 'bg-gray-200',
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <DayPicker
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays
        className="w-full"
      />
       <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-100 rounded-full border border-pink-300"></div>
                <span>Thuốc nội tiết</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full border border-gray-300"></div>
                <span>Thuốc giả dược</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-400 line-through">12</span>
                <span>Đã uống</span>
            </div>
        </div>
    </div>
  );
};

export default PillCalendar; 