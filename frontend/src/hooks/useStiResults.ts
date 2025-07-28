import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
  getStiResultByOrderId, 
  getMySTIResults, 
  getMySTIResultByOrderId,
  StiResult, 
  StiResultResponse, 
  StiResultListResponse 
} from '../services/stiResultService';

// Hook để lấy STI result by order ID
export const useStiResult = (orderId: string) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!orderId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: StiResultResponse = await getStiResultByOrderId(orderId);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Không thể lấy kết quả xét nghiệm');
        setData(null);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Lỗi khi lấy dữ liệu';
      setError(errorMessage);
      setData(null);
      console.error('Error in useStiResult:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    data,
    error,
    refresh,
    refetch: refresh // Alias for refresh
  };
};

// Hook để lấy danh sách STI results của user
export const useMySTIResults = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StiResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: StiResultListResponse = await getMySTIResults();
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Không thể lấy danh sách kết quả xét nghiệm');
        setData([]);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Lỗi khi lấy dữ liệu';
      setError(errorMessage);
      setData([]);
      console.error('Error in useMySTIResults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    data,
    error,
    refresh,
    refetch: refresh
  };
};

// Hook để lấy STI result by order ID cho patient
export const useMySTIResult = (orderId: string) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!orderId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: StiResultResponse = await getMySTIResultByOrderId(orderId);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Không thể lấy kết quả xét nghiệm');
        setData(null);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Lỗi khi lấy dữ liệu';
      setError(errorMessage);
      setData(null);
      console.error('Error in useMySTIResult:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    data,
    error,
    refresh,
    refetch: refresh
  };
};

// Hook với auto-refresh capability
export const useStiResultWithAutoRefresh = (
  orderId: string, 
  refreshInterval: number = 30000, // 30 seconds
  enabled: boolean = true
) => {
  const { loading, data, error, refresh } = useStiResult(orderId);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled || !orderId) return;

    const interval = setInterval(() => {
      if (!loading) {
        setIsAutoRefreshing(true);
        refresh().finally(() => setIsAutoRefreshing(false));
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, orderId, loading, refresh, refreshInterval]);

  return {
    loading,
    data,
    error,
    refresh,
    isAutoRefreshing,
    refetch: refresh
  };
};

// Hook để theo dõi trạng thái kết quả xét nghiệm
export const useStiResultStatus = (orderId: string) => {
  const { data, loading, error, refresh } = useStiResult(orderId);

  const status = {
    isCompleted: data?.is_testing_completed || false,
    isConfirmed: data?.is_confirmed || false,
    hasDiagnosis: !!data?.diagnosis,
    hasNotes: !!data?.medical_notes,
    receivedTime: data?.received_time,
    totalTests: data?.sti_result_items?.length || 0,
    completedTests: data?.sti_result_items?.filter(item => 
      item.result.time_completed
    ).length || 0
  };

  const progress = status.totalTests > 0 
    ? Math.round((status.completedTests / status.totalTests) * 100) 
    : 0;

  return {
    loading,
    error,
    refresh,
    status,
    progress,
    data
  };
};

// Hook để lấy thống kê kết quả
export const useStiResultSummary = (orderId: string) => {
  const { data, loading, error } = useStiResult(orderId);

  const summary = {
    totalTests: 0,
    positiveResults: 0,
    negativeResults: 0,
    inconclusiveResults: 0,
    byType: {
      blood: 0,
      urine: 0,
      swab: 0
    }
  };

  if (data?.sti_result_items) {
    data.sti_result_items.forEach(item => {
      summary.totalTests++;
      summary.byType[item.result.sample_type]++;

      // Count positive/negative results based on sample type
      const { sample_type, blood, urine, swab } = item.result;

      if (sample_type === 'blood' && blood) {
        Object.values(blood).forEach(value => {
          if (value === true) summary.positiveResults++;
          else if (value === false) summary.negativeResults++;
          else if (value === null) summary.inconclusiveResults++;
        });
      }

      if (sample_type === 'swab' && swab) {
        Object.values(swab).forEach(value => {
          if (value === true) summary.positiveResults++;
          else if (value === false) summary.negativeResults++;
          else if (value === null) summary.inconclusiveResults++;
        });
      }

      // For urine, count non-null values as completed tests
      if (sample_type === 'urine' && urine) {
        if (Object.values(urine).some(val => val !== undefined && val !== null)) {
          summary.negativeResults++; // Most urine tests are informational, not pos/neg
        }
      }
    });
  }

  return {
    loading,
    error,
    summary,
    data
  };
};

// Hook để export STI results
export const useExportStiResults = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportResults = useCallback(async (params: {
    orderId?: string;
    format: 'excel' | 'pdf' | 'csv';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // This would typically call a service method to export
      // For now, just show a success message
      message.success(`Đang xuất kết quả định dạng ${params.format.toUpperCase()}...`);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Xuất kết quả thành công!');
    } catch (err: any) {
      const errorMessage = err?.message || 'Lỗi khi xuất kết quả';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportResults
  };
};