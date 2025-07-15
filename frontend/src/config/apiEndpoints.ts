/*
  Centralised API endpoint map.
  ------------------------------------------------------
  - Mặc định các service hiện tại đã config axios baseURL nên bạn
    chỉ cần khai báo path bắt đầu bằng '/'.
  - Gom nhóm endpoints theo module để dễ tra cứu.
*/

export const API = {
  // Base URL for API calls
  BASE_URL: import.meta.env.VITE_API_URL,
  
  // ----------------------- AUTH -----------------------
  Auth: {
    LOGIN: '/auth/login',
    REGISTER: '/register/send-otp',
    CHECK_EMAIL: '/auth/check-email',
    VERIFY_OTP: '/auth/register/verify-otp',
    RESEND_OTP: '/auth/resendOTP',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    GOOGLE_VERIFY: '/auth/google/verify',
    GOOGLE_CALLBACK: '/auth/google/callback',
    CREATE_GOOGLE_MEET: '/auth/create-google-meet',
    // Legacy endpoints below - can be removed if not used
    REFRESH: '/identity/refresh',
    USER_INFO: '/identity/user',
    LOGIN_PUBLIC: '/auth/login',
    REGISTER_PUBLIC: '/auth/register/send-otp',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh-token',
    SEND_VERIFICATION: '/auth/send-verification',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    FORGOT_PASSWORD_REQUEST: '/auth/forgot-password/request',
    FORGOT_PASSWORD_VERIFY: '/auth/forgot-password/verify',
    FORGOT_PASSWORD_RESET: '/auth/forgot-password/reset',
  },

  // ---------------------- APPOINTMENTS ----------------
  Appointment: {
    BASE: '/appointments', // GET (paginated), PUT /:id
    GET_BY_ID: (id: string) => `/appointments/${id}`,
    BOOK: '/appointments/book',
    SEARCH: '/appointments/search',
    STATS: '/appointments/statistics',
    ADMIN_FEEDBACK: '/appointments/admin/feedback',
    MY_FEEDBACK: '/appointments/my-feedback',
    MY_FEEDBACKS: '/appointments/my-feedbacks', // Alternative
    CONFIRM: (id: string) => `/appointments/${id}/confirm`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    FEEDBACK: (appointmentId: string) => `/appointments/${appointmentId}/feedback`,
    CAN_FEEDBACK: (appointmentId: string) => `/appointments/${appointmentId}/can-feedback`,
    MEETING_INFO: (appointmentId: string) => `/appointments/${appointmentId}/meeting-info`,
    START_MEETING: (appointmentId: string) => `/appointments/${appointmentId}/start-meeting`,
    COMPLETE: (appointmentId: string) => `/appointments/${appointmentId}/complete`,
    SEND_REMINDER: (appointmentId: string) => `/appointments/${appointmentId}/send-reminder`,
    // Simple endpoints
    MY: '/appointments/my', // NEW: Simple endpoint for current user's appointments
    // From previous config
    MY_APPOINTMENTS: '/appointments',
    CONSULTANT_APPOINTMENTS: '/appointments',
    ALL: '/appointments',
  },

  // ---------------------- APPOINTMENT HISTORY ----------------
  AppointmentHistory: {
    LIST: '/appointment-history/list',
    GET_BY_APPOINTMENT_ID: (appointmentId: string) => `/appointment-history/appointment/${appointmentId}`,
    GET_BY_USER_ID: (userId: string) => `/appointment-history/user/${userId}`,
    STATS_ACTIONS: '/appointment-history/stats/actions',
    STATS_ROLES: '/appointment-history/stats/roles',
    CLEANUP: '/appointment-history/cleanup'
  },

  // ----------------------- CONSULTANT -----------------
  Consultant: {
    LIST: '/consultants',
    PUBLIC_LIST: '/consultants/public',
    PUBLIC_DETAIL: (id: string) => `/consultants/public/${id}`,
    TOP_RATED: '/consultants/top-rated',
    PERFORMANCE: (id: string) => `/consultants/${id}/performance`,
    MY_PERFORMANCE: '/consultants/my-performance',
    FEEDBACK_STATS_PUBLIC: (id: string) => `/consultants/${id}/feedback-stats-public`,
    FEEDBACK_STATS_DETAILED: (id: string) => `/consultants/${id}/feedback-stats-detailed`,
    // From previous config
    WITH_RATINGS: '/consultants/with-ratings',
    MY_PROFILE: '/consultants/my-profile',
    MY_STATS: '/consultants/my-stats',
    MY_REVIEWS: '/consultants/my-reviews',
    SEARCH: '/consultants/search'
  },

  // ----------------------- WEEKLY SCHEDULE ------------
  WeeklySchedule: {
    BASE: '/weekly-schedule', // POST, PUT /:scheduleId
    GET_BY_ID: (id: string) => `/weekly-schedule/${id}`,
    COPY_SCHEDULE: '/weekly-schedule/copy',
    AVAILABILITY: (id: string) => `/weekly-schedule/consultant/${id}/availability`,
    SLOTS_FOR_WEEK: (id: string) => `/weekly-schedule/consultant/${id}/slots-for-week`,
    MY_SCHEDULES: '/weekly-schedule/my-schedules',
    CONSULTANT_SCHEDULES: (consultantId: string) => `/weekly-schedule/consultant/${consultantId}`,
    ALL: '/weekly-schedule/all',
    WEEKLY_SLOTS: (consultantId: string) => `/weekly-schedule/weekly-slots/${consultantId}`
  },

  // ----------------------- BLOG -----------------------
  Blog: {
    BASE: '/blogs', // GET (paginated), POST
    GET_BY_ID: (id: string) => `/blogs/${id}`,
    SEARCH: '/blogs/search',
    COMMENTS: '/blogs/comments',
    COMMENTS_SEARCH: '/blogs/comments/search',
    COMMENTS_BY_USER: (userId: string) => `/blogs/comments/user/${userId}`,
    COMMENTS_FOR_BLOG: (blogId: string) => `/blogs/${blogId}/comments`,
    POST_COMMENT: (blogId: string) => `/blogs/${blogId}/comments`, // POST
    UPDATE_COMMENT: (blogId: string, commentId: string) => `/blogs/${blogId}/comments/${commentId}`, // PUT
    DELETE_COMMENT: (blogId: string, commentId: string) => `/blogs/${blogId}/comments/${commentId}`, // DELETE
    // From previous config
    LIST: '/blogs',
    DETAIL: (id: string) => `/blogs/${id}`,
    CREATE: '/blogs',
    UPDATE: (id: string) => `/blogs/${id}`,
    DELETE: (id: string) => `/blogs/${id}`
  },

  // ----------------------- FEEDBACK -------------------
  Feedback: {
    // Note: Most feedback routes are under Appointment now
    CONSULTANT_FEEDBACK: '/feedback/consultant',
    MY_FEEDBACK: '/feedback/my-feedback'
  },
  
  // ----------------------- PROFILE & USER MANAGEMENT --------------------
  Profile: {
    GET: '/profile/getUserProfile',
    UPDATE: '/profile/updateUserProfile',
    DELETE: '/profile/deleteUserProfile',
    UPDATE_STATUS: (userId: string) => `/profile/${userId}/status`,
    GET_ALL_USERS: '/profile/getAllUsers'
  },
  
  // Menstrual Cycle endpoints
  MenstrualCycle: {
    BASE: '/menstrual-cycle',
    TRACK: '/menstrual-cycle/track',
    GET_HISTORY: '/menstrual-cycle/history',
    PROCESS: '/menstrual-cycle/processMenstrualCycle',
    GET_CYCLES: '/menstrual-cycle/getCycles',
    GET_CYCLES_MONTH: (year: number, month: number) => `/menstrual-cycle/getCyclesByMonth/${year}/${month}`,
    TODAY_STATUS: '/menstrual-cycle/getTodayStatus',
    CYCLE_STATS: '/menstrual-cycle/getCycleStatistics',
    PERIOD_STATS: '/menstrual-cycle/getPeriodStatistics',
    UPDATE_NOTIFICATION: '/menstrual-cycle/updateNotificationStatus',
    CLEANUP: '/menstrual-cycle/cleanupDuplicates',
    RESET: '/menstrual-cycle/resetAllData'
  },

  // Home page endpoints
  Home: {
    GET_DATA: '/home/data',
    GET_CONSULTANTS: '/home/consultants', // Thêm endpoint mới
  },

  // Pill tracking endpoints
  PillTracking: {
    SETUP: '/pill-tracking/setup',
    GET_SCHEDULE_BY_USER: (userId: string) => `/pill-tracking/${userId}`,
    UPDATE_SCHEDULE_BY_USER: (userId: string) => `/pill-tracking/${userId}`,
    TAKE_PILL: (scheduleId: string) => `/pill-tracking/${scheduleId}/take`
  },

  // ----------------------- STI (TESTS, PACKAGES, ORDERS) --------------------
  STI: {
    // Tests
    CREATE_TEST: '/sti/createStiTest',
    GET_ALL_TESTS: '/sti/getAllStiTest',
    GET_TEST: (id: string) => `/sti/getStiTest/${id}`,
    UPDATE_TEST: (id: string) => `/sti/updateStiTest/${id}`,
    DELETE_TEST: (id: string) => `/sti/deleteStiTest/${id}`, // Note: Backend uses PUT method
    // Packages
    CREATE_PACKAGE: '/sti/createStiPackage',
    GET_ALL_PACKAGES: '/sti/getAllStiPackage',
    GET_PACKAGE: (id: string) => `/sti/getStiPackage/${id}`,
    UPDATE_PACKAGE: (id: string) => `/sti/updateStiPackage/${id}`,
    DELETE_PACKAGE: (id: string) => `/sti/deleteStiPackage/${id}`, // Note: Backend uses PUT method
    // Orders - NEW PAGINATED ENDPOINTS
    GET_ALL_ORDERS_PAGINATED: '/sti/orders', // Staff/Admin với pagination
    GET_MY_ORDERS: '/sti/my-orders', // Customer orders với pagination
    // Orders - LEGACY ENDPOINTS  
    CREATE_ORDER: '/sti/createStiOrder',
    GET_ALL_ORDERS: '/sti/getAllStiOrders', // Legacy: get orders by current customer
    GET_ORDERS_BY_CUSTOMER: (customerId: string) => `/sti/getAllStiOrders/${customerId}`,
    GET_ORDER: (id: string) => `/sti/getStiOrder/${id}`, // Fixed: backend uses getStiOrder not getOrderById
    UPDATE_ORDER: (id: string) => `/sti/updateStiOrder/${id}`, // Backend uses PATCH method
    // STI Results - NEW ENDPOINTS
    STI_RESULT: '/sti/sti-result',
    GET_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,
    UPDATE_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,
    SYNC_SAMPLE: '/sti/sti-result/sync-sample',
    NOTIFY_RESULT: '/sti/sti-result/notify',
    // Customer STI Results
    MY_STI_RESULTS: '/sti/my-results',
    MY_STI_RESULT: (orderId: string) => `/sti/my-result/${orderId}`,
    // Audit & Analytics
    GET_AUDIT_LOGS: '/sti/audit-logs', // With pagination
    GET_ALL_AUDIT_LOGS: '/sti/getAllAuditLogs', // Legacy
    GET_REVENUE_BY_CUSTOMER: (customerId: string) => `/sti/getRevenueByCustomer/${customerId}`,
    GET_TOTAL_REVENUE: '/sti/getTotalRevenue',
    // Schedules & Views
    VIEW_TEST_SCHEDULE_WITH_ORDERS: '/sti/viewTestScheduleWithOrders'
  },

  // ----------------------- STI ASSESSMENT --------------------
  STIAssessment: {
    CREATE: '/sti-assessment/create',
    HISTORY: '/sti-assessment/history',
    GET_BY_ID: (id: string) => `/sti-assessment/${id}`,
    UPDATE: (id: string) => `/sti-assessment/${id}`,
    DELETE: (id: string) => `/sti-assessment/${id}`,
    STATS_OVERVIEW: '/sti-assessment/stats/overview',
    PACKAGES_INFO: '/sti-assessment/packages/info'
  },

  // ----------------------- USER MANAGEMENT --------------------
  Users: {
    GET_ALL: '/users', // GET with pagination, search, filters
    GET_BY_ID: (id: string) => `/users/${id}`,
    CREATE: '/users', // POST - Admin only
    UPDATE: (id: string) => `/users/${id}`, // PUT - Admin only
    UPDATE_STATUS: (id: string) => `/users/${id}/status`, // PUT - Admin/Staff
    DELETE: (id: string) => `/users/${id}`, // DELETE - Admin only (soft delete)
    STATISTICS: '/users/statistics/overview' // GET - Admin/Staff
  },

} as const;

export type ApiGroups = typeof API; 