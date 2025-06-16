export interface EnvironmentConfig {
  API_BASE_URL: string;
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
  const nodeEnv = import.meta.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    NODE_ENV: nodeEnv,
    isDevelopment,
    isProduction,
    isTest,
    enableLogging: isDevelopment || import.meta.env.VITE_ENABLE_LOGGING === 'true',
    enableErrorTracking: isProduction || import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    enablePerformanceMonitoring: isProduction || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3', 10),
    features: {
      enableExperimentalFeatures: isDevelopment && import.meta.env.VITE_ENABLE_EXPERIMENTAL_FEATURES === 'true',
      enableBetaFeatures: import.meta.env.VITE_ENABLE_BETA_FEATURES === 'true',
      enableDebugMode: isDevelopment || import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true'
    }
  };
};

export const env = createEnvironmentConfig();

// Type-safe environment variable access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
};

// Validation helper
export const validateEnvironment = (): void => {
  const requiredVars = ['VITE_API_BASE_URL'];
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
  }
};

// Initialize validation
validateEnvironment(); 