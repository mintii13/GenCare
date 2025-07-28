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
          isArray: Array.isArray(cyclesResponse.data),
          length: cyclesResponse.data?.length,
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
          isArray: Array.isArray(cyclesResponse.data),
          length: cyclesResponse.data?.length
        });
        
        // Ensure cycles is always an array
        const cyclesData = Array.isArray(cyclesResponse.data) ? cyclesResponse.data : [];
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
          isArray: Array.isArray(cyclesResponse.data),
          length: cyclesResponse.data?.length
        });
        
        // Ensure cycles is always an array
        const cyclesData = Array.isArray(cyclesResponse.data) ? cyclesResponse.data : [];
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
    refresh
  };
};

export default useMenstrualCycle; 