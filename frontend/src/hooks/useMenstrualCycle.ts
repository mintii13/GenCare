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
      console.log('⏳ useMenstrualCycle: Load already in progress, skipping...');
      return;
    }

    // Check cache timeout
    const now = Date.now();
    if (now - lastLoadTimeRef.current < CACHE_TIMEOUT && cycles.length > 0) {
      console.log('📦 useMenstrualCycle: Using cached data');
      return;
    }
    
    try {
      console.log('🔄 useMenstrualCycle: Loading data...');
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const [todayResponse, cyclesResponse] = await Promise.all([
        menstrualCycleService.getTodayStatus(),
        menstrualCycleService.getCycles()
      ]);

      console.log('📊 useMenstrualCycle: Data loaded successfully');

      if (todayResponse.success && todayResponse.data) {
        setTodayStatus(todayResponse.data);
      }

      if (cyclesResponse.success && cyclesResponse.data) {
        setCycles(cyclesResponse.data);
      }
      
      lastLoadTimeRef.current = now;
    } catch (err) {
      console.error('💥 useMenstrualCycle: Load error:', err);
      setError('Lỗi khi tải dữ liệu chu kì');
      toast.error('Lỗi khi tải dữ liệu chu kì');
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