import { IDailyMoodData, IPeriodDay } from '../../models/MenstrualCycle';

export interface CycleData {
    _id: string;
    user_id: string;
    cycle_start_date: string;
    period_days: IPeriodDay[]; // Changed to array of period day objects
    cycle_length?: number;
    mood_data?: { [date: string]: IDailyMoodData }; // Keep for backward compatibility
    predicted_cycle_end?: string;
    predicted_ovulation_date?: string;
    predicted_fertile_start?: string;
    predicted_fertile_end?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TodayStatus {
    date: string;
    is_period_day: boolean;
    is_fertile_day: boolean;
    is_ovulation_day: boolean;
    pregnancy_chance: 'low' | 'medium' | 'high' | 'very_high';
    recommendations: string[];
    period_mood_data?: IDailyMoodData; // Add mood data for period days
    day_in_cycle?: number;
    cycle_phase?: string;
}

export interface CycleComparison {
    total_cycles: number;
    comparisons: Array<{
        cycle_number: number;
        start_date: string;
        cycle_length: number;
        period_length: number;
        mood_comparison: any;
    }>;
}

export interface CycleStatistics {
    average_cycle_length: number;
    shortest_cycle: number;
    longest_cycle: number;
    cycle_regularity: 'regular' | 'irregular' | 'insufficient_data';
    trend: 'lengthening' | 'shortening' | 'stable';
    tracking_period_months: number;
    total_cycles_tracked: number;
    last_6_cycles: Array<{
        start_date: string;
        length: number;
    }>;
}

export interface PeriodStatistics {
    average_period_length: number;
    shortest_period: number;
    longest_period: number;
    period_regularity: 'regular' | 'irregular' | 'insufficient_data';
    total_periods_tracked: number;
    last_3_periods: Array<{
        start_date: string;
        length: number;
    }>;
}

// New interface for period mood statistics
export interface PeriodMoodStatistics {
    total_period_days: number;
    days_with_mood_data: number;
    average_mood: string;
    most_common_mood: string;
    most_common_symptoms: string[];
    mood_trend: 'improving' | 'declining' | 'stable';
    energy_distribution: {
        high: number;
        medium: number;
        low: number;
    };
    common_notes: string[];
}

export interface MoodDataResponse {
    success: boolean;
    message: string;
    data?: {
        date: string;
        mood_data: IDailyMoodData;
    };
}

export interface MoodDataListResponse {
    success: boolean;
    message: string;
    data?: {
        mood_data: { [date: string]: IDailyMoodData };
        total_entries: number;
    };
}

export interface MonthlyMoodSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        month: string;
        total_days_with_mood: number;
        average_mood: string;
        most_common_symptoms: string[];
        mood_trend: 'improving' | 'declining' | 'stable';
        cycle_insights: {
            pre_menstrual_mood: string;
            during_period_mood: string;
            post_period_mood: string;
        };
        period_mood_stats: PeriodMoodStatistics;
    };
}
}

export interface MonthlyMoodSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        month: string;
        total_days_with_mood: number;
        average_mood: string;
        most_common_symptoms: string[];
        mood_trend: 'improving' | 'declining' | 'stable';
        cycle_insights: {
            pre_menstrual_mood: string;
            during_period_mood: string;
            post_period_mood: string;
        };
        period_mood_stats: PeriodMoodStatistics;
    };
}
        start_date: string;
        cycle_length: number;
        period_length: number;
        mood_comparison: any;
    }>;
}

export interface CycleStatistics {
    average_cycle_length: number;
    shortest_cycle: number;
    longest_cycle: number;
    cycle_regularity: 'regular' | 'irregular' | 'insufficient_data';
    trend: 'lengthening' | 'shortening' | 'stable';
    tracking_period_months: number;
    total_cycles_tracked: number;
    last_6_cycles: Array<{
        start_date: string;
        length: number;
    }>;
}

export interface PeriodStatistics {
    average_period_length: number;
    shortest_period: number;
    longest_period: number;
    period_regularity: 'regular' | 'irregular' | 'insufficient_data';
    total_periods_tracked: number;
    last_3_periods: Array<{
        start_date: string;
        length: number;
    }>;
}

// New interface for period mood statistics
export interface PeriodMoodStatistics {
    total_period_days: number;
    days_with_mood_data: number;
    average_mood: string;
    most_common_mood: string;
    most_common_symptoms: string[];
    mood_trend: 'improving' | 'declining' | 'stable';
    energy_distribution: {
        high: number;
        medium: number;
        low: number;
    };
    common_notes: string[];
}

export interface MoodDataResponse {
    success: boolean;
    message: string;
    data?: {
        date: string;
        mood_data: IDailyMoodData;
    };
}

export interface MoodDataListResponse {
    success: boolean;
    message: string;
    data?: {
        mood_data: { [date: string]: IDailyMoodData };
        total_entries: number;
    };
}

export interface MonthlyMoodSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        month: string;
        total_days_with_mood: number;
        average_mood: string;
        most_common_symptoms: string[];
        mood_trend: 'improving' | 'declining' | 'stable';
        cycle_insights: {
            pre_menstrual_mood: string;
            during_period_mood: string;
            post_period_mood: string;
        };
        period_mood_stats: PeriodMoodStatistics;
    };
}
}

export interface MonthlyMoodSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        month: string;
        total_days_with_mood: number;
        average_mood: string;
        most_common_symptoms: string[];
        mood_trend: 'improving' | 'declining' | 'stable';
        cycle_insights: {
            pre_menstrual_mood: string;
            during_period_mood: string;
            post_period_mood: string;
        };
        period_mood_stats: PeriodMoodStatistics;
    };
}
        start_date: string;
        cycle_length: number;
        period_length: number;
        mood_comparison: any;
    }>;
}

export interface CycleStatistics {
    average_cycle_length: number;
    shortest_cycle: number;
    longest_cycle: number;
    cycle_regularity: 'regular' | 'irregular' | 'insufficient_data';
    trend: 'lengthening' | 'shortening' | 'stable';
    tracking_period_months: number;
    total_cycles_tracked: number;
    last_6_cycles: Array<{
        start_date: string;
        length: number;
    }>;
}

export interface PeriodStatistics {
    average_period_length: number;
    shortest_period: number;
    longest_period: number;
    period_regularity: 'regular' | 'irregular' | 'insufficient_data';
    total_periods_tracked: number;
    last_3_periods: Array<{
        start_date: string;
        length: number;
    }>;
}

// New interface for period mood statistics
export interface PeriodMoodStatistics {
    total_period_days: number;
    days_with_mood_data: number;
    average_mood: string;
    most_common_mood: string;
    most_common_symptoms: string[];
    mood_trend: 'improving' | 'declining' | 'stable';
    energy_distribution: {
        high: number;
        medium: number;
        low: number;
    };
    common_notes: string[];
}

export interface MoodDataResponse {
    success: boolean;
    message: string;
    data?: {
        date: string;
        mood_data: IDailyMoodData;
    };
}

export interface MoodDataListResponse {
    success: boolean;
    message: string;
    data?: {
        mood_data: { [date: string]: IDailyMoodData };
        total_entries: number;
    };
}

export interface MonthlyMoodSummaryResponse {
    success: boolean;
    message: string;
    data?: {
        month: string;
        total_days_with_mood: number;
        average_mood: string;
        most_common_symptoms: string[];
        mood_trend: 'improving' | 'declining' | 'stable';
        cycle_insights: {
            pre_menstrual_mood: string;
            during_period_mood: string;
            post_period_mood: string;
        };
        period_mood_stats: PeriodMoodStatistics;
    };
}