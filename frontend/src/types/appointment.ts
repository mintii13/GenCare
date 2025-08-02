export interface Appointment {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  consultant_id: {
    _id: string;
    specialization: string;
    user_id: {
      full_name: string;
    };
  };
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
  updated_date?: string;
  video_call_status?: 'not_started' | 'in_progress' | 'ended';
  meeting_info?: {
    meet_url: string;
    meeting_id: string;
    meeting_password?: string;
  };
  feedback?: {
    rating: number;
    comment?: string;
    feedback_date: string;
  };
}

export interface AppointmentHistory {
  _id: string;
  appointment_id: string;
  action: 'created' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'started';
  performed_by: string;
  performed_at: string;
  notes?: string;
  previous_data?: any;
  new_data?: any;
}

// Pagination types
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FiltersApplied {
  status?: string;
  customer_id?: string;
  consultant_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

// Query parameters cho appointment pagination
export interface AppointmentQuery {
  page?: number;
  limit?: number;
  status?: string;
  customer_id?: string;
  consultant_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'appointment_date' | 'created_date' | 'status';
  sort_order?: 'asc' | 'desc';
}

// Query parameters cho appointment history
export interface AppointmentHistoryQuery {
  page?: number;
  limit?: number;
  appointment_id?: string;
  action?: string;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'performed_at' | 'action';
  sort_order?: 'asc' | 'desc';
}

// Response types với pagination
export interface AppointmentsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    appointments: Appointment[];
    pagination: PaginationInfo;
    filters_applied: FiltersApplied;
  };
  timestamp: string;
}

export interface AppointmentHistoryPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    history: AppointmentHistory[];
    pagination: PaginationInfo;
    filters_applied: FiltersApplied;
  };
  timestamp: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data?: {
    appointment?: Appointment;
    appointments?: Appointment[];
    appointmentId?: string;
    meetingDetails?: {
      meet_url: string;
      meeting_id: string;
      meeting_password?: string;
      calendar_event_id?: string;
    };
    pagination?: PaginationInfo;
    total?: number;
    summary?: any;
    stats?: any;
  };
  requiresGoogleAuth?: boolean;
  googleAuthUrl?: string;
  timestamp?: string;
  errorType?: string;
  details?: {
    existingAppointment?: {
      id: string;
      appointment_date: string;
      time_slot: string;
      status: string;
    };
    [key: string]: any;
  };
}

export interface AppointmentSlot {
  date: string;
  time: string;
  isAvailable: boolean;
}

export interface BookAppointmentRequest {
  consultant_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  customer_notes?: string;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  in_progress: number;
  today: number;
} 