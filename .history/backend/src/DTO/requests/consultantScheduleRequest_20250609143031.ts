export interface CreateScheduleRequest {
    date: string; // Format: "YYYY-MM-DD"
    start_time: string; // Format: "HH:mm"
    end_time: string; // Format: "HH:mm"
    break_start?: string; // Format: "HH:mm"
    break_end?: string; // Format: "HH:mm"
    is_available?: boolean;
}

export interface UpdateScheduleRequest {
    date?: string; // Format: "YYYY-MM-DD"
    start_time?: string; // Format: "HH:mm"
    end_time?: string; // Format: "HH:mm"
    break_start?: string; // Format: "HH:mm"
    break_end?: string; // Format: "HH:mm"
    is_available?: boolean;
}

export interface GetScheduleQuery {
    start_date?: string; // Format: "YYYY-MM-DD"
    end_date?: string; // Format: "YYYY-MM-DD"
    consultant_id?: string; // For staff/admin to view specific consultant's schedule
}

export interface GetAvailabilityQuery {
    date: string; // Format: "YYYY-MM-DD"
}