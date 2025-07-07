import { IAppointmentHistory } from '../../models/AppointmentHistory';

export interface AppointmentHistoryResponse {
    success: boolean;
    message: string;
    data?: {
        history?: IAppointmentHistory | IAppointmentHistory[];
        appointment_histories?: IAppointmentHistory[];
        activities?: IAppointmentHistory[];
        action_stats?: any;
        role_stats?: any;
        deleted_count?: number;
        user_id?: string;  // ✅ THÊM: Support user_id
        pagination?: {
            current_page: number;
            total_pages: number;
            total_items: number;
            items_per_page: number;
            has_next: boolean;
            has_prev: boolean;
        };
        filters_applied?: any;
        date_range?: {
            start_date?: Date;
            end_date?: Date;
        };
        before_date?: Date;
    };
    timestamp?: string;
}

export interface AppointmentHistoryStatsResponse {
    success: boolean;
    message: string;
    data?: {
        action_stats?: {
            [key: string]: number;
        };
        role_stats?: {
            [key: string]: number;
        };
        date_range?: {
            start_date?: Date;
            end_date?: Date;
        };
    };
    timestamp?: string;
}