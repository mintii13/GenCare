import api from './api';

export interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
}

export interface WeeklyScheduleRequest {
  week_start_date: string;
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

export interface WeeklySchedule {
  _id: string;
  consultant_id: string;
  week_start_date: string;
  week_end_date: string;
  working_days: { [key: string]: WorkingDay };
  default_slot_duration: number;
  notes?: string;
  created_by: {
    user_id: string;
    role: string;
    name: string;
  };
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

export interface WeeklySlots {
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

export const weeklyScheduleService = {
  // Create weekly schedule
  async createSchedule(data: WeeklyScheduleRequest) {
    const response = await api.post('/weekly-schedule', data);
    return response.data;
  },

  // Update weekly schedule
  async updateSchedule(scheduleId: string, data: Partial<WeeklyScheduleRequest>) {
    const response = await api.put(`/weekly-schedule/${scheduleId}`, data);
    return response.data;
  },

  // Get consultant schedules
  async getConsultantSchedules(consultantId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/weekly-schedule/consultant/${consultantId}?${params}`);
    return response.data;
  },

  // Get current user's schedules (for consultant)
  async getMySchedules(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/weekly-schedule/my-schedules?${params}`);
    return response.data;
  },

  // Get weekly slots for booking
  async getWeeklySlots(consultantId: string, weekStartDate: string) {
    const response = await api.get(`/weekly-schedule/weekly-slots/${consultantId}?week_start_date=${weekStartDate}`);
    return response.data;
  },

  // Copy schedule to another week
  async copySchedule(scheduleId: string, targetWeekStartDate: string) {
    const response = await api.post(`/weekly-schedule/copy/${scheduleId}`, {
      target_week_start_date: targetWeekStartDate
    });
    return response.data;
  },

  // Delete schedule
  async deleteSchedule(scheduleId: string) {
    const response = await api.delete(`/weekly-schedule/${scheduleId}`);
    return response.data;
  },

  // Get schedule by ID
  async getScheduleById(scheduleId: string) {
    const response = await api.get(`/weekly-schedule/${scheduleId}`);
    return response.data;
  }
}; 