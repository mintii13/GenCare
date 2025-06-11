import { IWeeklySchedule } from "../../models/WeeklySchedule";

export interface WeeklyScheduleResponse {
    success: boolean;
    message: string;
    data?: {
        schedule: Partial<IWeeklySchedule>;
    };
    timestamp?: string;
}

export interface WeeklySchedulesResponse {
    success: boolean;
    message: string;
    data?: {
        schedules: Partial<IWeeklySchedule>[];
        total: number;
    };
    timestamp?: string;
}