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
  // ... other fields from your IPillTracking model
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
  getSchedule: async (userId: string): Promise<ApiResponse<{ schedules: PillSchedule[] }>> => {
    return apiClient.safeGet(API.PillTracking.GET_SCHEDULE_BY_USER);
  },

  /**
   * Updates a user's pill tracking schedule or settings.
   */
  updateSchedule: async (data: UpdatePillTrackingRequest): Promise<ApiResponse<any>> => {
    return apiClient.safePatch(API.PillTracking.UPDATE_SCHEDULE, data);
  },

  /**
   * Marks a specific pill as taken.
   */
  takePill: async (scheduleId: string): Promise<ApiResponse<any>> => {
    // This typically would be a PATCH or PUT request to update the 'is_taken' status.
    return apiClient.safePut(API.PillTracking.TAKE_PILL(scheduleId), { is_taken: true });
  },
}; 