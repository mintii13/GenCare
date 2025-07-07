// Application constants

export const CYCLE_PHASES = {
  MENSTRUAL: "menstrual",
  FOLLICULAR: "follicular",
  OVULATION: "ovulation",
  LUTEAL: "luteal",
} as const

export const SYMPTOMS = [
  "Đau bụng kinh",
  "Đau đầu",
  "Buồn nôn",
  "Mệt mỏi",
  "Căng thẳng",
  "Thay đổi tâm trạng",
  "Đau lưng",
  "Nổi mụn",
  "Tăng cân",
  "Khó ngủ",
] as const

export const MOOD_OPTIONS = [
  { value: "happy", label: "😊 Vui vẻ" },
  { value: "normal", label: "😐 Bình thường" },
  { value: "sad", label: "😢 Buồn" },
  { value: "stressed", label: "😰 Căng thẳng" },
  { value: "tired", label: "😴 Mệt mỏi" },
] as const

export const FLOW_OPTIONS = [
  { value: "light", label: "Ít" },
  { value: "normal", label: "Bình thường" },
  { value: "heavy", label: "Nhiều" },
  { value: "very-heavy", label: "Rất nhiều" },
] as const

export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Hàng ngày" },
  { value: "twice-daily", label: "2 lần/ngày" },
  { value: "three-times-daily", label: "3 lần/ngày" },
  { value: "weekly", label: "Mỗi tuần" },
  { value: "as-needed", label: "Khi cần thiết" },
] as const

export const HEALTH_SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 55,
  NEEDS_IMPROVEMENT: 0,
} as const

export const CYCLE_LENGTH_RANGE = {
  MIN: 21,
  MAX: 35,
  DEFAULT: 28,
} as const

export const PERIOD_LENGTH_RANGE = {
  MIN: 2,
  MAX: 10,
  DEFAULT: 5,
} as const

export const ROUTES = {
  HOME: "/",
  MEDICATION_REMINDERS: "/medication-reminders",
  PERIOD_TRACKER: "/period-tracker",
  CYCLE_CHECK: "/cycle-check",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const

// Environment Variables Constants
export const ENV_VARS = {
  // API Configuration
  API_URL: 'VITE_API_URL',
  API_TIMEOUT: 'VITE_API_TIMEOUT',
  
  // Authentication
  AUTH_TOKEN_KEY: 'VITE_AUTH_TOKEN_KEY',
  AUTH_REFRESH_TOKEN_KEY: 'VITE_AUTH_REFRESH_TOKEN_KEY',
  
  // App Configuration
  APP_NAME: 'VITE_APP_NAME',
  APP_VERSION: 'VITE_APP_VERSION',
  APP_DESCRIPTION: 'VITE_APP_DESCRIPTION',
  
  // Feature Flags
  ENABLE_ANALYTICS: 'VITE_ENABLE_ANALYTICS',
  ENABLE_NOTIFICATIONS: 'VITE_ENABLE_NOTIFICATIONS',
  ENABLE_LOGGING: 'VITE_ENABLE_LOGGING',
  ENABLE_ERROR_TRACKING: 'VITE_ENABLE_ERROR_TRACKING',
  ENABLE_PERFORMANCE_MONITORING: 'VITE_ENABLE_PERFORMANCE_MONITORING',
  ENABLE_EXPERIMENTAL_FEATURES: 'VITE_ENABLE_EXPERIMENTAL_FEATURES',
  ENABLE_BETA_FEATURES: 'VITE_ENABLE_BETA_FEATURES',
  ENABLE_DEBUG_MODE: 'VITE_ENABLE_DEBUG_MODE',
  
  // Social Login
  GOOGLE_CLIENT_ID: 'VITE_GOOGLE_CLIENT_ID',
  
  // Other
  RETRY_ATTEMPTS: 'VITE_RETRY_ATTEMPTS'
} as const;

// Default Values
export const DEFAULT_VALUES = {
  API_URL: 'http://localhost:3000/api',
  API_TIMEOUT: '5000',
  AUTH_TOKEN_KEY: 'gencare_auth_token',
  AUTH_REFRESH_TOKEN_KEY: 'gencare_refresh_token',
  APP_NAME: 'GenCare',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Healthcare Services Platform',
  RETRY_ATTEMPTS: '3',
  // Thêm default values cho feature flags
  ENABLE_ANALYTICS: 'false',
  ENABLE_NOTIFICATIONS: 'true',
  ENABLE_LOGGING: 'true',
  ENABLE_ERROR_TRACKING: 'false',
  ENABLE_PERFORMANCE_MONITORING: 'false',
  ENABLE_EXPERIMENTAL_FEATURES: 'false',
  ENABLE_BETA_FEATURES: 'false',
  ENABLE_DEBUG_MODE: 'false'
} as const;

// Helper function to get environment variable with fallback
export const getEnvVar = (key: keyof typeof ENV_VARS, useDefault: boolean = true): string => {
  const envKey = ENV_VARS[key];
  const value = import.meta.env[envKey];
  
  if (value === undefined || value === null || value === '') {
    if (useDefault && key in DEFAULT_VALUES) {
      return DEFAULT_VALUES[key as keyof typeof DEFAULT_VALUES];
    }
    if (!useDefault) {
      return ''; // Trả về chuỗi rỗng thay vì throw error
    }
    throw new Error(`Environment variable ${envKey} is required but not defined`);
  }
  
  return value;
};

// Helper function cho các environment variables không bắt buộc
export const getOptionalEnvVar = (key: keyof typeof ENV_VARS, defaultValue: string = ''): string => {
  const envKey = ENV_VARS[key];
  const value = import.meta.env[envKey];
  return value ?? defaultValue;
};

// Typed environment configuration
export const config = {
  api: {
    url: getEnvVar('API_URL'),
    timeout: parseInt(getEnvVar('API_TIMEOUT'), 10)
  },
  auth: {
    tokenKey: getEnvVar('AUTH_TOKEN_KEY'),
    refreshTokenKey: getEnvVar('AUTH_REFRESH_TOKEN_KEY')
  },
  app: {
    name: getEnvVar('APP_NAME'),
    version: getEnvVar('APP_VERSION'),
    description: getEnvVar('APP_DESCRIPTION')
  },
  features: {
    analytics: getOptionalEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
    notifications: getOptionalEnvVar('ENABLE_NOTIFICATIONS', 'true') === 'true',
    logging: getOptionalEnvVar('ENABLE_LOGGING', 'true') === 'true',
    errorTracking: getOptionalEnvVar('ENABLE_ERROR_TRACKING', 'false') === 'true',
    performanceMonitoring: getOptionalEnvVar('ENABLE_PERFORMANCE_MONITORING', 'false') === 'true',
    experimentalFeatures: getOptionalEnvVar('ENABLE_EXPERIMENTAL_FEATURES', 'false') === 'true',
    betaFeatures: getOptionalEnvVar('ENABLE_BETA_FEATURES', 'false') === 'true',
    debugMode: getOptionalEnvVar('ENABLE_DEBUG_MODE', 'false') === 'true'
  },
  social: {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  }
} as const;
