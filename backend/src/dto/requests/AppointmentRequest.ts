export interface BookAppointmentRequest {
    consultant_id: string;
    appointment_date: Date;
    start_time: string; // "HH:mm"
    end_time: string;   // "HH:mm"
    customer_notes?: string;
}

export interface UpdateAppointmentRequest {
    appointment_date?: Date;
    start_time?: string;
    end_time?: string;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    customer_notes?: string;
    consultant_notes?: string;
}

export interface RescheduleAppointmentRequest {
    appointment_date: Date;
    start_time: string;
    end_time: string;
}

export interface GetAppointmentsQuery {
    status?: string;
    start_date?: string; // "YYYY-MM-DD"
    end_date?: string;   // "YYYY-MM-DD"
    consultant_id?: string;
    customer_id?: string;
}