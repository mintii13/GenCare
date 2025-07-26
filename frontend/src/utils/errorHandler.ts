import { toast } from 'react-hot-toast';

/**
 * Frontend Error Handling System
 * Provides consistent error handling for API responses and other errors
 */

export interface ApiError {
  success: false;
  message: string;
  type: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
}

export enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export class ClientError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly details?: any;
  public readonly originalError?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    type: string = ErrorTypes.INTERNAL_SERVER_ERROR,
    details?: any,
    originalError?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    
    this.name = this.constructor.name;
  }
}

/**
 * Parse API error response
 */
export const parseApiError = (error: any): ClientError => {
  // If error has response from axios
  if (error.response) {
    const { status, data } = error.response;
    
    // If it's our standardized error format
    if (data && typeof data === 'object' && data.success === false) {
      return new ClientError(
        data.message || 'Đã xảy ra lỗi',
        status,
        data.type || ErrorTypes.INTERNAL_SERVER_ERROR,
        data.details,
        error
      );
    }
    
    // If it's a generic HTTP error
    return new ClientError(
      getHttpErrorMessage(status),
      status,
      getHttpErrorType(status),
      { originalMessage: data?.message || data },
      error
    );
  }
  
  // If error has request (network error)
  if (error.request) {
    return new ClientError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
      0,
      ErrorTypes.NETWORK_ERROR,
      { code: error.code },
      error
    );
  }
  
  // If it's already a ClientError
  if (error instanceof ClientError) {
    return error;
  }
  
  // Default error
  return new ClientError(
    error.message || 'Đã xảy ra lỗi không xác định',
    500,
    ErrorTypes.INTERNAL_SERVER_ERROR,
    undefined,
    error
  );
};

/**
 * Get user-friendly message for HTTP status codes
 */
const getHttpErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    case 401:
      return 'Bạn cần đăng nhập để thực hiện hành động này.';
    case 403:
      return 'Bạn không có quyền truy cập tài nguyên này.';
    case 404:
      return 'Không tìm thấy tài nguyên yêu cầu.';
    case 409:
      return 'Dữ liệu đã tồn tại trong hệ thống.';
    case 422:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    case 429:
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 500:
      return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
    case 502:
      return 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.';
    case 503:
      return 'Dịch vụ tạm thời bảo trì. Vui lòng thử lại sau.';
    case 504:
      return 'Máy chủ phản hồi chậm. Vui lòng thử lại sau.';
    default:
      return `Đã xảy ra lỗi (${status}). Vui lòng thử lại sau.`;
  }
};

/**
 * Get error type for HTTP status codes
 */
const getHttpErrorType = (status: number): string => {
  if (status >= 400 && status < 500) {
    switch (status) {
      case 401:
        return ErrorTypes.AUTHENTICATION_ERROR;
      case 403:
        return ErrorTypes.AUTHORIZATION_ERROR;
      case 404:
        return ErrorTypes.NOT_FOUND_ERROR;
      case 409:
        return ErrorTypes.DUPLICATE_ERROR;
      case 422:
        return ErrorTypes.VALIDATION_ERROR;
      case 429:
        return ErrorTypes.RATE_LIMIT_ERROR;
      default:
        return ErrorTypes.VALIDATION_ERROR;
    }
  }
  
  if (status >= 500) {
    return ErrorTypes.INTERNAL_SERVER_ERROR;
  }
  
  return ErrorTypes.NETWORK_ERROR;
};

/**
 * Handle API errors with appropriate UI feedback
 */
