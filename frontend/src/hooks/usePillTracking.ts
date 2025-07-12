import { useState, useEffect, useCallback } from 'react';
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
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  setupPillSchedule: (data: SetupPillTrackingRequest) => Promise<ApiResponse<any>>;
  updatePillSchedule: (data: UpdatePillTrackingRequest) => Promise<ApiResponse<any>>;
  markPillAsTaken: (scheduleId: string) => Promise<void>;
}

export const usePillTracking = (): UsePillTrackingReturn => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<PillSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await pillTrackingService.getSchedule(user.id);
      if (response.success && response.data) {
        setSchedules(response.data.schedules || []);
      } else {
        // Không set error cho user chưa có pill schedule - đây là trạng thái bình thường
        setSchedules([]);
      }
      setIsLoading(false);
    } catch (err: any) {
      // Chỉ set error cho network errors hoặc server errors thật sự
      if (err.response?.status >= 500 || !err.response) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      } else if (err.response?.status === 404) {
        // 404 có nghĩa là user chưa có pill schedule - không phải error
        // User chưa setup pill tracking
        setSchedules([]);
      } else {
        setError("Lỗi khi tải lịch uống thuốc.");
      }
      setIsLoading(false);
    }
  }, [user]);

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
  }, [user, refresh]);

  const updatePillSchedule = useCallback(async (data: UpdatePillTrackingRequest) => {
    if (!user?.id) throw new Error("User not found");
    try {
      const updatedSchedule = await pillTrackingService.updateSchedule(user.id, data);
      await refresh();
      return updatedSchedule;
    } catch (error) {
      console.error("Failed to update pill schedule:", error);
      throw error;
    }
  }, [user, refresh]);

  const markPillAsTaken = useCallback(async (scheduleId: string) => {
    try {
      await pillTrackingService.takePill(scheduleId);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { 
    schedules, 
    isLoading, 
    error, 
    refresh, 
    setupPillSchedule, 
    updatePillSchedule,
    markPillAsTaken 
  };
};