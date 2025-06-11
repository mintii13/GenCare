export interface WorkingDay {
    start_time: string; // "HH:mm"
    end_time: string;   // "HH:mm"
    break_start?: string; // "HH:mm"
    break_end?: string;   // "HH:mm"
    is_available: boolean;
}

export interface CreateWeeklyScheduleRequest {
    consultant_id?: string; // Optional, will be resolved in controller
    week_start_date: Date;   // Must be a Monday
    working_days?: {
        monday?: WorkingDay;
        tuesday?: WorkingDay;
        wednesday?: WorkingDay;
        thursday?: WorkingDay;
        friday?: WorkingDay;
        saturday?: WorkingDay;
        sunday?: WorkingDay;
    };
    default_slot_duration?: number; // Default 30 minutes
    notes?: string;
}

export interface UpdateWeeklyScheduleRequest {
    week_start_date?: Date;
    working_days?: {
        monday?: WorkingDay;
        tuesday?: WorkingDay;
        wednesday?: WorkingDay;
        thursday?: WorkingDay;
        friday?: WorkingDay;
        saturday?: WorkingDay;
        sunday?: WorkingDay;
    };
    default_slot_duration?: number;
    notes?: string;
}

export interface GetSchedulesQuery {
    start_date?: string; // "YYYY-MM-DD"
    end_date?: string;   // "YYYY-MM-DD"
    consultant_id?: string; // For staff/admin to filter by consultant
}

export interface CopyScheduleRequest {
    target_week_start_date: Date; // Must be a Monday
}