import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiResponse } from '../services/apiClient';
import {
  pillTrackingService,
  PillSchedule,
  SetupPillTrackingRequest,
  UpdatePillTrackingRequest
} from '../services/pillTrackingService';

interface UsePillTrackingReturn {
  schedules: PillSchedule[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setupPillSchedule: (data: SetupPillTrackingRequest) => Promise<ApiResponse<any>>;
  updatePillSchedule: (data: UpdatePillTrackingRequest) => Promise<ApiResponse<any>>;
  markPillAsTaken: (scheduleId: string) => Promise<void>;
  clearSchedules: () => Promise<void>;
  testReminder: () => Promise<void>;
  disableReminder: () => Promise<void>;
  enableReminder: () => Promise<void>;
  updatePillTime: (scheduleId: string, newTime: string) => Promise<void>;
  updatePillType: (scheduleId: string, newType: '21-day' | '24+4' | '21+7') => Promise<void>;
  debug: () => Promise<ApiResponse<any>>;
}

export const usePillTracking = (): UsePillTrackingReturn => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<PillSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  // Debug log with user object details
  console.log('[usePillTracking] Hook called:', {
    user_id: user?.id,
    user_email: user?.email,
    loading,
    hasLoaded: hasLoadedRef.current,
    lastUserId: lastUserIdRef.current,
    userChanged: lastUserIdRef.current !== user?.id
  });

  // Track user changes
  if (lastUserIdRef.current !== user?.id) {
    console.log('[usePillTracking] User changed from', lastUserIdRef.current, 'to', user?.id);
    lastUserIdRef.current = user?.id;
    hasLoadedRef.current = false; // Reset loaded flag when user changes
  }

