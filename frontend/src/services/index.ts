// API instance
export { default as apiClient } from './apiClient';

// Services
export * from './appointmentService';
export * from './weeklyScheduleService';
export * from './consultantService';
export * from './userService';
export * from './feedbackService';
export * from './appointmentHistoryService';
export * from './blogService';
export * from './autoConfirmService';
export * from './medicationReminderService';
export * from './menstrualCycleService';
export { STIAssessmentService } from './stiAssessmentService';
export { default as homeService } from './homeService';
export { STIOrderService } from './stiOrderService';
export { STITestService, STIPackageService } from './stiService';

// Re-export commonly used types
export type {
  Appointment,
  BookAppointmentRequest,
  AppointmentResponse
} from './appointmentService';

export type {
  WeeklySchedule,
  WeeklyScheduleRequest,
  WorkingDay,
  TimeSlot,
  DaySchedule,
  WeeklySlots
} from './weeklyScheduleService';

export type {
  Consultant,
  ConsultantResponse,
  ConsultantStats
} from './consultantService';

export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UpdateProfileRequest,
  ChangePasswordRequest
} from './userService';

export type {
  STIOrder,
  CreateSTIOrderRequest,
  UpdateSTIOrderRequest,
  STIOrderQuery,
  STIOrdersPaginatedResponse,
  STIOrderResponse
} from './stiOrderService';

export type {
  STITest,
  STIPackage,
  CreateSTITestRequest,
  UpdateSTITestRequest,
  CreateSTIPackageRequest,
  UpdateSTIPackageRequest,
  STIQuery,
  STITestResponse,
  STITestsResponse,
  STIPackageResponse,
  STIPackagesResponse,
  STIPaginatedResponse
} from './stiService';