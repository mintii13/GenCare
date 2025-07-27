import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  menstrualCycleService, 
  MoodData, 
  DailyMoodData, 
  CreateMoodDataRequest, 
  UpdateMoodDataRequest,
  GetMoodDataRequest,
  MonthlyMoodSummaryResponse 
} from '../services/menstrualCycleService';
import { toast } from 'react-hot-toast';

interface UseMoodDataReturn {
  moodData: MoodData;
  monthlySummary: MonthlyMoodSummaryResponse['data'] | null;
  loading: boolean;
  error: string | null;
  loadMoodData: (request?: GetMoodDataRequest) => Promise<void>;
  loadMonthlySummary: (year: number, month: number) => Promise<void>;
  createMoodData: (request: CreateMoodDataRequest) => Promise<boolean>;
  updateMoodData: (request: UpdateMoodDataRequest) => Promise<boolean>;
  deleteMoodData: (date: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const useMoodData = (userId?: string): UseMoodDataReturn => {
  const [moodData, setMoodData] = useState<MoodData>({});
  const [monthlySummary, setMonthlySummary] = useState<MonthlyMoodSummaryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);
  
  // Cache timeout (5 minutes)
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const loadMoodData = useCallback(async (request?: GetMoodDataRequest) => {
    if (!userId) return;
    
    // Tránh duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Check cache timeout
    const now = Date.now();
    if (now - lastLoadTimeRef.current < CACHE_TIMEOUT && Object.keys(moodData).length > 0) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await menstrualCycleService.getMoodData(request);

      if (response.success && response.data) {
        setMoodData(response.data.mood_data || {});
      } else {
        console.warn('Mood data không có dữ liệu:', response.message);
        setMoodData({});
      }
      
      lastLoadTimeRef.current = now;
    } catch (err: any) {
      console.error('Network error loading mood data:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      } else {
        console.warn('API response error (likely no data):', err.response?.data?.message);
        setError(null);
        setMoodData({});
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId]);

  const loadMonthlySummary = useCallback(async (year: number, month: number) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await menstrualCycleService.getMonthlyMoodSummary(year, month);

      if (response.success && response.data) {
        setMonthlySummary(response.data);
      } else {
        console.warn('Monthly summary không có dữ liệu:', response.message);
        setMonthlySummary(null);
      }
    } catch (err: any) {
      console.error('Network error loading monthly summary:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      } else {
        console.warn('API response error (likely no data):', err.response?.data?.message);
        setError(null);
        setMonthlySummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createMoodData = useCallback(async (request: CreateMoodDataRequest): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await menstrualCycleService.createMoodData(request);

      if (response.success) {
        // Update local state
        setMoodData(prev => ({
          ...prev,
          [request.date]: request.mood_data
        }));
        
        toast.success('Lưu mood data thành công!');
        return true;
      } else {
        const errorMessage = response.message || 'Không thể lưu mood data';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err: any) {
      console.error('Error creating mood data:', err);
      const errorMessage = err.response?.data?.message || 'Không thể lưu mood data';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateMoodData = useCallback(async (request: UpdateMoodDataRequest): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await menstrualCycleService.updateMoodData(request);

      if (response.success) {
        // Update local state
        setMoodData(prev => ({
          ...prev,
          [request.date]: {
            ...prev[request.date],
            ...request.mood_data
          }
        }));
        
        toast.success('Cập nhật mood data thành công!');
        return true;
      } else {
        const errorMessage = response.message || 'Không thể cập nhật mood data';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err: any) {
      console.error('Error updating mood data:', err);
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật mood data';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteMoodData = useCallback(async (date: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await menstrualCycleService.deleteMoodData(date);

      if (response.success) {
        // Update local state
        setMoodData(prev => {
          const newMoodData = { ...prev };
          delete newMoodData[date];
          return newMoodData;
        });
        
        toast.success('Xóa mood data thành công!');
        return true;
      } else {
        const errorMessage = response.message || 'Không thể xóa mood data';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err: any) {
      console.error('Error deleting mood data:', err);
      const errorMessage = err.response?.data?.message || 'Không thể xóa mood data';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    lastLoadTimeRef.current = 0; // Reset cache
    await loadMoodData();
  }, [loadMoodData]);

  useEffect(() => {
    if (userId) {
      loadMoodData();
    }
  }, [userId, loadMoodData]);

  return {
    moodData,
    monthlySummary,
    loading,
    error,
    loadMoodData,
    loadMonthlySummary,
    createMoodData,
    updateMoodData,
    deleteMoodData,
    refresh
  };
};

export default useMoodData; 