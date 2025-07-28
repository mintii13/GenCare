/*
  Centralised API endpoint map.
  ------------------------------------------------------
  - Mặc định các service hiện tại đã config axios baseURL nên bạn
    chỉ cần khai báo path bắt đầu bằng '/'.
  - Gom nhóm endpoints theo module để dễ tra cứu.
*/

import { SpecializationType } from "../../../backend/src/models/Consultant";

export const API = {
  // Base URL for API calls
  BASE_URL: import.meta.env.VITE_API_URL,
  
  // ----------------------- AUTH -----------------------
  Auth: {
    LOGIN: '/auth/login',//1
    REGISTER: '/auth/register/send-otp',//2
    CHECK_EMAIL: '/auth/check-email',//3
    VERIFY_OTP: '/auth/register/verify-otp',//4
    RESEND_OTP: '/auth/resendOTP',//5
    LOGOUT: '/auth/logout',//6
    CHANGE_PASSWORD: '/auth/change-password',//7
    GOOGLE_VERIFY: '/auth/google/verify',//8
    GOOGLE_CALLBACK: '/auth/google/callback',//9
    CREATE_GOOGLE_MEET: '/auth/create-google-meet',//10
    // Legacy endpoints below - can be removed if not used
    REFRESH: '/identity/refresh',//11
    USER_INFO: '/identity/user',//12
    LOGIN_PUBLIC: '/auth/login',//13
    REGISTER_PUBLIC: '/auth/register/send-otp',//14
    ME: '/auth/me',//15
    REFRESH_TOKEN: '/auth/refresh-token',//16
    SEND_VERIFICATION: '/auth/send-verification',//17
    VERIFY_EMAIL: '/auth/verify-email',//18
    FORGOT_PASSWORD: '/auth/forgot-password',//19
    RESET_PASSWORD: '/auth/reset-password',//20
    FORGOT_PASSWORD_REQUEST: '/auth/forgot-password/request',//21
    FORGOT_PASSWORD_VERIFY: '/auth/forgot-password/verify',//22
    FORGOT_PASSWORD_RESET: '/auth/forgot-password/reset',//23
  },

  // ---------------------- APPOINTMENTS ----------------
  Appointment: {
    BASE: '/appointments', // GET (paginated), PUT /:id
    GET_BY_ID: (id: string) => `/appointments/${id}`,//24
    BOOK: '/appointments/book',//25
    SEARCH: '/appointments/search',//26
    STATS: '/appointments/statistics',//27
    ADMIN_FEEDBACK: '/appointments/admin/feedback',//28
    MY_FEEDBACK: '/appointments/my-feedback',//29
    MY_FEEDBACKS: '/appointments/my-feedbacks', // 30 
    CONFIRM: (id: string) => `/appointments/${id}/confirm`,//31
    CANCEL: (id: string) => `/appointments/${id}/cancel`,//32
    FEEDBACK: (appointmentId: string) => `/appointments/${appointmentId}/feedback`,//33
    CAN_FEEDBACK: (appointmentId: string) => `/appointments/${appointmentId}/can-feedback`,//34
    MEETING_INFO: (appointmentId: string) => `/appointments/${appointmentId}/meeting-info`,//35
    START_MEETING: (appointmentId: string) => `/appointments/${appointmentId}/start-meeting`,//36
    COMPLETE: (appointmentId: string) => `/appointments/${appointmentId}/complete`,//37
    SEND_REMINDER: (appointmentId: string) => `/appointments/${appointmentId}/send-reminder`,//38
    // Simple endpoints
    MY: '/appointments/my', // NEW: Simple endpoint for current user's appointments
    // From previous config
    MY_APPOINTMENTS: '/appointments',//39
    CONSULTANT_APPOINTMENTS: '/appointments',//40
    ALL: '/appointments'//41
  },

  // ---------------------- APPOINTMENT HISTORY ----------------
  AppointmentHistory: {
    LIST: '/appointment-history/list',//42
    GET_BY_APPOINTMENT_ID: (appointmentId: string) => `/appointment-history/appointment/${appointmentId}`,//43
    GET_BY_USER_ID: (userId: string) => `/appointment-history/user/${userId}`,//44
    STATS_ACTIONS: '/appointment-history/stats/actions',//45
    STATS_ROLES: '/appointment-history/stats/roles',//46
    CLEANUP: '/appointment-history/cleanup'//47
  },

  // ----------------------- CONSULTANT -----------------
  Consultant: {
    LIST: '/consultants',//48
    DROPDOWN_LIST_SPECIALIZATION: (specialization: SpecializationType) => `/consultants/dropdown/${specialization}`,
    PUBLIC_LIST: '/consultants/public',//49
    PUBLIC_DETAIL: (id: string) => `/consultants/public/${id}`,//50
    TOP_RATED: '/consultants/top-rated',//51
    PERFORMANCE: (id: string) => `/consultants/${id}/performance`,//52
    MY_PERFORMANCE: '/consultants/my-performance',//53
    FEEDBACK_STATS_PUBLIC: (id: string) => `/consultants/${id}/feedback-stats-public`,//54
    FEEDBACK_STATS_DETAILED: (id: string) => `/consultants/${id}/feedback-stats-detailed`,//55
    // From previous config
      WITH_RATINGS: '/consultants/with-ratings',//56
    MY_PROFILE: '/consultants/my-profile',//57
    MY_STATS: '/consultants/my-stats',//58
    MY_REVIEWS: '/consultants/my-reviews',//59
    SEARCH: '/consultants/search'//60
  },

  // ----------------------- WEEKLY SCHEDULE ------------
  WeeklySchedule: {
      BASE: '/weekly-schedule', // POST, PUT /:scheduleId//61
    GET_BY_ID: (id: string) => `/weekly-schedule/${id}`,//62
    COPY_SCHEDULE: (scheduleId: string) => `/weekly-schedule/copy/${scheduleId}`,//63
    AVAILABILITY: (id: string) => `/weekly-schedule/consultant/${id}/availability`,//64
    SLOTS_FOR_WEEK: (id: string) => `/weekly-schedule/consultant/${id}/slots-for-week`,//65
    MY_SCHEDULES: '/weekly-schedule/my-schedules',//66
    CONSULTANT_SCHEDULES: (consultantId: string) => `/weekly-schedule/consultant/${consultantId}`,//67
    ALL: '/weekly-schedule/all',//68
    WEEKLY_SLOTS: (consultantId: string) => `/weekly-schedule/weekly-slots/${consultantId}`//69
  },

  // ----------------------- BLOG -----------------------
  Blog: {
    BASE: '/blogs', // GET (paginated), POST//70
    GET_BY_ID: (id: string) => `/blogs/${id}`,//71
    SEARCH: '/blogs/search',//72
    COMMENTS: '/blogs/comments',//73
    COMMENTS_SEARCH: '/blogs/comments/search',//74
    COMMENTS_BY_USER: (userId: string) => `/blogs/comments/user/${userId}`,//75
    COMMENTS_FOR_BLOG: (blogId: string) => `/blogs/${blogId}/comments`,//76
    POST_COMMENT: (blogId: string) => `/blogs/${blogId}/comments`, // POST//77
    UPDATE_COMMENT: (blogId: string, commentId: string) => `/blogs/${blogId}/comments/${commentId}`, // PUT//78
    DELETE_COMMENT: (blogId: string, commentId: string) => `/blogs/${blogId}/comments/${commentId}`, // DELETE//79
    // From previous config
    LIST: '/blogs',//80
    DETAIL: (id: string) => `/blogs/${id}`,//81
    CREATE: '/blogs',//82
    UPDATE: (id: string) => `/blogs/${id}`,//83
    DELETE: (id: string) => `/blogs/${id}`//84
  },

  // ----------------------- FEEDBACK -------------------
  Feedback: {
    // Note: Most feedback routes are under Appointment now
    CONSULTANT_FEEDBACK: '/feedback/consultant',//85
    MY_FEEDBACK: '/feedback/my-feedback'//86
  },
  
  // ----------------------- PROFILE & USER MANAGEMENT --------------------
  Profile: {
    GET: '/profile/getUserProfile',//87
    UPDATE: '/profile/updateUserProfile',//88
    DELETE: '/profile/deleteUserProfile',//89
    UPDATE_STATUS: (userId: string) => `/profile/${userId}/status`,//90
    GET_ALL_USERS: '/profile/getAllUsers'//91
  },
  
  // Menstrual Cycle endpoints
  MenstrualCycle: {
    BASE: '/menstrual-cycle',//92
    TRACK: '/menstrual-cycle/track',//93
    GET_HISTORY: '/menstrual-cycle/history',//94
    PROCESS: `/menstrual-cycle/processMenstrualCycle`,//95
    // UPDATE: `/menstrual-cycle/update`, // REMOVED: This endpoint doesn't exist on backend
    GET_CYCLES: `/menstrual-cycle/getCycles`,//96
    GET_CYCLES_MONTH: (year: number, month: number) => `/menstrual-cycle/getCyclesByMonth/${year}/${month}`,//97
    GET_CYCLES_BY_MONTH: (year: number, month: number) => `/menstrual-cycle/getCyclesByMonth/${year}/${month}`,//98
    TODAY_STATUS: '/menstrual-cycle/today-status',//99
    CYCLE_STATS: '/menstrual-cycle/getCycleStatistics',//100
    GET_CYCLE_STATISTICS: '/menstrual-cycle/getCycleStatistics',//101
    PERIOD_STATS: '/menstrual-cycle/getPeriodStatistics',//102
    GET_PERIOD_STATISTICS: '/menstrual-cycle/getPeriodStatistics',//103
  GET_MOOD_STATISTICS: '/menstrual-cycle/getMoodStatistics',//104
    UPDATE_NOTIFICATION: '/menstrual-cycle/updateNotificationStatus',//104
    CLEANUP: '/menstrual-cycle/cleanupDuplicates',//105
    RESET: '/menstrual-cycle/resetAllData',//106
    MOOD_DATA: '/menstrual-cycle/mood-data',//107
    PERIOD_DAY_MOOD: (date: string) => `/menstrual-cycle/period-day/${date}/mood`,//108
    CREATE_PERIOD_DAY_MOOD: (date: string) => `/menstrual-cycle/period-day/${date}/mood`,//109
    MOOD_DATA_DELETE: (date: string) => `/menstrual-cycle/mood-data/${date}`,//109
    MOOD_DATA_MONTHLY_SUMMARY: (year: number, month: number) => `/menstrual-cycle/mood-data/monthly-summary/${year}/${month}`,//110
    STATISTICS: '/menstrual-cycle/statistics',//111
    COMPARISON: '/menstrual-cycle/comparison',//112
    PROCESS_MENSTRUAL_CYCLE: '/menstrual-cycle/processMenstrualCycle'//113
  },

  // Home page endpoints
  Home: {
    GET_DATA: '/home/data',//105
    GET_CONSULTANTS: '/home/consultants', // Thêm endpoint mới//106
  },

  // Pill tracking endpoints
  PillTracking: {
    SETUP: '/pill-tracking/setup',//107
    GET_SCHEDULE: (userId: string) => `/pill-tracking/${userId}`,//108
    UPDATE_SCHEDULE: '/pill-tracking',//109
    TAKE_PILL: (scheduleId: string) => `/pill-tracking/mark-as-taken/${scheduleId}`,//110
    WEEKLY: '/pill-tracking/weekly',//111
    MONTHLY: '/pill-tracking/monthly',//112
    STATISTICS: '/pill-tracking/statistics'//113
  },

  // ----------------------- STI (TESTS, PACKAGES, ORDERS) --------------------
  STI: {
    // Tests
    CREATE_TEST: '/sti/createStiTest',//114
    GET_ALL_TESTS: '/sti/getAllStiTest',//115
    GET_ALL_TESTS_PAGINATED: '/sti/getAllStiTest', // Tạm thời dùng endpoint cũ//116
    GET_TEST: (id: string) => `/sti/getStiTest/${id}`,//117
    UPDATE_TEST: (id: string) => `/sti/updateStiTest/${id}`,//118
    DELETE_TEST: (id: string) => `/sti/deleteStiTest/${id}`, // Note: Backend uses PUT method//119
    GET_TEST_STATS: '/sti/tests/stats', // Stats cho tests//120
    
    // Packages
    CREATE_PACKAGE: '/sti/createStiPackage',//121
    GET_ALL_PACKAGES: '/sti/getAllStiPackage',//122
    GET_ALL_PACKAGES_PAGINATED: '/sti/getAllStiPackage', // Tạm thời dùng endpoint cũ//123
    GET_PACKAGE: (id: string) => `/sti/getStiPackage/${id}`,//124

    UPDATE_PACKAGE: (id: string) => `/sti/updateStiPackage/${id}`,//125
    DELETE_PACKAGE: (id: string) => `/sti/deleteStiPackage/${id}`, // Note: Backend uses PUT method//126
    GET_PACKAGE_STATS: '/sti/packages/stats', // Stats cho packages//127
    GET_PACKAGE_TESTS: (packageId: string) => `/sti/packages/${packageId}/tests`, // Lấy tests trong package//128
    UPDATE_PACKAGE_TESTS: (packageId: string) => `/sti/packages/${packageId}/tests`, // Cập nhật tests trong package//129
    
    // Orders - NEW PAGINATED ENDPOINTS
    GET_ALL_ORDERS_PAGINATED: '/sti/orders', // Staff/Admin với pagination//130
    GET_MY_ORDERS: '/sti/my-orders', // Customer orders với pagination//131
    // Orders - LEGACY ENDPOINTS  
    CREATE_ORDER: '/sti/createStiOrder',//132
    GET_ALL_ORDERS: '/sti/getAllStiOrders', // Legacy: get orders by current customer//133
    GET_ORDERS_BY_CUSTOMER: (customerId: string) => `/sti/getAllStiOrders/${customerId}`,//134
    GET_ORDER: (id: string) => `/sti/getStiOrder/${id}`, // Fixed: backend uses getStiOrder not getOrderById//135
    UPDATE_ORDER: (id: string) => `/sti/updateStiOrder/${id}`, // Backend uses PATCH method//136
    UPDATE_ORDER_STATUS: (id: string) => `/sti/order/${id}/status`, // Backend uses PATCH method//137
    // STI Results - NEW ENDPOINTS
    CREATE_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,
    GET_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,//139
    UPDATE_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,//140
    GET_TESTS_FROM_ORDER: (id: string) => `/sti/sti-test/${id}`,
    GET_NONUPDATED_TESTS_FROM_ORDER: (id: string) => `/sti/sti-test/non-updated/${id}`,
    SAVE_STI_RESULT: (id: string) => `/sti/sti-result/${id}`,
    COMPLETED_STI_RESULT: (id: string) => `/sti/sti-result/${id}/completed`,
    // Customer STI Results
    MY_STI_RESULTS: '/sti/my-results',//143
    MY_STI_RESULT: (orderId: string) => `/sti/my-result/${orderId}`,//144
    // Audit & Analytics
    GET_AUDIT_LOGS: '/sti/audit-logs', // With pagination//145
    GET_ALL_AUDIT_LOGS: '/sti/getAllAuditLogs', // Legacy//146
    GET_REVENUE_BY_CUSTOMER: (customerId: string) => `/sti/getRevenueByCustomer/${customerId}`,//147
    GET_TOTAL_REVENUE: '/sti/getTotalRevenue',//148
    // Schedules & Views
    VIEW_TEST_SCHEDULE_WITH_ORDERS: '/sti/viewTestScheduleWithOrders'//149
  },

  // ----------------------- STI ASSESSMENT --------------------
  STIAssessment: {
    CREATE: '/sti-assessment/create',//150
    HISTORY: '/sti-assessment/history',//151
    GET_BY_ID: (id: string) => `/sti-assessment/${id}`,//152
    UPDATE: (id: string) => `/sti-assessment/${id}`,//153
    DELETE: (id: string) => `/sti-assessment/${id}`,//154
    STATS_OVERVIEW: '/sti-assessment/stats/overview',//155
    PACKAGES_INFO: '/sti-assessment/packages/info'//156
  },

  // ----------------------- USER MANAGEMENT --------------------
  Users: {
    GET_ALL: '/users', // GET with pagination, search, filters//157
    GET_BY_ID: (id: string) => `/users/${id}`,//158
    CREATE: '/users', // POST - Admin only//159
    UPDATE: (id: string) => `/users/${id}`, // PUT - Admin only//160
    UPDATE_STATUS: (id: string) => `/users/${id}/status`, // PUT - Admin/Staff//161
    DELETE: (id: string) => `/users/${id}`, // DELETE - Admin only (soft delete)//162
    STATISTICS: '/users/statistics/overview' // GET - Admin/Staff//163
  },
  Payment:{
    CREATE_PAYMENT: (id: string) =>  `/payment/create/${id}`,
    MOMO_IPN_PROXY: '/payment/momo/ipn'
  }

} as const;

export type ApiGroups = typeof API; 