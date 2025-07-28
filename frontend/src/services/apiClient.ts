import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosRequestHeaders } from 'axios';
import { log } from '../utils/logger';
import { env } from '../config/environment';

// Sử dụng environment config thống nhất
const AUTH_TOKEN_KEY = env.AUTH_TOKEN_KEY;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorType?: string;
  details?: string;
  errors?: unknown[];
  timestamp?: string;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: boolean;
}

class ApiClient {
  private instance: AxiosInstance;
  private defaultRetryConfig: RetryConfig = {
    attempts: 3,
    delay: 1000,
    backoff: true
  };

  constructor(baseURL: string = env.API_BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds - increased for heavy data operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add a request interceptor to include the token in headers
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        
        if (token) {
          // ensure header object exists and add Authorization
          (config.headers = (config.headers || {}) as AxiosRequestHeaders);
          (config.headers as AxiosRequestHeaders)['Authorization'] = `Bearer ${token}`;
        }

        log.api(config.method?.toUpperCase() || 'REQUEST', config.url || '', {
          params: config.params,
          data: config.data
        });

        return config;
      },
      (error) => {
        log.error('ApiClient', 'Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        log.apiResponse(
          response.config.method?.toUpperCase() || 'RESPONSE',
          response.config.url || '',
          response.status,
          response.data
        );
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status || 0;
        const url = error.config?.url || '';
        const method = error.config?.method?.toUpperCase() || 'ERROR';

        log.apiResponse(method, url, status, {
          message: error.message,
          response: error.response?.data
        });

        // Handle specific error cases
        if (status === 401) {
          const requestUrl = error.config?.url || '';
          
          // Don't auto-logout for getUserProfile requests (let AuthContext handle it)
          if (requestUrl.includes('/getUserProfile')) {
            return Promise.reject(error);
          }
          
          // Don't auto-logout for login requests (let login form handle the error)
          if (requestUrl.includes('/auth/login')) {
            return Promise.reject(error);
          }

          // Don't auto-logout for profile requests (let AuthContext handle it)
          if (requestUrl.includes('/profile/')) {
            return Promise.reject(error);
          }
          
          // Token expired or invalid for other requests - clear immediately
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem('user');
          
          // Only redirect if not already on home page - use setTimeout for better UX
          if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
            setTimeout(() => {
              window.location.href = '/';
            }, 100); // Small delay to prevent blocking
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<AxiosResponse<T>> {
    // Defensive check to ensure retryConfig is an object
    const safeRetryConfig = retryConfig && typeof retryConfig === 'object' ? retryConfig : {};
    const config = { ...this.defaultRetryConfig, ...safeRetryConfig };
    let lastError: AxiosError;

    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry on canceled/aborted requests
        if (lastError.name === 'CanceledError' || lastError.name === 'AbortError' || lastError.message === 'canceled') {
          throw lastError;
        }
        
        // Don't retry on certain status codes
        const status = lastError.response?.status;
        if (status && [400, 401, 403, 404, 422].includes(status)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === config.attempts) {
          throw lastError;
        }

        // Calculate delay with backoff
        const delay = config.backoff 
          ? config.delay * Math.pow(2, attempt - 1)
          : config.delay;

        log.warn('ApiClient', `Attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message || 'Unknown error',
          url: lastError.config?.url || 'Unknown URL',
          status: status || 'Unknown status'
        });

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  // Public methods
  async get<T>(
    url: string, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }
    return this.executeWithRetry(
      () => this.instance.get<T>(url, config),
      retryConfig
    );
  }

  async post<T>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }
    return this.executeWithRetry(
      () => this.instance.post<T>(url, data, config),
      retryConfig
    );
  }

  async put<T>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }
    return this.executeWithRetry(
      () => this.instance.put<T>(url, data, config),
      retryConfig
    );
  }

  async patch<T>(
    url: string, 
      data?: unknown, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }
    return this.executeWithRetry(
      () => this.instance.patch<T>(url, data, config),
      retryConfig
    );
  }

  async delete<T>(
    url: string, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL provided: ${url}`);
    }
    return this.executeWithRetry(
      () => this.instance.delete<T>(url, config),
      retryConfig
    );
  }

  // Convenience methods that return standardized ApiResponse
  async safeGet<T>(
    url: string, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: `Invalid URL provided: ${url}`,
        message: 'URL không hợp lệ'
      };
    }
    try {
      const response = await this.get<T>(url, config, retryConfig);
      
      console.log('[ApiClient] safeGet response:', {
        url,
        responseData: response.data,
        responseDataType: typeof response.data,
        hasSuccess: response.data && typeof response.data === 'object' && 'success' in response.data
      });
      
      // Check if response.data is already an ApiResponse structure
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Backend already returns ApiResponse structure
        console.log('[ApiClient] Returning backend ApiResponse structure');
        return response.data as ApiResponse<T>;
      }
      
