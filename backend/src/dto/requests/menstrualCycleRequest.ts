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
    notes?: string;
    createdAt: Date;
}