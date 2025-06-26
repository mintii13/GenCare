export interface CycleStatsResponse {
    success: boolean;
    message: string;
    data?: {
        average_cycle_length: number;
        shortest_cycle: number;
        longest_cycle: number;
        cycle_regularity: RegularityStatus;
        trend: TrendStatus;
        last_6_cycles: Array<{start_date: string; length: number;}>;
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
        period_regularity: RegularityStatus;
        last_3_periods: Array<{
            start_date: string;
            length: number;
        }>;
        total_periods_tracked: number;
    };
}

export type RegularityStatus = 'regular' | 'irregular' | 'insufficient_data';
export type TrendStatus = 'stable' | 'lengthening' | 'shortening';