export const handleApiError = (
  error: any,
  options: {
    showToast?: boolean;
    customMessage?: string;
    onAuthError?: () => void;
    onNetworkError?: () => void;
    silent?: boolean;
  } = {}
): ClientError => {
  const {
    showToast = true,
    customMessage,
    onAuthError,
    onNetworkError,
    silent = false
  } = options;
  
  const parsedError = parseApiError(error);
  
  // Handle specific error types
  switch (parsedError.type) {
    case ErrorTypes.AUTHENTICATION_ERROR:
      if (onAuthError) {
        onAuthError();
      }
      break;
      
    case ErrorTypes.NETWORK_ERROR:
      if (onNetworkError) {
        onNetworkError();
      }
      break;
  }
  
  // Show toast notification
  if (showToast && !silent) {
    const message = customMessage || parsedError.message;
    
    if (parsedError.statusCode >= 500) {
      toast.error(message, { duration: 5000 });
    } else if (parsedError.statusCode >= 400) {
      toast.error(message, { duration: 4000 });
    } else {
      toast.error(message, { duration: 3000 });
    }
  }
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 API Error:', {
      message: parsedError.message,
      type: parsedError.type,
      statusCode: parsedError.statusCode,
      details: parsedError.details,
      originalError: parsedError.originalError
    });
  }
  
  return parsedError;
};

/**
 * Handle form validation errors
 */
export const handleValidationErrors = (
  error: ClientError,
  setFieldErrors?: (errors: Record<string, string>) => void
): void => {
  if (error.type === ErrorTypes.VALIDATION_ERROR && error.details) {
    if (setFieldErrors && typeof error.details === 'object') {
      setFieldErrors(error.details);
    } else {
      // Show general validation error
      toast.error(error.message);
    }
  } else {
    toast.error(error.message);
  }
};

/**
 * Async wrapper for handling promises with consistent error handling
 */
export const withErrorHandling = async <T>(
  promise: Promise<T>,
  options: {
    showToast?: boolean;
    customMessage?: string;
    onAuthError?: () => void;
    onNetworkError?: () => void;
    onError?: (error: ClientError) => void;
    silent?: boolean;
  } = {}
): Promise<{ data?: T; error?: ClientError }> => {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    const clientError = handleApiError(error, options);
    
    if (options.onError) {
      options.onError(clientError);
    }
    
    return { error: clientError };
  }
};

/**
 * Success response handlers
 */
export const handleSuccess = (
  message?: string,
  options: {
    showToast?: boolean;
    duration?: number;
  } = {}
): void => {
  const { showToast = true, duration = 3000 } = options;
  
  if (showToast && message) {
    toast.success(message, { duration });
  }
};

/**
 * Loading state helper
 */
export class LoadingManager {
  private static activeRequests = new Set<string>();
  
  static start(key: string): void {
    this.activeRequests.add(key);
  }
  
  static end(key: string): void {
    this.activeRequests.delete(key);
  }
  
  static isLoading(key?: string): boolean {
    if (key) {
      return this.activeRequests.has(key);
    }
    return this.activeRequests.size > 0;
  }
  
  static clear(): void {
    this.activeRequests.clear();
  }
  
  static getActiveRequests(): string[] {
    return Array.from(this.activeRequests);
  }
}

/**
 * Retry mechanism for failed requests
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

/**
 * Error boundary helper for React components
 */
export const logComponentError = (
  error: Error,
  errorInfo: { componentStack: string }
): void => {
  console.error('🚨 Component Error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString()
  });
  
  // In a real app, you might want to send this to an error reporting service
  // like Sentry, LogRocket, etc.
};

/**
 * Network status helper
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export const isServerError = (error: any): boolean => {
  return error.response && error.response.status >= 500;
};

export const isClientError = (error: any): boolean => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

/**
 * Export commonly used error handlers
 */
export const commonErrorHandlers = {
  authentication: (onRedirectToLogin?: () => void) => (error: any) => {
    const parsedError = parseApiError(error);
    if (parsedError.type === ErrorTypes.AUTHENTICATION_ERROR) {
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      if (onRedirectToLogin) {
        onRedirectToLogin();
      }
    }
    return parsedError;
  },
  
  network: () => (error: any) => {
    if (isNetworkError(error)) {
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    return parseApiError(error);
  },
  
  server: () => (error: any) => {
    if (isServerError(error)) {
      toast.error('Máy chủ gặp sự cố. Vui lòng thử lại sau.');
    }
    return parseApiError(error);
  }
}; 