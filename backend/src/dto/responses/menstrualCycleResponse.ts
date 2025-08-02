export interface CycleData {
    _id: string;
    user_id: string;
    cycle_start_date: string;
    period_days: string[]; // Simple array of date strings
    cycle_length?: number;
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
    is_pms_day?: boolean;
    pregnancy_chance: 'low' | 'medium' | 'high';
    recommendations: string[];
    day_in_cycle?: number;
    cycle_phase?: string;
    // Current cycle predictions
    predicted_cycle_end?: string;
    predicted_ovulation_date?: string;
    predicted_fertile_start?: string;
    predicted_fertile_end?: string;
    // PMS window
    pms_window_start?: string;
    pms_window_end?: string;
    // Next cycle predictions
    next_cycle_start?: string;
    next_ovulation_date?: string;
    next_fertile_start?: string;
    next_fertile_end?: string;
    // Cycle information
    cycle_length?: number;
    period_length?: number;
}

export interface CycleComparison {
    total_cycles: number;
    comparisons: Array<{
        cycle_number: number;
        start_date: string;
        cycle_length: number;
        period_length: number;
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



export interface MenstrualCycleResponse {
    success: boolean;
    message: string;
    data?: CycleData;
}

export interface MenstrualCycleListResponse {
    success: boolean;
    message: string;
    data?: {
        cycles: CycleData[];
        total: number;
    };
}

export interface TodayStatusResponse {
    success: boolean;
    message: string;
    data?: TodayStatus;
}

export interface CycleComparisonResponse {
    success: boolean;
    message: string;
    data?: CycleComparison;
}

export interface CycleStatisticsResponse {
    success: boolean;
    message: string;
    data?: CycleStatistics;
}

export interface PeriodStatisticsResponse {
    success: boolean;
    message: string;
    data?: PeriodStatistics;
}