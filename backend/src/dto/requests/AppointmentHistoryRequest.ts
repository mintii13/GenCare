export interface AppointmentHistoryQuery {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';

    // Filter fields
    appointment_id?: string;
    action?: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
    performed_by_user_id?: string;
    performed_by_role?: 'customer' | 'consultant' | 'staff' | 'admin';
    date_from?: string;
    date_to?: string;
}

export interface CreateAppointmentHistoryRequest {
    appointment_id: string;
    action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
    performed_by_user_id: string;
    performed_by_role: 'customer' | 'consultant' | 'staff' | 'admin';
    old_data?: any;
    new_data: any;
}

export interface CleanupHistoryRequest {
    before_date: string;
}