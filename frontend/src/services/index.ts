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