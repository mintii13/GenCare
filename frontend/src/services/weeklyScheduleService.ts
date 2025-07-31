import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

export interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
}

export interface WeeklyScheduleRequest {
  consultant_id?: string; // Required for create, optional for interface
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
    console.log('📤 [DEBUG] WeeklyScheduleService.createSchedule called with:', data);
    console.log('🎯 [DEBUG] API endpoint:', API.WeeklySchedule.BASE);
    
    const response = await apiClient.post(API.WeeklySchedule.BASE, data);
    
    console.log('📥 [DEBUG] WeeklyScheduleService.createSchedule response:', response.data);
    return response.data;
  },

  // Update weekly schedule
  async updateSchedule(scheduleId: string, data: Partial<WeeklyScheduleRequest>) {
    const response = await apiClient.put(`${API.WeeklySchedule.BASE}/${scheduleId}`, data);
    return response.data;
  },

  // Get consultant schedules
  async getConsultantSchedules(consultantId: string, startDate?: string, endDate?: string) {
    console.log('📤 [DEBUG] WeeklyScheduleService.getConsultantSchedules called with:', {
      consultantId,
      startDate,
      endDate
    });
    console.log('🎯 [DEBUG] API endpoint:', API.WeeklySchedule.CONSULTANT_SCHEDULES(consultantId));
    
    const params = { start_date: startDate, end_date: endDate };
    
    try {
      const response = await apiClient.get(API.WeeklySchedule.CONSULTANT_SCHEDULES(consultantId), { params });
      console.log('📥 [DEBUG] WeeklyScheduleService.getConsultantSchedules response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(' [DEBUG] WeeklyScheduleService.getConsultantSchedules error:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Get current user's schedules (for consultant)
  async getMySchedules(startDate?: string, endDate?: string) {
    console.log('📤 [DEBUG] WeeklyScheduleService.getMySchedules called with:', {
      startDate,
      endDate
    });
    console.log('🎯 [DEBUG] API endpoint:', API.WeeklySchedule.MY_SCHEDULES);
    
    const params = { start_date: startDate, end_date: endDate };
    
    try {
      const response = await apiClient.get(API.WeeklySchedule.MY_SCHEDULES, { params });
      console.log('📥 [DEBUG] WeeklyScheduleService.getMySchedules response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(' [DEBUG] WeeklyScheduleService.getMySchedules error:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Get weekly slots for booking
  async getWeeklySlots(consultantId: string, weekStartDate: string) {
    const response = await apiClient.get(API.WeeklySchedule.WEEKLY_SLOTS(consultantId), { params: { week_start_date: weekStartDate } });
    return response.data;
  },

  // Copy schedule to another week
  async copySchedule(scheduleId: string, targetWeekStartDate: string) {
    const response = await apiClient.post(`${API.WeeklySchedule.BASE}/copy/${scheduleId}`, {
      target_week_start_date: targetWeekStartDate
    });
    return response.data;
  },

  // Delete schedule
  async deleteSchedule(scheduleId: string) {
    const response = await apiClient.delete(`${API.WeeklySchedule.BASE}/${scheduleId}`);
    return response.data;
  },

  // Get schedule by ID
  async getScheduleById(scheduleId: string) {
    const response = await apiClient.get(`${API.WeeklySchedule.BASE}/${scheduleId}`);
    return response.data;
  }
};