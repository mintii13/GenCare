// ==========================================
//     COMMON TYPES - DÙNG CHUNG TOÀN PROJECT
// ==========================================

// Base API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
  timestamp?: string;
}

// Unified Pagination Interface
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Paginated Response Structure
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: PaginationInfo;
    filters_applied?: Record<string, any>;
  };
  timestamp: string;
}

// Common Query Parameters
export interface BaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// User Roles
export type UserRole = 'customer' | 'staff' | 'admin' | 'consultant';

// Common Status Types
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

// Date/Time Types
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available?: boolean;
}

// Base Entity Interface (có _id và timestamps)
export interface BaseEntity {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
  details?: string;
  statusCode?: number;
}

// File Upload Types
export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
} 