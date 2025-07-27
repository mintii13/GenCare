/**
 * Loading utilities for consistent loading state management
 */

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface LoadingStateWithMessage extends LoadingState {
  loadingMessage?: string;
}

/**
 * Standard loading state hook
 */
export const useStandardLoading = (initialLoading = false): LoadingState & {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
} => {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<string | null>(null);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  };
};

/**
 * Combine multiple loading states
 */
export const combineLoadingStates = (...loadingStates: LoadingState[]): LoadingState => {
  const combinedLoading = loadingStates.some(state => state.loading);
  const combinedError = loadingStates.find(state => state.error)?.error || null;
  
  return {
    loading: combinedLoading,
    error: combinedError
  };
};

/**
 * Loading state for async operations
 */
export const useAsyncLoading = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const executeWithLoading = React.useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'Có lỗi xảy ra'
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || errorMessage;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeWithLoading,
    clearError
  };
};

/**
 * Loading state for data fetching with cache
 */
export const useDataLoading = <T>(initialData: T) => {
  const [data, setData] = React.useState<T>(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const fetchData = React.useCallback(async (
    fetchFn: () => Promise<T>,
    errorMessage = 'Không thể tải dữ liệu'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      setHasLoaded(true);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || errorMessage;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    hasLoaded,
    setData,
    fetchData,
    clearError
  };
};

/**
 * Loading state for form submissions
 */
export const useFormLoading = () => {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitForm = React.useCallback(async <T>(
    submitFn: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await submitFn();
      
      if (successMessage) {
        // Import toast dynamically to avoid circular dependencies
        const { toast } = await import('react-hot-toast');
        toast.success(successMessage);
      }
      
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(message);
      
      // Import toast dynamically to avoid circular dependencies
      const { toast } = await import('react-hot-toast');
      toast.error(message);
      
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    submitting,
    error,
    submitForm,
    clearError
  };
};

// Re-export React for convenience
import React from 'react'; 
 
 * Loading utilities for consistent loading state management
 */

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface LoadingStateWithMessage extends LoadingState {
  loadingMessage?: string;
}

/**
 * Standard loading state hook
 */
export const useStandardLoading = (initialLoading = false): LoadingState & {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
} => {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<string | null>(null);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  };
};

/**
 * Combine multiple loading states
 */
export const combineLoadingStates = (...loadingStates: LoadingState[]): LoadingState => {
  const combinedLoading = loadingStates.some(state => state.loading);
  const combinedError = loadingStates.find(state => state.error)?.error || null;
  
  return {
    loading: combinedLoading,
    error: combinedError
  };
};

/**
 * Loading state for async operations
 */
export const useAsyncLoading = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const executeWithLoading = React.useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'Có lỗi xảy ra'
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || errorMessage;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeWithLoading,
    clearError
  };
};

/**
 * Loading state for data fetching with cache
 */
export const useDataLoading = <T>(initialData: T) => {
  const [data, setData] = React.useState<T>(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const fetchData = React.useCallback(async (
    fetchFn: () => Promise<T>,
    errorMessage = 'Không thể tải dữ liệu'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      setHasLoaded(true);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || errorMessage;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    hasLoaded,
    setData,
    fetchData,
    clearError
  };
};

/**
 * Loading state for form submissions
 */
export const useFormLoading = () => {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitForm = React.useCallback(async <T>(
    submitFn: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await submitFn();
      
      if (successMessage) {
        // Import toast dynamically to avoid circular dependencies
        const { toast } = await import('react-hot-toast');
        toast.success(successMessage);
      }
      
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(message);
      
      // Import toast dynamically to avoid circular dependencies
      const { toast } = await import('react-hot-toast');
      toast.error(message);
      
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    submitting,
    error,
    submitForm,
    clearError
  };
};

// Re-export React for convenience
import React from 'react'; 