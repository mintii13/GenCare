// Re-export common types for backward compatibility
export { 
  type PaginationInfo,
  type ApiResponse,
  type PaginatedResponse,
  type BaseQuery,
  type UserRole,
  type EntityStatus,
  type AppointmentStatus,
  type OrderStatus,
  type DateRange,
  type TimeSlot,
  type BaseEntity,
  type ValidationError,
  type ApiError,
  type FileUpload
} from './common';

export interface BackendPaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo | null | undefined;
} 