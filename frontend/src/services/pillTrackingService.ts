import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';

// Define request/response types based on backend DTOs
// These are placeholders and should be updated to match the actual backend types.

export interface PillSchedule {
  // Define the structure of a single pill schedule entry
  _id: string;
  user_id: string;
  menstrual_cycle_id: string;
  pill_start_date: string;
  is_taken: boolean;
  pill_number: number;
  pill_type: '21-day' | '24+4' | '21+7';
  pill_status: 'hormone' | 'placebo';
  reminder_enabled: boolean;
  reminder_time: string; // "HH:mm"
  taken_time?: Date;
  createdAt?: Date;
}

export interface SetupPillTrackingRequest {
  userId: string;
  pill_type: '21-day' | '24+4' | '21+7';
  pill_start_date: string; // ISO 8601 format
  reminder_time: string; // "HH:mm"
  reminder_enabled?: boolean;
  max_reminder_times?: number;
  reminder_interval?: number;
}

export interface UpdatePillTrackingRequest {
  // Define fields that can be updated
  pill_type?: '21-day' | '24+4' | '21+7';
  is_taken?: boolean;
  reminder_enabled?: boolean;
  reminder_time?: string;
  // ... any other updatable fields
}

export const pillTrackingService = {
  /**
   * Sets up the initial pill tracking schedule for a user.
   */
  setup: async (data: SetupPillTrackingRequest): Promise<ApiResponse<any>> => {
    return apiClient.safePost(API.PillTracking.SETUP, data);
  },

  /**
   * Retrieves the pill schedule for the current user.
   */
  getSchedule: async (): Promise<ApiResponse<PillSchedule[]>> => {
    return apiClient.safeGet('/pill-tracking');
  },

  /**
   * Updates a user's pill tracking schedule or settings.
   */
  updateSchedule: async (data: UpdatePillTrackingRequest): Promise<ApiResponse<any>> => {
    return apiClient.safePatch(API.PillTracking.UPDATE_SCHEDULE, data);
  },

  /**
   * Updates a specific pill schedule by scheduleId.
   */
  updateSpecificSchedule: async (cycleId: string, data: UpdatePillTrackingRequest): Promise<ApiResponse<any>> => {
    console.log('[pillTrackingService] updateSpecificSchedule called');
    console.log('[pillTrackingService] Cycle ID:', cycleId);
    console.log('[pillTrackingService] Update data:', data);
    console.log('[pillTrackingService] Making PATCH request to:', `/pill-tracking/update-schedule/${cycleId}`);
    
    const response = await apiClient.safePatch(`/pill-tracking/update-schedule/${cycleId}`, data);
    
    console.log('[pillTrackingService] API response:', response);
    return response;
  },

  /**
   * Marks a specific pill as taken.
   */
  takePill: async (scheduleId: string): Promise<ApiResponse<any>> => {
    return apiClient.safePost(`/pill-tracking/mark-taken/${scheduleId}`);
  },

  /**
   * Clears all pill tracking schedules for the current user.
   */
  clearSchedules: async (): Promise<ApiResponse<any>> => {
    return apiClient.safeDelete(API.PillTracking.CLEAR_SCHEDULES);
  },

  debug: async (): Promise<ApiResponse<any>> => {
    return apiClient.safeGet(API.PillTracking.DEBUG);
  },

  /**
   * Tests sending a reminder email.
   */
  testReminder: async (): Promise<ApiResponse<any>> => {
    return apiClient.safePost(API.PillTracking.TEST_REMINDER);
  },

  /**
   * Disables pill reminder for the current user.
   */
  disableReminder: async (): Promise<ApiResponse<any>> => {
    return apiClient.safePost('/pill-tracking/disable-reminder');
  },

  /**
   * Enables pill reminder for the current user.
   */
  enableReminder: async (): Promise<ApiResponse<any>> => {
    return apiClient.safePost('/pill-tracking/enable-reminder');
  },
};

export const getPillTrackingByUserId = async (userId: string) => {
  // Kiểm tra userId trước khi gọi API
  if (!userId || userId === 'undefined') {
    console.warn('Invalid userId provided to getPillTrackingByUserId:', userId);
    return null;
  }
  
  try {
    const response = await apiClient.get(`/pill-tracking/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pill tracking:', error);
    throw error;
  }
}; 