import { IWeeklySchedule } from "../../models/WeeklySchedule";

export interface ScheduleResponse {
    success: boolean;
    message: string;
    data?: {
        schedule: Partial<IWeeklySchedule>;
    };
    timestamp?: string;
}

export interface SchedulesResponse {
    success: boolean;
    message: string;
    data?: {
        schedules: Partial<IWeeklySchedule>[];
        total: number;
    };
    timestamp?: string;
}

export interface TimeSlot {
    start_time: string; // Format: "HH:mm"
    end_time: string; // Format: "HH:mm"
    is_available: boolean;
}

export interface AvailabilityResponse {
    success: boolean;
    message: string;
    data?: {
        date: string;
        consultant_id: string;
        available_slots: TimeSlot[];
        total_slots: number;
    };
    timestamp?: string;
}