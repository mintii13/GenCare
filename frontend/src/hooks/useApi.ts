import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean; // Có gọi API ngay khi component mount không
  showToast?: boolean; // Có hiển thị toast khi có lỗi không
}

export function useApi<T>(
  apiFunction: () => Promise<any>,
  options: UseApiOptions = {}
) {
  const { immediate = true, showToast = true } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction();
      setState({
        data: response.data || response,
        loading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      if (showToast) {
        // Import và sử dụng error utils
        const { showErrorToast } = await import('@/utils/errorUtils');
        showErrorToast(error);
      }

      throw error;
    }
  }, [apiFunction, showToast]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
    refetch: execute,
  };
}

// Hook đặc biệt cho pagination
export function usePaginatedApi<T>(
  apiFunction: (page: number, limit: number, ...args: any[]) => Promise<any>,
  deps: any[] = [],
  options: UseApiOptions & { limit?: number } = {}
) {
  const { limit = 10, ...apiOptions } = options;
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const execute = useCallback(async (pageNum: number = page, reset: boolean = false) => {
    try {
      const response = await apiFunction(pageNum, limit, ...deps);
      const newData = response.data?.data || response.data || [];
      const total = response.data?.total || 0;

      if (reset) {
        setAllData(newData);
      } else {
        setAllData(prev => [...prev, ...newData]);
      }

      setHasMore((pageNum * limit) < total);
      return response;
    } catch (error) {
      throw error;
    }
  }, [apiFunction, limit, page, ...deps]);

  const { loading, error } = useApi(() => execute(page, page === 1), {
    ...apiOptions,
    immediate: false
  });

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      execute(nextPage, false);
    }
  }, [execute, hasMore, loading, page]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    execute(1, true);
  }, [execute]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  useEffect(() => {
    refresh();
  }, deps);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
    page,
  };
}

// Hook cho async actions (create, update, delete)
export function useAsyncAction<T = any>(showToast: boolean = true) {
  const [state, setState] = useState({
    loading: false,
    error: null as string | null,
  });

  const execute = useCallback(async (
    action: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setState({ loading: true, error: null });
    
    try {
      const result = await action();
      setState({ loading: false, error: null });
      
      if (showToast && successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      setState({ loading: false, error: errorMessage });
      
      if (showToast) {
        // Import và sử dụng error utils
        const { showErrorToast } = await import('@/utils/errorUtils');
        showErrorToast(error);
      }
      
      return null;
    }
  }, [showToast]);

  return {
    ...state,
    execute,
  };
}