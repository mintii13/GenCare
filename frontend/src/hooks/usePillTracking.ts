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
        setSchedules(response.data.schedules || []);
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
    markPillAsTaken 
  };
};