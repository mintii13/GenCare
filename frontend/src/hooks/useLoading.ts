import { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  error?: string | null;
}

export interface LoadingManager {
  states: Record<string, LoadingState>;
  setLoading: (key: string, loading: boolean, message?: string) => void;
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  isAnyLoading: () => boolean;
  getState: (key: string) => LoadingState;
  executeWithLoading: <T>(
    key: string,
    asyncFn: () => Promise<T>,
    loadingMessage?: string
  ) => Promise<T>;
}

/**
 * Hook để quản lý multiple loading states
 * Ví dụ: const loading = useLoading(['fetchData', 'saveData', 'deleteData'])
 */
export function useLoading(keys: string[] = []): LoadingManager {
  const [states, setStates] = useState<Record<string, LoadingState>>(() => {
    const initialStates: Record<string, LoadingState> = {};
    keys.forEach(key => {
      initialStates[key] = {
        isLoading: false,
        loadingMessage: undefined,
        error: null
      };
    });
    return initialStates;
  });

  const statesRef = useRef(states);
  statesRef.current = states;

  const setLoading = useCallback((key: string, loading: boolean, message?: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: loading,
        loadingMessage: loading ? message : undefined,
        error: loading ? null : prev[key]?.error || null
      }
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        loadingMessage: undefined,
        error
      }
    }));
  }, []);

  const clearError = useCallback((key: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error: null
      }
    }));
  }, []);

  const isAnyLoading = useCallback(() => {
    return Object.values(statesRef.current).some(state => state.isLoading);
  }, []);

  const getState = useCallback((key: string): LoadingState => {
    return statesRef.current[key] || {
      isLoading: false,
      loadingMessage: undefined,
      error: null
    };
  }, []);

  const executeWithLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T> => {
    try {
      setLoading(key, true, loadingMessage);
      const result = await asyncFn();
      setLoading(key, false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      setError(key, errorMessage);
      throw error;
    }
  }, [setLoading, setError]);

  return {
    states,
    setLoading,
    setError,
    clearError,
    isAnyLoading,
    getState,
    executeWithLoading
  };
}

/**
 * Hook đơn giản cho một loading state duy nhất
 * Ví dụ: const [loading, setLoading] = useSimpleLoading()
 */
export function useSimpleLoading(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
    if (loadingState) {
      setError(null);
    }
  }, []);

  const setErrorMessage = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    setLoading(false);
  }, []);

  const executeWithLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      setLoadingState(true);
      const result = await asyncFn();
      setLoadingState(false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      setErrorMessage(errorMessage);
      throw error;
    }
  }, [setLoadingState, setErrorMessage]);

  return {
    loading,
    error,
    setLoading: setLoadingState,
    setError: setErrorMessage,
    clearError: () => setError(null),
    executeWithLoading
  };
}