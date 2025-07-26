import { API } from '../config/apiEndpoints';
import apiClient from './apiClient';
import { Appointment, PaginationInfo } from '../types/appointment';

// Based on backend models/AppointmentHistory.ts
export interface IAppointmentHistory {
  _id: string;
  appointment_id: string;
  action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
  timestamp: string;
  performed_by_user_id: {
    _id: string;
    full_name: string;
    role: string;
  };
  performed_by_role: 'customer' | 'consultant' | 'staff' | 'admin';
  old_data?: unknown;
  new_data?: unknown;
  details?: string;
}

export interface GetAppointmentHistoryListResponse {
  success: boolean;
  message: string;
  data: {
    items: Appointment[];
    pagination: PaginationInfo;
  };
}

export interface GetAppointmentHistoryResponse {
  success: boolean;
  message: string;
  data?: {
    appointment_id: string;
    history: IAppointmentHistory[];
  };
  timestamp?: string;
}

const appointmentHistoryService = {
  /**
   * Fetches the paginated list of appointment history records.
   * @param params The query parameters for pagination and filtering.
   * @returns The API response with the list of appointment history.
   */
  getAppointmentHistoryList: async (params: URLSearchParams): Promise<GetAppointmentHistoryListResponse> => {
    const url = `${API.AppointmentHistory.LIST}?${params.toString()}`;
    console.log(`Fetching paginated appointment history from: ${url}`);
    const response = await apiClient.get<GetAppointmentHistoryListResponse>(url); // Use 'any' to handle actual backend structure
    
    // Extract the appointment histories array from the nested structure
    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        items: response.data.data.items, // Extract the array
        pagination: response.data.data.pagination
      }
    };
  },

  /**
   * Fetches the history for a specific appointment.
   * @param appointmentId The ID of the appointment.
   * @returns The API response with the appointment history.
   */
  getHistoryForAppointment: async (appointmentId: string): Promise<GetAppointmentHistoryResponse> => {
    const url = API.AppointmentHistory.GET_BY_APPOINTMENT_ID(appointmentId);
    console.log(`Fetching appointment history from: ${url}`);
    const response = await apiClient.get<GetAppointmentHistoryResponse>(url);
    return response.data;
  },
};

export default appointmentHistoryService; 