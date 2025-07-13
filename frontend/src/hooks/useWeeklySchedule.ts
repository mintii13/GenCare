import { useState, useEffect, useCallback } from 'react';
import { addWeeks, subWeeks } from 'date-fns';
import { WeeklyScheduleData, Schedule, WeeklySlotData } from '../types/schedule';
import { weeklyScheduleService } from '../services/weeklyScheduleService';
import { appointmentService } from '../services/appointmentService';
import { getWeekStart, getWeekRange } from '../utils/dateUtils';
import { log } from '../utils/logger';

interface UseWeeklyScheduleProps {
  consultantId?: string;
  mode: 'my-schedule' | 'consultant-schedule' | 'slot-booking';
  initialWeek?: Date;
}

interface UseWeeklyScheduleReturn {
  // State
  currentWeek: Date;
  scheduleData: WeeklyScheduleData | null;
  weeklySlotData: WeeklySlotData | null;
  existingSchedule: Schedule | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  retryCount: number;

  // Actions
  setCurrentWeek: (week: Date) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  fetchWeekData: () => Promise<void>;
  saveSchedule: (data: WeeklyScheduleData) => Promise<boolean>;
  copyFromPreviousWeek: () => Promise<boolean>;
  handleRetry: () => void;

  // Utilities
  canNavigateToPrevious: boolean;
}

export const useWeeklySchedule = ({
  consultantId,
  mode,
  initialWeek
}: UseWeeklyScheduleProps): UseWeeklyScheduleReturn => {
  const [currentWeek, setCurrentWeek] = useState<Date>(
    initialWeek || getWeekStart()
  );
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData | null>(null);
  const [weeklySlotData, setWeeklySlotData] = useState<WeeklySlotData | null>(null);
  const [existingSchedule, setExistingSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Navigation handlers
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  }, []);

  // Fetch schedule data for management
  const fetchScheduleForWeek = useCallback(async () => {
    if (mode === 'slot-booking') return;
    
    try {
      const { weekStart } = getWeekRange(currentWeek);
      
            let response: any;
      if (mode === 'my-schedule') {
        response = await weeklyScheduleService.getMySchedules(weekStart, weekStart);
      } else if (mode === 'consultant-schedule' && consultantId) {
        response = await weeklyScheduleService.getConsultantSchedules(consultantId, weekStart, weekStart);
      } else {
        return;
      }

      if ((response as any).success && (response as any).data?.schedules?.length > 0) {
        const targetWeekStart = weekStart;
        
        const matchingSchedule = (response as any).data.schedules.find((schedule: Schedule) => {
          return schedule.week_start_date === targetWeekStart;
        });

        if (matchingSchedule) {
          setExistingSchedule(matchingSchedule);
          setScheduleData({
            working_days: matchingSchedule.working_days || {},
            default_slot_duration: matchingSchedule.default_slot_duration || 30,
            notes: matchingSchedule.notes || ''
          });
        } else {
          setExistingSchedule(null);
          setScheduleData({
            working_days: {},
            default_slot_duration: 30,
            notes: ''
          });
        }
      } else {
        setExistingSchedule(null);
        setScheduleData({
          working_days: {},
          default_slot_duration: 30,
          notes: ''
        });
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải lịch làm việc');
      log.error('useWeeklySchedule', 'Error fetching schedule', err);
    }
  }, [currentWeek, mode, consultantId]);

  // Fetch slot data for booking
  const fetchWeeklySlots = useCallback(async () => {
    if (mode !== 'slot-booking' || !consultantId) return;

    try {
      const { weekStart } = getWeekRange(currentWeek);
      const response = await weeklyScheduleService.getWeeklySlots(consultantId, weekStart);

      if ((response as any).success && (response as any).data) {
        setWeeklySlotData((response as any).data);
      } else {
        // Create empty placeholder so UI vẫn hiển thị để điều hướng tuần
        const { weekStart, weekEnd } = getWeekRange(currentWeek);
        setWeeklySlotData({
          week_start_date: weekStart,
          week_end_date: weekEnd,
          consultant_id: consultantId!,
          schedule_id: '',
          days: {},
          summary: {
            total_working_days: 0,
            total_available_slots: 0,
            total_booked_slots: 0
          }
        } as any);
        setError(null);
      }
    } catch (err) {
      const { weekStart, weekEnd } = getWeekRange(currentWeek);
      setWeeklySlotData({
        week_start_date: weekStart,
        week_end_date: weekEnd,
        consultant_id: consultantId!,
        schedule_id: '',
        days: {},
        summary: { total_working_days:0,total_available_slots:0,total_booked_slots:0 }
      } as any);
      setError(null);
    }
  }, [currentWeek, consultantId, mode]);

  // Main fetch function
  const fetchWeekData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'slot-booking') {
        await fetchWeeklySlots();
      } else {
        await fetchScheduleForWeek();
      }
    } catch (err) { 
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [mode, fetchWeeklySlots, fetchScheduleForWeek]);

  // Save schedule
  const saveSchedule = useCallback(async (data: WeeklyScheduleData): Promise<boolean> => {
    if (mode === 'slot-booking') return false;
    
    setSaving(true);
    try {
      const { weekStart, weekEnd } = getWeekRange(currentWeek);

      const requestData = {
        week_start_date: weekStart,
        week_end_date: weekEnd,
        working_days: data.working_days,
        default_slot_duration: data.default_slot_duration,
        notes: data.notes
      };

      let response;
      if (existingSchedule) {
        response = await weeklyScheduleService.updateSchedule(existingSchedule._id, requestData);
      } else {
        response = await weeklyScheduleService.createSchedule(requestData);
      }

      if ((response as any).success) {
        await fetchWeekData(); // Refresh data
        return true;
      } else {
        setError((response as any).message || 'Có lỗi xảy ra khi lưu lịch');
        return false;
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu lịch làm việc');
      return false;
    } finally {
      setSaving(false);
    }
  }, [currentWeek, existingSchedule, mode, fetchWeekData]);

  // Copy from previous week
  const copyFromPreviousWeek = useCallback(async (): Promise<boolean> => {
    if (!existingSchedule) return false;

    try {
      const { weekStart } = getWeekRange(addWeeks(currentWeek, 1));
      const response = await weeklyScheduleService.copySchedule(existingSchedule._id, weekStart);

      if ((response as any).success) {
        return true;
      } else {
        setError((response as any).message || 'Không thể sao chép lịch');
        return false;
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi sao chép lịch');
      return false;
    }
  }, [existingSchedule, currentWeek]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchWeekData();
  }, [fetchWeekData]);

  // Auto fetch when week changes
  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  // Check if can navigate to previous week
  const canNavigateToPrevious = currentWeek > subWeeks(new Date(), 1);

  return {
    // State
    currentWeek,
    scheduleData,
    weeklySlotData,
    existingSchedule,
    loading,
    saving,
    error,
    retryCount,

    // Actions
    setCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    fetchWeekData,
    saveSchedule,
    copyFromPreviousWeek,
    handleRetry,

    // Utilities
    canNavigateToPrevious
  };
};