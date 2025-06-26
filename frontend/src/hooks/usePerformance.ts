import { useEffect, useRef, useState, useCallback } from 'react';
import { log } from '@/utils/logger';
import { env } from '@/config/environment';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdate: number;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export function usePerformanceMonitor(componentName: string) {
  const mountTime = useRef<number>(performance.now());
  const lastRenderTime = useRef<number>(performance.now());
  const updateCount = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Component mounted
    const mountDuration = performance.now() - mountTime.current;
    
    if (env.enablePerformanceMonitoring) {
      log.debug('Performance', `${componentName} mounted`, {
        mountTime: mountDuration.toFixed(2) + 'ms'
      });
    }

    return () => {
      // Component unmounted
      if (env.enablePerformanceMonitoring) {
        log.debug('Performance', `${componentName} unmounted`, {
          totalUpdates: updateCount.current,
          lifespan: (performance.now() - mountTime.current).toFixed(2) + 'ms'
        });
      }
    };
  }, [componentName]);

  useEffect(() => {
    // Component updated
    const renderDuration = performance.now() - lastRenderTime.current;
    updateCount.current += 1;
    
    const currentMetrics: PerformanceMetrics = {
      componentName,
      renderTime: renderDuration,
      mountTime: performance.now() - mountTime.current,
      updateCount: updateCount.current,
      lastUpdate: performance.now()
    };

    setMetrics(currentMetrics);
    lastRenderTime.current = performance.now();

    // Log slow renders
    if (env.enablePerformanceMonitoring && renderDuration > 16) {
      log.warn('Performance', `Slow render detected in ${componentName}`, {
        renderTime: renderDuration.toFixed(2) + 'ms',
        updateCount: updateCount.current
      });
    }
  });

  const measureApiCall = useCallback(async <T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let success = true;
    
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      if (env.enablePerformanceMonitoring) {
        const metrics: ApiMetrics = {
          endpoint,
          method,
          duration,
          timestamp: Date.now(),
          success
        };

        log.debug('Performance', `API call: ${method} ${endpoint}`, {
          duration: duration.toFixed(2) + 'ms',
          success
        });

        // Log slow API calls
        if (duration > 2000) {
          log.warn('Performance', `Slow API call detected`, metrics);
        }
      }
    }
  }, []);

  return {
    metrics,
    measureApiCall
  };
}

// Hook for measuring specific functions
export function useMeasure() {
  const measure = useCallback(<T>(
    label: string,
    fn: () => T
  ): T => {
    if (!env.enablePerformanceMonitoring) {
      return fn();
    }

    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;

    log.debug('Performance', `Function: ${label}`, {
      duration: duration.toFixed(2) + 'ms'
    });

    return result;
  }, []);

  const measureAsync = useCallback(async <T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    if (!env.enablePerformanceMonitoring) {
      return fn();
    }

    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;

    log.debug('Performance', `Async Function: ${label}`, {
      duration: duration.toFixed(2) + 'ms'
    });

    return result;
  }, []);

  return {
    measure,
    measureAsync
  };
}

// Hook for monitoring memory usage
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    if (!env.enablePerformanceMonitoring || !(performance as any).memory) {
      return;
    }

    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}