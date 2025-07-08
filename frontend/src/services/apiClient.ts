import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { log } from '@/utils/logger';
const AUTH_TOKEN_KEY = "gencare_auth_token";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

  constructor(baseURL: string = '/api') {
    this.instance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        
        // Debug: Log token status
        console.log('ApiClient Request Debug:');
        console.log('- URL:', config.url);
        console.log('- Token exists:', !!token);
        console.log('- Token value:', token ? `${token.substring(0, 20)}...` : 'null');
        
        if (token) {
          // ensure header object exists and add Authorization
          (config.headers = (config.headers || {}) as any);
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
          console.log('- Authorization header added');
        } else {
          console.log('- No token found, request will be unauthenticated');
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
          // Token expired or invalid
          console.error("Token expired or invalid, logging out.");
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
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
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: AxiosError;

    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AxiosError;
        
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
          error: lastError.message,
          url: lastError.config?.url,
          status: status
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
    return this.executeWithRetry(
      () => this.instance.get<T>(url, config),
      retryConfig
    );
  }

  async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(
      () => this.instance.post<T>(url, data, config),
      retryConfig
    );
  }

  async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(
      () => this.instance.put<T>(url, data, config),
      retryConfig
    );
  }

  async patch<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
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
    try {
      const response = await this.get<T>(url, config, retryConfig);
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
    data?: any, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
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
    data?: any, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
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

  async safeDelete<T>(
    url: string, 
    config?: AxiosRequestConfig,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
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
    const responseData = error.response?.data as any;
    const message = responseData?.message || error.message || 'Có lỗi xảy ra';

    return {
      success: false,
      error: message,
      message: this.getErrorMessage(status, message)
    };
  }

  private getErrorMessage(status: number, originalMessage: string): string {
    switch (status) {
      case 400:
        return 'Dữ liệu không hợp lệ';
      case 401:
        return 'Phiên đăng nhập đã hết hạn';
      case 403:
        return 'Bạn không có quyền thực hiện hành động này';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu';
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