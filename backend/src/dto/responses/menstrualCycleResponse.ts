export interface CycleStatsResponse {
    success: boolean;
    message: string;
    data?: {
        average_cycle_length: number;
        shortest_cycle: number;
        longest_cycle: number;
        cycle_regularity: 'regular' | 'irregular' | 'very_irregular';
        regularity_score: number;
        trend: 'stable' | 'lengthening' | 'shortening';
        last_6_cycles: number[];
        total_cycles_tracked: number;
        tracking_period_months: number;
    };
}

export interface PeriodStatsResponse {
    success: boolean;
    message: string;
    data?: {
        average_period_length: number;
        shortest_period: number;
        longest_period: number;
        period_regularity: 'regular' | 'irregular' | 'very_irregular';
        last_3_periods: Array<{
            start_date: string;
            length: number;
            notes?: string;
        }>;
        total_periods_tracked: number;
    };
}