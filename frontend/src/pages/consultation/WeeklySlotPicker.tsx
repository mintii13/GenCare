import React from 'react';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import WeeklyCalendarView from '../../components/schedule/WeeklyCalendarView';
import { validateSlotTime } from '../../utils/dateUtils';
import { log } from '../../utils/logger';
import toast from 'react-hot-toast';

interface Props {
  consultantId: string;
  onSlotSelect: (date: string, startTime: string, endTime: string) => void;
  selectedSlot?: { date: string; startTime: string; endTime: string } | null;
}

const WeeklySlotPicker: React.FC<Props> = ({ consultantId, onSlotSelect, selectedSlot }) => {
  const {
    currentWeek,
    weeklySlotData,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    handleRetry
  } = useWeeklySchedule({
    consultantId,
    mode: 'slot-booking'
  });

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    const validation = validateSlotTime(date, startTime);
    
    if (!validation.isValid) {
      toast.error(validation.error!);
      log.warn('WeeklySlotPicker', 'Slot validation failed', { date, startTime, error: validation.error });
      return;
    }

    log.info('WeeklySlotPicker', 'Slot selected', { date, startTime, endTime });
    onSlotSelect(date, startTime, endTime);
  };

  return (
    <WeeklyCalendarView
      currentWeek={currentWeek}
      weeklyData={weeklySlotData}
      selectedSlot={selectedSlot}
      mode="slot-picker"
      onSlotSelect={handleSlotSelect}
      onPreviousWeek={goToPreviousWeek}
      onNextWeek={goToNextWeek}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    />
  );
};

export default WeeklySlotPicker;