import { apiClient } from './apiClient';
import { API } from '../config/apiEndpoints';

// This is a placeholder. We will define the actual types and API calls later.
export interface MenstrualCycleData {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export const getMenstrualCycleData = async (userId: string): Promise<MenstrualCycleData[]> => {
  const response = await apiClient.get(`/users/${userId}/menstrual-cycle`);
  return response.data as MenstrualCycleData[];
};

export const addMenstrualCycleData = async (data: Omit<MenstrualCycleData, 'id'>): Promise<MenstrualCycleData> => {
  const response = await apiClient.post(API.MenstrualCycle.BASE, data);
  return response.data as MenstrualCycleData;
};

export const updateMenstrualCycleData = async (id: string, data: Partial<MenstrualCycleData>): Promise<MenstrualCycleData> => {
    const response = await apiClient.put(`${API.MenstrualCycle.BASE}/${id}`, data);
    return response.data as MenstrualCycleData;
};

export const deleteMenstrualCycleData = async (id: string): Promise<void> => {
    await apiClient.delete(`${API.MenstrualCycle.BASE}/${id}`);
};

export interface ProcessCycleRequest {
  period_days: string[];
  notes?: string;
}

export interface CycleData {
  _id: string;
  user_id: string;
  cycle_start_date: string;
  period_days: string[];
  cycle_length?: number;
  notes?: string;
  predicted_cycle_end?: string;
  predicted_ovulation_date?: string;
  predicted_fertile_start?: string;
  predicted_fertile_end?: string;
  notification_enabled?: boolean;
  notification_types?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TodayStatus {
  date: string;
  is_period_day: boolean;
  is_fertile_day: boolean;
  is_ovulation_day: boolean;
  pregnancy_chance: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface CycleStatistics {
  average_cycle_length: number;
  shortest_cycle: number;
  longest_cycle: number;
  cycle_regularity: 'regular' | 'irregular' | 'insufficient_data';
  trend: 'stable' | 'lengthening' | 'shortening';
  last_6_cycles: Array<{start_date: string; length: number;}>;
  total_cycles_tracked: number;
  tracking_period_months: number;
}

export interface PeriodStatistics {
  average_period_length: number;
  shortest_period: number;
  longest_period: number;
  period_regularity: 'regular' | 'irregular' | 'insufficient_data';
  last_3_periods: Array<{start_date: string; length: number;}>;
  total_periods_tracked: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const menstrualCycleService = {
  // Xử lý và lưu dữ liệu chu kì
  async processCycle(data: ProcessCycleRequest): Promise<ApiResponse<CycleData[]>> {
    const response = await apiClient.post('/menstrual-cycle/processMenstrualCycle', data);
    return response.data as ApiResponse<CycleData[]>;
  },

  async updateCycle(data: ProcessCycleRequest): Promise<ApiResponse<CycleData[]>> {
    try {
      console.log('🔍 [DEBUG] updateCycle sending data:', data);
      // Use the existing processMenstrualCycle endpoint instead of non-existent update endpoint
      const response = await apiClient.post('/menstrual-cycle/processMenstrualCycle', data);
      console.log('🔍 [DEBUG] updateCycle response:', response.data);
      return response.data as ApiResponse<CycleData[]>;
    } catch (error: any) {
      console.error('🔍 [DEBUG] updateCycle error:', error);
      console.error('🔍 [DEBUG] Backend response:', error.response?.data);
      throw error;
    }
  },

  // Lấy tất cả chu kì của user
  async getCycles(): Promise<ApiResponse<CycleData[]>> {
    const response = await apiClient.get(API.MenstrualCycle.GET_CYCLES);
    return response.data as ApiResponse<CycleData[]>;
  },

  // Lấy chu kì theo tháng
  async getCyclesByMonth(year: number, month: number): Promise<ApiResponse<CycleData[]>> {
    const response = await apiClient.get(API.MenstrualCycle.GET_CYCLES_MONTH(year, month));
    return response.data as ApiResponse<CycleData[]>;
  },

  // Lấy trạng thái hôm nay
  async getTodayStatus(): Promise<ApiResponse<TodayStatus>> {
    const response = await apiClient.get(API.MenstrualCycle.TODAY_STATUS);
    return response.data as ApiResponse<TodayStatus>;
  },

  // Lấy thống kê chu kì
  async getCycleStatistics(): Promise<ApiResponse<CycleStatistics>> {
    const response = await apiClient.get(API.MenstrualCycle.CYCLE_STATS);
    return response.data as ApiResponse<CycleStatistics>;
  },

  // Lấy thống kê kinh nguyệt
  async getPeriodStatistics(): Promise<ApiResponse<PeriodStatistics>> {
    const response = await apiClient.get(API.MenstrualCycle.PERIOD_STATS);
    return response.data as ApiResponse<PeriodStatistics>;
  },

  // Cập nhật cài đặt thông báo
  async updateNotificationSettings(settings: {
    notification_enabled: boolean;
    notification_types: string[];
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(API.MenstrualCycle.UPDATE_NOTIFICATION, settings);
    return response.data as ApiResponse<any>;
  },

  // Dọn dẹp dữ liệu trùng lặp
  async cleanupDuplicates(): Promise<ApiResponse<any>> {
    const response = await apiClient.get(API.MenstrualCycle.CLEANUP);
    return response.data as ApiResponse<any>;
  },

  // Reset toàn bộ dữ liệu chu kì
  async resetAllData(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(API.MenstrualCycle.RESET);
    return response.data as ApiResponse<any>;
  }
};

