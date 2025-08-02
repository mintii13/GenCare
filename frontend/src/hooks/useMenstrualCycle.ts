import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  menstrualCycleService, 
  TodayStatus, 
  CycleData 
} from '../services/menstrualCycleService';
import { toast } from 'react-hot-toast';

interface UseMenstrualCycleReturn {
  todayStatus: TodayStatus | null;
  cycles: CycleData[];
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  deletePeriodDay: (date: string) => Promise<boolean>;
  deleteCycle: (cycleId: string) => Promise<boolean>;
  detectPregnancy: () => Promise<{
    isPotential: boolean;
    daysLate: number;
    lastPeriodDate?: string;
    expectedPeriodDate?: string;
  } | null>;
}

const useMenstrualCycle = (userId?: string): UseMenstrualCycleReturn => {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  console.log('[useMenstrualCycle] Hook called, userId:', userId, 'loading:', loading, 'hasLoaded:', hasLoadedRef.current);

  const loadData = useCallback(async () => {
    if (!userId) {
      console.log('[useMenstrualCycle] Skipping loadData - no userId');
      return;
    }

    console.log('[useMenstrualCycle] Starting loadData with userId:', userId);
    setLoading(true);
    setError(null);
    
    try {
      const [todayResponse, cyclesResponse] = await Promise.all([
        menstrualCycleService.getTodayStatus(),
        menstrualCycleService.getCycles()
      ]);

      console.log('[useMenstrualCycle] API responses:', { 
        todayResponse: {
          success: todayResponse.success,
          data: todayResponse.data,
          message: todayResponse.message
        }, 
        cyclesResponse: {
          success: cyclesResponse.success,
          data: cyclesResponse.data,
          dataType: typeof cyclesResponse.data,
          cycles: cyclesResponse.data?.cycles,
          total: cyclesResponse.data?.total,
          message: cyclesResponse.message
        }
      });

      if (todayResponse.success) {
        setTodayStatus(todayResponse.data || null);
      } else {
        console.warn('Today status không có dữ liệu:', todayResponse.message);
        setTodayStatus(null);
      }

      if (cyclesResponse.success) {
        console.log('[useMenstrualCycle] Cycles response data:', {
          data: cyclesResponse.data,
          dataType: typeof cyclesResponse.data,
          cycles: cyclesResponse.data?.cycles,
          total: cyclesResponse.data?.total
        });
        
        // Handle new response structure: { cycles: CycleData[], total: number }
        const cyclesData = cyclesResponse.data?.cycles || [];
        console.log('[useMenstrualCycle] Setting cycles to:', cyclesData);
        setCycles(cyclesData);
      } else {
        console.warn('Cycles không có dữ liệu:', cyclesResponse.message);
        setCycles([]);
      }
      
    } catch (err: any) {
      console.error('[useMenstrualCycle] API error:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      } else {
        console.warn('API response error (likely no data):', err.response?.data?.message);
        setError(null);
      }
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
      console.log('[useMenstrualCycle] loadData completed');
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    console.log('[useMenstrualCycle] refresh called');
    hasLoadedRef.current = false; // Reset loaded flag
    setLoading(true);
    setError(null);
    
    try {
      const [todayResponse, cyclesResponse] = await Promise.all([
        menstrualCycleService.getTodayStatus(),
        menstrualCycleService.getCycles()
      ]);

      console.log('[useMenstrualCycle] Refresh API responses:', { todayResponse, cyclesResponse });

      if (todayResponse.success) {
        setTodayStatus(todayResponse.data || null);
      } else {
        console.warn('Today status không có dữ liệu:', todayResponse.message);
        setTodayStatus(null);
      }

      if (cyclesResponse.success) {
        console.log('[useMenstrualCycle] Refresh cycles response data:', {
          data: cyclesResponse.data,
          dataType: typeof cyclesResponse.data,
          cycles: cyclesResponse.data?.cycles,
          total: cyclesResponse.data?.total
        });
        
        // Handle new response structure: { cycles: CycleData[], total: number }
        const cyclesData = cyclesResponse.data?.cycles || [];
        console.log('[useMenstrualCycle] Refresh setting cycles to:', cyclesData);
        setCycles(cyclesData);
      } else {
        console.warn('Cycles không có dữ liệu:', cyclesResponse.message);
        setCycles([]);
      }
      
    } catch (err: any) {
      console.error('[useMenstrualCycle] Refresh API error:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      } else {
        console.warn('API response error (likely no data):', err.response?.data?.message);
        setError(null);
      }
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
      console.log('[useMenstrualCycle] refresh completed');
    }
  }, []);

  const deletePeriodDay = useCallback(async (date: string): Promise<boolean> => {
    try {
      console.log('[useMenstrualCycle] Deleting period day:', date);
      const response = await menstrualCycleService.deletePeriodDay(date);
      
      if (response.success) {
        toast.success('Đã xóa ngày hành kinh thành công');
        // Refresh data after deletion
        await refresh();
        return true;
      } else {
        toast.error(response.message || 'Lỗi khi xóa ngày hành kinh');
        return false;
      }
    } catch (error: any) {
      console.error('[useMenstrualCycle] Error deleting period day:', error);
      toast.error('Lỗi khi xóa ngày hành kinh');
      return false;
    }
  }, [refresh]);

  const detectPregnancy = useCallback(async () => {
    try {
      console.log('[useMenstrualCycle] Detecting pregnancy');
      const response = await menstrualCycleService.detectPregnancy();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        console.warn('Pregnancy detection failed:', response.message);
        return null;
      }
    } catch (error: any) {
      console.error('[useMenstrualCycle] Error detecting pregnancy:', error);
      return null;
    }
  }, []);

  const deleteCycle = useCallback(async (cycleId: string): Promise<boolean> => {
    try {
      console.log('[useMenstrualCycle] Deleting cycle:', cycleId);
      const response = await menstrualCycleService.deleteCycle(cycleId);
      
      if (response.success) {
        toast.success('Đã xóa chu kỳ thành công');
        // Refresh data after deletion
        await refresh();
        return true;
      } else {
        toast.error(response.message || 'Lỗi khi xóa chu kỳ');
        return false;
      }
    } catch (error: any) {
      console.error('[useMenstrualCycle] Error deleting cycle:', error);
      toast.error('Lỗi khi xóa chu kỳ');
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    console.log('[useMenstrualCycle] useEffect triggered, userId:', userId);
    if (userId) {
      loadData();
    } else {
      setLoading(false);
      setError(null);
      setTodayStatus(null);
      setCycles([]);
      hasLoadedRef.current = false;
    }
  }, [userId, loadData]);

  return {
    todayStatus,
    cycles,
    loading,
    error,
    loadData,
    refresh,
    deletePeriodDay,
    deleteCycle,
    detectPregnancy
  };
};

export default useMenstrualCycle; 