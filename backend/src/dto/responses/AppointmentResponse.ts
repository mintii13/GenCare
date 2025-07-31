import { IAppointment } from "../../models/Appointment";

export interface AppointmentResponse {
    success: boolean;
    message: string;
    data?: {
        appointment?: any; //  SỬA: Flexible hơn
        appointments?: any[]; //  THÊM: Support multiple appointments
        appointmentId?: string;
        meetingDetails?: {
            meet_url: string;
            meeting_id: string;
            meeting_password?: string;
            calendar_event_id?: string;
        };
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        total?: number; //  THÊM: Support total count
        summary?: any;
        stats?: any;
    };
    requiresGoogleAuth?: boolean;
    googleAuthUrl?: string;
    timestamp?: string;
    errorType?: string; //  THÊM: Support error type
    details?: any; //  THÊM: Support error details
}

export interface AppointmentsResponse {
    success: boolean;
    message: string;
    data?: {
        appointments: Array<Partial<IAppointment> & {
            customer_id?: {
                _id: string;
                full_name: string;
                email: string;
                phone?: string;
            };
            consultant_id?: {
                _id: string;
                user_id: string;
                specialization: string;
                qualifications?: string;
            };
        }>;
        total: number;
    };
    timestamp?: string;
}

export interface AppointmentStatsResponse {
    success: boolean;
    message: string;
    data?: {
        stats: {
            total: number;
            pending: number;
            confirmed: number;
            completed: number;
            cancelled: number;
        };
    };
    timestamp?: string;
}