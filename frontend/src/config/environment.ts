export interface EnvironmentConfig {
  API_BASE_URL: string;
  VITE_CHATBOX_API: string;
  NODE_ENV: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  enableLogging: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  apiTimeout: number;
  retryAttempts: number;
  features: {
    enableExperimentalFeatures: boolean;
    enableBetaFeatures: boolean;
    enableDebugMode: boolean;
  };
}

const createEnvironmentConfig = (): EnvironmentConfig => {
  // Thay import.meta.env thành process.env cho tương thích Node/Jest
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    API_BASE_URL: process.env.VITE_API_URL || '',
    VITE_CHATBOX_API: process.env.VITE_CHATBOX_API || '',
    NODE_ENV: nodeEnv,
    isDevelopment,
    isProduction,
    isTest,
    enableLogging: isDevelopment || process.env.VITE_ENABLE_LOGGING === 'true',
    enableErrorTracking: isProduction || process.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    enablePerformanceMonitoring: isProduction || process.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    apiTimeout: parseInt(process.env.VITE_API_TIMEOUT ?? '5000', 10),
    retryAttempts: parseInt(process.env.VITE_RETRY_ATTEMPTS ?? '3', 10),
    features: {
      enableExperimentalFeatures: isDevelopment && process.env.VITE_ENABLE_EXPERIMENTAL_FEATURES === 'true',
      enableBetaFeatures: process.env.VITE_ENABLE_BETA_FEATURES === 'true',
      enableDebugMode: isDevelopment || process.env.VITE_ENABLE_DEBUG_MODE === 'true'
    }
  };
};

export const env = createEnvironmentConfig();

// Type-safe environment variable access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
};

// Helper function để lấy n8n webhook URL
export const getN8nWebhookUrl = (): string => {
  return env.VITE_CHATBOX_API;
};

// Validation helper
export const validateEnvironment = (): void => {
  const requiredVars = ['VITE_API_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
  }

  // Cảnh báo nếu không có webhook URL
  if (!env.VITE_CHATBOX_API) {
    console.warn('⚠️ VITE_CHATBOX_API chưa được cấu hình. Chatbot sẽ không hoạt động.');
  }
};

// Initialize validation
validateEnvironment();