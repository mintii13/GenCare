export interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
  _id?: string;
}

export interface WeeklyScheduleData {
  working_days: {
    monday?: WorkingDay;
    tuesday?: WorkingDay;
    wednesday?: WorkingDay;
    thursday?: WorkingDay;
    friday?: WorkingDay;
    saturday?: WorkingDay;
    sunday?: WorkingDay;
  };
  default_slot_duration: number;
  notes?: string;
}

export interface Schedule {
  _id: string;
  consultant_id: string;
  week_start_date: string;
  week_end_date: string;
  working_days: WeeklyScheduleData['working_days'];
  default_slot_duration: number;
  notes?: string;
  created_by: {
    user_id: string;
    role: string;
    name: string;
  };
  created_date: string;
  updated_date: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface DaySchedule {
  date: string;
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
    customer_name: string;
  }>;
}

export interface WeeklySlotData {
  week_start_date: string;
  week_end_date: string;
  consultant_id: string;
  schedule_id: string;
  days: {
    [key: string]: DaySchedule;
  };
  summary: {
    total_working_days: number;
    total_available_slots: number;
    total_booked_slots: number;
  };
}

export const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'] as const;

export type DayName = typeof DAY_NAMES[number];
export type DayLabel = typeof DAY_LABELS[number];