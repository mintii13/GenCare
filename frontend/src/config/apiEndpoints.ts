/*
  Centralised API endpoint map.
  ------------------------------------------------------
  - Sử dụng BASE_API làm tiền tố khi cần gọi thẳng domain.
  - Mặc định các service hiện tại đã config axios baseURL = config.api.url
    nên bạn chỉ cần khai báo path bắt đầu bằng '/'.
  - Gom nhóm endpoints theo module để dễ tra cứu.
*/
import { config } from './constants';

export const BASE_API = config.api.url; // e.g. http://localhost:3000/api

export const API = {
  // ----------------------- AUTH -----------------------
  Auth: {
    LOGIN: '/identity/authenticate',
    REGISTER: '/identity/register-with-verifying',
    VERIFY_OTP: '/identity/verify-otp',
    REFRESH: '/identity/refresh',
    USER_INFO: '/identity/user',

    // Legacy auth endpoints still used by FE
    LOGIN_PUBLIC: '/auth/login',
    REGISTER_PUBLIC: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh-token',
    CHANGE_PASSWORD: '/auth/changePassword',
    SEND_VERIFICATION: '/auth/send-verification',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },

  // ---------------------- APPOINTMENTS ----------------
  Appointment: {
    BOOK: '/appointments/book',
    MY_APPOINTMENTS: '/appointments/my-appointments',
    CONSULTANT_APPOINTMENTS: '/appointments/consultant/my-appointments',
    ALL: '/appointments/admin/all',
    BASE: '/appointments' // append /:id, /:id/cancel ….
  },

  // ----------------------- CONSULTANT -----------------
  Consultant: {
    PUBLIC_LIST: '/consultants/public',
    PUBLIC_DETAIL: (id: string) => `/consultants/public/${id}`,
    WITH_RATINGS: '/consultants/with-ratings',
    MY_PROFILE: '/consultants/my-profile',
    MY_STATS: '/consultants/my-stats'
  },

  // ----------------------- WEEKLY SCHEDULE ------------
  WeeklySchedule: {
    BASE: '/weekly-schedule',
    MY_SCHEDULES: '/weekly-schedule/my-schedules',
    CONSULTANT_SCHEDULES: (consultantId: string) => `/weekly-schedule/consultant/${consultantId}`,
    WEEKLY_SLOTS: (consultantId: string) => `/weekly-schedule/weekly-slots/${consultantId}`
  },

  // ----------------------- BLOG -----------------------
  Blog: {
    LIST: '/blogs',
    DETAIL: (id: string) => `/blogs/${id}`,
    CREATE: '/blogs',
    UPDATE: (id: string) => `/blogs/${id}`,
    DELETE: (id: string) => `/blogs/${id}`
  },

  // ----------------------- FEEDBACK -------------------
  Feedback: {
    CONSULTANT_FEEDBACK: '/feedback/consultant',
    MY_FEEDBACK: '/feedback/my-feedback'
  },

  // ----------------------- DEFAULT --------------------
  // Add more modules here as needed

  Profile: {
    GET: '/profile/getUserProfile',
    UPDATE: '/profile/updateUserProfile'
  },

  MenstrualCycle: {
    BASE: '/menstrual-cycle',
    PROCESS: '/menstrual-cycle/processMenstrualCycle',
    GET_CYCLES: '/menstrual-cycle/getCycles',
    GET_CYCLES_MONTH: (year:number, month:number)=>`/menstrual-cycle/getCyclesByMonth/${year}/${month}`,
    TODAY_STATUS: '/menstrual-cycle/getTodayStatus',
    CYCLE_STATS: '/menstrual-cycle/getCycleStatistics',
    PERIOD_STATS: '/menstrual-cycle/getPeriodStatistics',
    NOTIFY_SETTINGS: '/menstrual-cycle/updateNotificationStatus',
    CLEANUP: '/menstrual-cycle/cleanupDuplicates'
  },
} as const;

export type ApiGroups = typeof API; 