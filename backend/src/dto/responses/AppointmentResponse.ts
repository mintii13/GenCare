import { IAppointment } from "../../models/Appointment";

export interface AppointmentResponse {
    success: boolean;
    message: string;
    data?: {
        appointment: Partial<IAppointment> & {
            customer_id: {
                _id: string;
                full_name: string;
                email: string;
                phone?: string;
            };
            consultant_id: {
                _id: string;
                user_id: string;
                specialization: string;
                qualifications?: string;
            };
        };
    };
    timestamp?: string;
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