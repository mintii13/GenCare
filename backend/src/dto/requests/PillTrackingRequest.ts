import { IPillTracking } from "../../models/PillTracking";

export interface SetupPillTrackingRequest {
    userId: string;
    pill_type: string;
    pill_start_date: string;
    reminder_time: string;
    reminder_enabled?: boolean;
    max_reminder_times?: number;
    reminder_interval?: number;
}

export interface UpdateScheduleRequest {
    user_id: string;
    reminder_time?: string;
    reminder_enabled?: boolean;
    pill_type?: string;
    is_active?: boolean;
    is_taken?: boolean;
    reminder_sent_timestamps?: Date[];
    max_reminder_times?: number;
    reminder_interval?: number;
}

export interface GetScheduleRequest {
    userId: string;
    startDate?: string;
    endDate?: string;
}

export interface DeleteScheduleRequest {
    scheduleId: string;
}
