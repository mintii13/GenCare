import { API } from '../config/apiEndpoints';
import apiClient from './apiClient';

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
  old_data?: any;
  new_data?: any;
  details?: string;
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