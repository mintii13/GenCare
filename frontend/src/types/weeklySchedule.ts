export interface IWorkingDay {
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
    is_available: boolean;
}

export interface IWeeklySchedule {
    _id?: string;
    consultant_id: string;
    week_start_date: string; 
    week_end_date?: string;
    working_days: {
        monday?: IWorkingDay;
        tuesday?: IWorkingDay;
        wednesday?: IWorkingDay;
        thursday?: IWorkingDay;
        friday?: IWorkingDay;
        saturday?: IWorkingDay;
        sunday?: IWorkingDay;
    };
    default_slot_duration: number;
    notes?: string;
    created_by?: {
        user_id: string;
        role: string;
        name: string;
    };
    created_date?: string;
    updated_date?: string;
} 