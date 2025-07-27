import { PillTypes } from "../../models/PillTracking";

export interface SetupPillTrackingRequest {
    userId: string;
    pill_type: PillTypes;
    pill_start_date: string;
    reminder_time: string;
    reminder_enabled?: boolean;
}

export interface UpdateScheduleRequest {
    user_id: string;
    reminder_time?: string;
    reminder_enabled?: boolean;
    pill_type?: PillTypes;
    is_active?: boolean;
    is_taken?: boolean;
}

export interface GetScheduleRequest {
    userId: string;
    startDate?: string;
    endDate?: string;
}

export interface DeleteScheduleRequest {
    scheduleId: string;
}