      // Legacy response structure
      console.log('[ApiClient] Returning legacy response structure');
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  async safePost<T>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: `Invalid URL provided: ${url}`,
        message: 'URL không hợp lệ'
      };
    }
    try {
      const response = await this.post<T>(url, data, config, retryConfig);
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  async safePut<T>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: `Invalid URL provided: ${url}`,
        message: 'URL không hợp lệ'
      };
    }
    try {
      const response = await this.put<T>(url, data, config, retryConfig);
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  async safePatch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: `Invalid URL provided: ${url}`,
        message: 'URL không hợp lệ'
      };
    }
    try {
      const response = await this.patch<T>(url, data, config, retryConfig);
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  async safeDelete<T>(
    url: string, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: `Invalid URL provided: ${url}`,
        message: 'URL không hợp lệ'
      };
    }
    try {
      const response = await this.delete<T>(url, config, retryConfig);
      return {
        success: true,
        data: response.data,
        message: 'Request successful'
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  private handleError<T>(error: AxiosError): ApiResponse<T> {
    const status = error.response?.status || 0;
    const responseData = error.response?.data as { type?: string; message?: string; details?: string; errors?: unknown[]; timestamp?: string };
    
    // Extract detailed error information from backend
    const errorType = responseData?.type || 'UNKNOWN_ERROR';
    const message = responseData?.message || error.message || 'Có lỗi xảy ra';
    const details = responseData?.details || undefined;
    const errors = responseData?.errors || undefined;
    
    // Create comprehensive error response
    const errorResponse: ApiResponse<T> = {
      success: false,
      error: message,
      message: this.getErrorMessage(status, message, errorType, details),
      errorType,
      details,
      errors,
      timestamp: responseData?.timestamp || new Date().toISOString()
    };

    // Log error for debugging
    console.error('API Error:', {
      status,
      type: errorType,
      message,
      details,
      errors,
      url: error.config?.url,
      method: error.config?.method
    });

    return errorResponse;
  }

  private getErrorMessage(status: number, originalMessage: string, errorType?: string, details?: string): string {
    // Use detailed message from backend if available
    if (details && details !== originalMessage) {
      return details;
    }

    // Handle specific error types
    switch (errorType) {
      case 'VALIDATION_ERROR':
        return details || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
      case 'AUTHENTICATION_ERROR':
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 'AUTHORIZATION_ERROR':
        return 'Bạn không có quyền thực hiện hành động này.';
      case 'NOT_FOUND_ERROR':
        return 'Không tìm thấy tài nguyên yêu cầu.';
      case 'CONFLICT_ERROR':
        return details || 'Dữ liệu đã tồn tại hoặc có xung đột.';
      case 'DUPLICATE_ERROR':
        return 'Dữ liệu này đã tồn tại trong hệ thống.';
      case 'INVALID_ID_ERROR':
        return 'ID được cung cấp không đúng định dạng.';
      case 'UNPROCESSABLE_ERROR':
        return details || 'Dữ liệu không đúng định dạng yêu cầu.';
      case 'RATE_LIMIT_ERROR':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
      default:
        break;
    }

    // Fallback to status-based messages
    switch (status) {
      case 400:
        return originalMessage || 'Dữ liệu không hợp lệ';
      case 401:
        return 'Phiên đăng nhập đã hết hạn';
      case 403:
        return 'Bạn không có quyền thực hiện hành động này';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu';
      case 409:
        return 'Dữ liệu đã tồn tại hoặc có xung đột';
      case 422:
        return 'Dữ liệu không đúng định dạng';
      case 429:
        return 'Quá nhiều yêu cầu, vui lòng thử lại sau';
      case 500:
        return 'Lỗi máy chủ, vui lòng thử lại sau';
      case 502:
      case 503:
      case 504:
        return 'Máy chủ đang bảo trì, vui lòng thử lại sau';
      default:
        return originalMessage || 'Có lỗi xảy ra';
    }
  }

  // Method to update base URL if needed
  setBaseURL(url: string): void {
    this.instance.defaults.baseURL = url;
  }

  // Method to set default headers
  setDefaultHeader(key: string, value: string): void {
    this.instance.defaults.headers.common[key] = value;
  }

  // Method to remove default header
  removeDefaultHeader(key: string): void {
    delete this.instance.defaults.headers.common[key];
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;