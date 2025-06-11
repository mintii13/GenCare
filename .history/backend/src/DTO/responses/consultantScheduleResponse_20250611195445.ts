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

export interface DaySlots {
    date: string; // Format: "YYYY-MM-DD"
    day_of_week: string; // monday, tuesday, etc.
    is_working_day: boolean;
    working_hours?: {
        start_time: string;
        end_time: string;
        break_start?: string;
        break_end?: string;
    };
    available_slots: TimeSlot[];
    total_slots: number;
    booked_appointments: Array<{
        appointment_id: string;
        start_time: string;
        end_time: string;
        status: string;
        customer_name?: string;
    }>;
}

// Updated: Weekly availability response instead of single day
export interface WeeklyAvailabilityResponse {
    success: boolean;
    message: string;
    data?: {
        week_start_date: string; // Format: "YYYY-MM-DD"
        week_end_date: string; // Format: "YYYY-MM-DD"
        consultant_id: string;
        schedule_id: string;
        days: {
            monday?: DaySlots;
            tuesday?: DaySlots;
            wednesday?: DaySlots;
            thursday?: DaySlots;
            friday?: DaySlots;
            saturday?: DaySlots;
            sunday?: DaySlots;
        };
        summary: {
            total_working_days: number;
            total_available_slots: number;
            total_booked_slots: number;
        };
    };
    timestamp?: string;
}

// Keep single day response for specific day queries
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