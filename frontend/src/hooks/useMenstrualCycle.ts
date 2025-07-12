import { useState, useEffect, useCallback, useRef } from 'react';
import { menstrualCycleService, TodayStatus, CycleData } from '../services/menstrualCycleService';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);
  
  // Cache timeout (5 minutes)
  const CACHE_TIMEOUT = 5 * 60 * 1000;

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    // Tránh duplicate calls
    if (isLoadingRef.current) {


      return;
    }

    // Check cache timeout
    const now = Date.now();
    if (now - lastLoadTimeRef.current < CACHE_TIMEOUT && cycles.length > 0) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const [todayResponse, cyclesResponse] = await Promise.all([
        menstrualCycleService.getTodayStatus(),
        menstrualCycleService.getCycles()
      ]);

      // Xử lý response cho user mới (success=true nhưng có thể data=null/[])
      if (todayResponse.success) {
        setTodayStatus(todayResponse.data || null);
      } else {
        // Chỉ log warning, không set error cho user chưa có dữ liệu
        console.warn('Today status không có dữ liệu:', todayResponse.message);
        setTodayStatus(null);
      }

      if (cyclesResponse.success) {
        setCycles(cyclesResponse.data || []);
      } else {
        // Chỉ log warning, không set error cho user chưa có dữ liệu
        console.warn('Cycles không có dữ liệu:', cyclesResponse.message);
        setCycles([]);
      }
      
      lastLoadTimeRef.current = now;
    } catch (err: any) {
      // Chỉ hiển thị error cho network errors hoặc server errors thật sự
      console.error('Network error loading menstrual cycle data:', err);
      if (err.response?.status >= 500 || !err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
      } else {
        // Cho các lỗi 4xx, không hiển thị error (có thể là user chưa có dữ liệu)
        console.warn('API response error (likely no data):', err.response?.data?.message);
        setError(null);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userId, cycles.length]);

  const refresh = useCallback(async () => {
    lastLoadTimeRef.current = 0; // Reset cache
    await loadData();
  }, [loadData]);

  useEffect(() => {
    if (userId) {
      loadData();
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