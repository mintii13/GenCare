import { apiClient } from './apiClient';
import { API } from '../config/apiEndpoints';
import { ApiResponse } from './apiClient';

// ===== CYCLE DATA TYPES =====

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

// ===== API SERVICE =====

export const menstrualCycleService = {
  // Process cycle with period days
  async processCycle(period_days: string[]): Promise<ApiResponse<any>> {
    console.log('[processCycle] URL:', API.MenstrualCycle.PROCESS);
    console.log('[processCycle] Data:', { period_days });
    return apiClient.safePost(API.MenstrualCycle.PROCESS, { period_days });
  },

  // Get all cycles for user
  async getCycles(): Promise<ApiResponse<{ cycles: CycleData[]; total: number }>> {
    console.log('[getCycles] URL:', API.MenstrualCycle.GET_CYCLES);
    const response = await apiClient.safeGet<{ cycles: CycleData[]; total: number }>(API.MenstrualCycle.GET_CYCLES);
    console.log('[getCycles] Response:', {
      success: response.success,
      message: response.message,
      dataType: typeof response.data,
      dataLength: response.data?.cycles?.length || 0,
      data: response.data
    });
    return response;
  },

  // Get today's status
  async getTodayStatus(): Promise<ApiResponse<TodayStatus>> {
    console.log('[getTodayStatus] URL:', API.MenstrualCycle.TODAY_STATUS);
    const response = await apiClient.safeGet<TodayStatus>(API.MenstrualCycle.TODAY_STATUS);
    console.log('[getTodayStatus] Response:', response);
    return response;
  },

  // Get cycle statistics
  async getCycleStatistics(): Promise<ApiResponse<CycleStatistics>> {
    console.log('[getCycleStatistics] URL:', API.MenstrualCycle.GET_CYCLE_STATISTICS);
    const response = await apiClient.safeGet<CycleStatistics>(API.MenstrualCycle.GET_CYCLE_STATISTICS);
    console.log('[getCycleStatistics] Response:', response);
    return response;
  },

  // Get period statistics
  async getPeriodStatistics(): Promise<ApiResponse<PeriodStatistics>> {
    console.log('[getPeriodStatistics] URL:', API.MenstrualCycle.GET_PERIOD_STATISTICS);
    const response = await apiClient.safeGet<PeriodStatistics>(API.MenstrualCycle.GET_PERIOD_STATISTICS);
    console.log('[getPeriodStatistics] Response:', response);
    return response;
  },

  // Delete a specific period day
  async deletePeriodDay(date: string): Promise<ApiResponse<any>> {
    try {
      console.log('[deletePeriodDay] Deleting date:', date);
      console.log('[deletePeriodDay] URL:', API.MenstrualCycle.PERIOD_DAY_DELETE(date));
      
      const response = await apiClient.safeDelete(API.MenstrualCycle.PERIOD_DAY_DELETE(date));
      console.log('[deletePeriodDay] Delete response:', response);
      
      return response;
    } catch (error) {
      console.error('[deletePeriodDay] Error:', error);
      throw error;
    }
  },

  // Detect potential pregnancy
  async detectPregnancy(): Promise<ApiResponse<{
    isPotential: boolean;
    daysLate: number;
    lastPeriodDate?: string;
    expectedPeriodDate?: string;
  }>> {
    console.log('[detectPregnancy] URL:', API.MenstrualCycle.PREGNANCY_DETECTION);
    const response = await apiClient.safeGet<{
      isPotential: boolean;
      daysLate: number;
      lastPeriodDate?: string;
      expectedPeriodDate?: string;
    }>(API.MenstrualCycle.PREGNANCY_DETECTION);
    console.log('[detectPregnancy] Response:', response);
    return response;
  },

  // Delete a specific cycle
  async deleteCycle(cycleId: string): Promise<ApiResponse<any>> {
    try {
      console.log('[deleteCycle] Deleting cycle:', cycleId);
      console.log('[deleteCycle] URL:', API.MenstrualCycle.DELETE_CYCLE(cycleId));
      
      const response = await apiClient.safeDelete(API.MenstrualCycle.DELETE_CYCLE(cycleId));
      console.log('[deleteCycle] Delete response:', response);
      
      return response;
    } catch (error) {
      console.error('[deleteCycle] Error:', error);
      throw error;
    }
  },
};

