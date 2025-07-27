import { apiClient } from './apiClient';
import { API } from '../config/apiEndpoints';

// ===== NEW PERIOD DAY TYPES =====

export interface PeriodDay {
  date: string;
  mood_data?: DailyMoodData;
}

export interface ProcessCycleWithMoodRequest {
  period_days: PeriodDay[];
}

// ===== MOOD DATA TYPES =====

export interface DailyMoodData {
  mood: 'happy' | 'sad' | 'tired' | 'excited' | 'calm' | 'stressed' | 'neutral';
  energy: 'high' | 'medium' | 'low';
  symptoms: string[];
  notes?: string;
}

export interface MoodData {
  [date: string]: DailyMoodData;
}

export interface CreateMoodDataRequest {
  date: string;
  mood_data: DailyMoodData;
}

export interface UpdateMoodDataRequest {
  date: string;
  mood_data: Partial<DailyMoodData>;
}

export interface GetMoodDataRequest {
  date?: string;
  start_date?: string;
  end_date?: string;
}

export type MoodDataResponse = ApiResponse<{
  date: string;
  mood_data: DailyMoodData;
}>;

export type MoodDataListResponse = ApiResponse<{
  mood_data: MoodData;
  total_entries: number;
}>;

// ===== NEW STATISTICS TYPES =====

export interface PeriodMoodStatistics {
  total_period_days: number;
  days_with_mood_data: number;
  average_mood: string;
  most_common_mood: string;
  most_common_symptoms: string[];
  mood_trend: 'improving' | 'declining' | 'stable';
  energy_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  common_notes: string[];
}

export interface CycleMoodStatistics {
  cycle_id: string;
  cycle_start_date: string;
  period_mood_stats: PeriodMoodStatistics;
}

export interface CycleComparison {
  current_cycle: CycleMoodStatistics;
  previous_cycles: CycleMoodStatistics[];
  trends: {
    overall_trend: 'improving' | 'declining' | 'stable';
    symptom_changes: Array<{
      symptom: string;
      change: 'increased' | 'decreased' | 'stable';
    }>;
    energy_trend: 'improving' | 'declining' | 'stable';
  };
}

export type MonthlyMoodSummaryResponse = ApiResponse<{
  month: string;
  total_days_with_mood: number;
  average_mood: string;
  most_common_symptoms: string[];
  mood_trend: 'improving' | 'declining' | 'stable';
  cycle_insights: {
    pre_menstrual_mood: string;
    during_period_mood: string;
    post_period_mood: string;
  };
  period_mood_stats: PeriodMoodStatistics;
}>;

// ===== CYCLE DATA TYPES =====

