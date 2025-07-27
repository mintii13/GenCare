import { IDailyMoodData, IPeriodDay } from '../../models/MenstrualCycle';

export interface ProcessMenstrualCycleRequest {
    period_days: IPeriodDay[]; // Changed to array of period day objects
    notes?: string; // Keep for backward compatibility
}

export interface CreateMoodDataRequest {
    date: string;
    mood_data: IDailyMoodData;
}

export interface UpdateMoodDataRequest {
    date: string;
    mood_data: Partial<IDailyMoodData>;
}

export interface GetMoodDataRequest {
    date?: string;
    start_date?: string;
    end_date?: string;
}

// New interface for period day mood data
export interface PeriodDayMoodRequest {
    date: string;
    mood_data: IDailyMoodData;
}

// New interface for processing cycle with period day mood data
export interface ProcessCycleWithMoodRequest {
    period_days: PeriodDayMoodRequest[];
}
export interface CycleStatsData {
    _id: string;
    cycle_start_date: Date;
    cycle_length: number;
    period_days: number;
    createdAt: Date;
}

export interface PeriodStatsData {
    _id: string;
    cycle_start_date: Date;
    period_days: number;
    createdAt: Date;
}