  const loadData = useCallback(async () => {
    console.log('[usePillTracking] loadData called, user.id:', user?.id, 'hasLoaded:', hasLoadedRef.current);
    
    if (!user?.id || hasLoadedRef.current) {
      console.log('[usePillTracking] Skipping loadData - no user or already loaded');
      return;
    }
    
    hasLoadedRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('[usePillTracking] Making API call to getSchedule');
      const response = await pillTrackingService.getSchedule();
      console.log('[usePillTracking] API response:', response);
      
      if (response.success && response.data) {
        setSchedules(response.data || []);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error('[usePillTracking] API error:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      } else if (err.response?.status === 404) {
        setSchedules([]);
      } else {
        setError("Lỗi khi tải lịch uống thuốc.");
      }
    } finally {
      setLoading(false);
      console.log('[usePillTracking] loadData completed');
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    console.log('[usePillTracking] refresh called');
    hasLoadedRef.current = false; // Reset loaded flag
    await loadData();
  }, [loadData]);

  const setupPillSchedule = useCallback(async (data: SetupPillTrackingRequest) => {
    if (!user?.id) throw new Error("User not found");
    try {
      const newSchedule = await pillTrackingService.setup({ ...data, userId: user.id });
      if (!newSchedule.success) {
        throw new Error(newSchedule.message || 'Setup failed');
      }
      await refresh();
      return newSchedule;
    } catch (error) {
      console.error("Failed to setup pill schedule:", error);
      throw error;
    }
  }, [user?.id, refresh]);

  const updatePillSchedule = useCallback(async (data: UpdatePillTrackingRequest) => {
    if (!user?.id) throw new Error("User not found");
    try {
      const updatedSchedule = await pillTrackingService.updateSchedule(data);
      await refresh();
      return updatedSchedule;
    } catch (error) {
      console.error("Failed to update pill schedule:", error);
      throw error;
    }
  }, [user?.id, refresh]);

  const markPillAsTaken = useCallback(async (scheduleId: string) => {
    try {
      await pillTrackingService.takePill(scheduleId);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  }, [refresh]);

  const clearSchedules = useCallback(async () => {
    try {
      console.log('[usePillTracking] Clearing all pill schedules');
      await pillTrackingService.clearSchedules();
      setSchedules([]);
      hasLoadedRef.current = false;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa lịch uống thuốc.');
    }
  }, []);

  const debug = useCallback(async () => {
    try {
      console.log('[usePillTracking] Debug pill tracking');
      const result = await pillTrackingService.debug();
      console.log('[usePillTracking] Debug result:', result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Lỗi khi debug lịch uống thuốc.');
      throw err;
    }
  }, []);

  const testReminder = useCallback(async () => {
    try {
      console.log('[usePillTracking] Testing reminder');
      await pillTrackingService.testReminder();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi test mail nhắc nhở.');
    }
  }, []);

  const disableReminder = useCallback(async () => {
    try {
      console.log('[usePillTracking] Disabling reminder');
      await pillTrackingService.disableReminder();
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tắt nhắc nhở uống thuốc.');
    }
  }, [refresh]);

  const enableReminder = useCallback(async () => {
    try {
      console.log('[usePillTracking] Enabling reminder');
      await pillTrackingService.enableReminder();
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi bật nhắc nhở uống thuốc.');
    }
  }, [refresh]);

  const updatePillTime = useCallback(async (scheduleId: string, newTime: string) => {
    try {
      console.log('[usePillTracking] updatePillTime called');
      console.log('[usePillTracking] Schedule ID:', scheduleId);
      console.log('[usePillTracking] New time:', newTime);
      console.log('[usePillTracking] Current schedules count:', schedules.length);
      
      // Tìm schedule để lấy menstrual_cycle_id
      const schedule = schedules.find(s => s._id === scheduleId);
      if (!schedule) {
        console.error('[usePillTracking] Schedule not found with ID:', scheduleId);
        throw new Error('Không tìm thấy lịch uống thuốc');
      }
      
      console.log('[usePillTracking] Found schedule:', {
        _id: schedule._id,
        menstrual_cycle_id: schedule.menstrual_cycle_id,
        pill_start_date: schedule.pill_start_date,
        reminder_time: schedule.reminder_time
      });
      
      console.log('[usePillTracking] Calling pillTrackingService.updateSpecificSchedule...');
      await pillTrackingService.updateSpecificSchedule(schedule.menstrual_cycle_id, { reminder_time: newTime });
      console.log('[usePillTracking] API call successful');
      
      console.log('[usePillTracking] Calling refresh...');
      await refresh();
      console.log('[usePillTracking] Refresh completed');
    } catch (err: any) {
      console.error('[usePillTracking] Error updating pill time:', err);
      console.error('[usePillTracking] Error details:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      });
      setError(err.message || 'Lỗi khi cập nhật giờ uống thuốc.');
      throw err;
    }
  }, [refresh, schedules]);

  const updatePillType = useCallback(async (scheduleId: string, newType: '21-day' | '24+4' | '21+7') => {
    try {
      console.log('[usePillTracking] Updating pill type for schedule:', scheduleId, 'to:', newType);
      
      // Tìm schedule để lấy menstrual_cycle_id
      const schedule = schedules.find(s => s._id === scheduleId);
      if (!schedule) {
        throw new Error('Không tìm thấy lịch uống thuốc');
      }
      
      await pillTrackingService.updateSpecificSchedule(schedule.menstrual_cycle_id, { pill_type: newType });
      await refresh();
    } catch (err: any) {
      console.error('[usePillTracking] Error updating pill type:', err);
      setError(err.message || 'Lỗi khi cập nhật loại thuốc.');
      throw err;
    }
  }, [refresh, schedules]);

  useEffect(() => {
    console.log('[usePillTracking] useEffect triggered, user.id:', user?.id);
    if (user?.id && !hasLoadedRef.current) {
      loadData();
    } else if (!user?.id) {
      setLoading(false);
      setError(null);
      setSchedules([]);
      hasLoadedRef.current = false;
    }
  }, [user?.id]);

    return {
    schedules,
    loading,
    error,
    refresh,
    setupPillSchedule,
    updatePillSchedule,
    markPillAsTaken,
    clearSchedules,
    testReminder,
    disableReminder,
    enableReminder,
    updatePillTime,
    updatePillType,
    debug
  };
};