export interface CycleData {
  _id: string;
  user_id: string;
  cycle_start_date: string;
  period_days: PeriodDay[]; // Changed from string[] to PeriodDay[]
  cycle_length?: number;
  mood_data?: MoodData; // Keep for backward compatibility
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
  pregnancy_chance: 'low' | 'medium' | 'high' | 'very_high';
  recommendations: string[];
  period_mood_data?: DailyMoodData; // Add mood data for period days
  day_in_cycle?: number;
  cycle_phase?: string;
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

// Use the ApiResponse from apiClient instead of defining our own
import { ApiResponse } from './apiClient';

// ===== LEGACY TYPES (FOR BACKWARD COMPATIBILITY) =====

export interface ProcessCycleRequest {
  period_days: string[]; // Keep old format for backward compatibility
  mood_data?: MoodData;
}

export interface MenstrualCycleData {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

// ===== API SERVICE =====

export const menstrualCycleService = {
  // ===== NEW ENDPOINTS =====

  // Process cycle with period day mood data
  async processCycleWithMood(data: ProcessCycleWithMoodRequest): Promise<ApiResponse<CycleData[]>> {
    return apiClient.safePost(API.MenstrualCycle.PROCESS, data);
  },

  // Update period day mood
  async updatePeriodDayMood(date: string, mood_data: DailyMoodData): Promise<MoodDataResponse> {
    return apiClient.safePut(API.MenstrualCycle.PERIOD_DAY_MOOD(date), { mood_data });
  },

  // Get period day mood
  async getPeriodDayMood(date: string): Promise<MoodDataResponse> {
    return apiClient.safeGet(API.MenstrualCycle.PERIOD_DAY_MOOD(date));
  },

  // Get cycle mood statistics
  async getCycleMoodStatistics(cycle_id?: string): Promise<ApiResponse<PeriodMoodStatistics>> {
    const url = cycle_id 
      ? `${API.MenstrualCycle.STATISTICS}?cycle_id=${cycle_id}`
      : API.MenstrualCycle.STATISTICS;
    return apiClient.safeGet(url);
  },

  // Get cycle comparison
  async getCycleComparison(): Promise<ApiResponse<CycleComparison>> {
    return apiClient.safeGet(API.MenstrualCycle.COMPARISON);
  },

  // ===== LEGACY ENDPOINTS (BACKWARD COMPATIBILITY) =====

  async processCycle(data: ProcessCycleRequest): Promise<ApiResponse<CycleData[]>> {
    return apiClient.safePost(API.MenstrualCycle.PROCESS_MENSTRUAL_CYCLE, data);
  },

  async updateCycle(data: ProcessCycleRequest): Promise<ApiResponse<CycleData[]>> {
    return apiClient.safePost(API.MenstrualCycle.PROCESS_MENSTRUAL_CYCLE, data);
  },

  async createMoodData(request: CreateMoodDataRequest): Promise<MoodDataResponse> {
    return apiClient.safePost(API.MenstrualCycle.MOOD_DATA, request);
  },

  async updateMoodData(request: UpdateMoodDataRequest): Promise<MoodDataResponse> {
    return apiClient.safePut(API.MenstrualCycle.MOOD_DATA, request);
  },

  async getMoodData(request?: GetMoodDataRequest): Promise<MoodDataListResponse> {
    const params = new URLSearchParams();
    if (request?.date) params.append('date', request.date);
    if (request?.start_date) params.append('start_date', request.start_date);
    if (request?.end_date) params.append('end_date', request.end_date);
    
    const url = params.toString() 
      ? `${API.MenstrualCycle.MOOD_DATA}?${params.toString()}`
      : API.MenstrualCycle.MOOD_DATA;
    
    return apiClient.safeGet(url);
  },

  async getMoodDataByDate(date: string): Promise<MoodDataResponse> {
    return apiClient.safeGet(`${API.MenstrualCycle.MOOD_DATA}?date=${date}`);
  },

  async deleteMoodData(date: string): Promise<MoodDataResponse> {
    return apiClient.safeDelete(API.MenstrualCycle.MOOD_DATA_DELETE(date));
  },

  async getMonthlyMoodSummary(year: number, month: number): Promise<MonthlyMoodSummaryResponse> {
    return   apiClient.safeGet(API.MenstrualCycle.MOOD_DATA_MONTHLY_SUMMARY(year, month));
  },

  async getCycles(): Promise<ApiResponse<CycleData[]>> {
    return apiClient.safeGet(API.MenstrualCycle.GET_CYCLES);
  },

  async getCyclesByMonth(year: number, month: number): Promise<ApiResponse<CycleData[]>> {
    return apiClient.safeGet(API.MenstrualCycle.GET_CYCLES_BY_MONTH(year, month));
  },

  async getTodayStatus(): Promise<ApiResponse<TodayStatus>> {
    return apiClient.safeGet(API.MenstrualCycle.TODAY_STATUS);
  },

  async getCycleStatistics(): Promise<ApiResponse<CycleStatistics>> {
    return apiClient.safeGet(API.MenstrualCycle.GET_CYCLE_STATISTICS);
  },

  async getPeriodStatistics(): Promise<ApiResponse<PeriodStatistics>> {
    return apiClient.safeGet(API.MenstrualCycle.GET_PERIOD_STATISTICS);
  },

  // ===== LEGACY FUNCTIONS (FOR BACKWARD COMPATIBILITY) =====

  async getMenstrualCycleData(userId: string): Promise<MenstrualCycleData[]> {
    const response = await apiClient.safeGet(`/users/${userId}/menstrual-cycle`);
    return response.data as MenstrualCycleData[];
  },

  async addMenstrualCycleData(data: Omit<MenstrualCycleData, 'id'>): Promise<MenstrualCycleData> {
    const response = await apiClient.safePost(API.MenstrualCycle.BASE, data);
    return response.data as MenstrualCycleData;
  },

  async updateMenstrualCycleData(id: string, data: Partial<MenstrualCycleData>): Promise<MenstrualCycleData> {
    const response = await apiClient.safePut(`${API.MenstrualCycle.BASE}/${id}`, data);
    return response.data as MenstrualCycleData;
  },

  async deleteMenstrualCycleData(id: string): Promise<void> {
    await apiClient.safeDelete(`${API.MenstrualCycle.BASE}/${id}`);
  }
};

