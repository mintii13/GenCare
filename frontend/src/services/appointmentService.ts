import api from './api';
import { API } from '../config/apiEndpoints';

export interface BookAppointmentRequest {
  consultant_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  customer_notes?: string;
}

export interface Appointment {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  consultant_id: {
    _id: string;
    specialization: string;
    user_id: {
      full_name: string;
    };
  };
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data: {
    appointments: Appointment[];
    total: number;
  };
}

export interface AppointmentSlot {
  date: string;
  time: string;
  isAvailable: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const appointmentService = {
  // Customer APIs
  async bookAppointment(data: BookAppointmentRequest) {
    const response = await api.post(API.Appointment.BOOK, data);
    return response.data;
  },

  async getMyAppointments(status?: string): Promise<ApiResponse<{ appointments: Appointment[] }>> {
    const url = status ? `${API.Appointment.MY_APPOINTMENTS}?status=${status}` : API.Appointment.MY_APPOINTMENTS;
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 403) {
        const altUrl = status ? `${API.Appointment.CONSULTANT_APPOINTMENTS}?status=${status}` : API.Appointment.CONSULTANT_APPOINTMENTS;
        const altRes = await api.get(altUrl);
        return altRes.data;
      }
      throw error;
    }
  },

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${API.Appointment.BASE}/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async rescheduleAppointment(appointmentId: string, data: { appointment_date: string; start_time: string; end_time: string }) {
    const response = await api.put(`${API.Appointment.BASE}/${appointmentId}`, data);
    return response.data;
  },

  // Consultant APIs
  async getConsultantAppointments(status?: string): Promise<ApiResponse<{ appointments: Appointment[] }>> {
    try {
      const url = status ? `${API.Appointment.CONSULTANT_APPOINTMENTS}?status=${status}` : API.Appointment.CONSULTANT_APPOINTMENTS;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Staff/Admin APIs
  async getAllAppointments(status?: string, startDate?: string, endDate?: string, consultantId?: string, customerId?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (consultantId) params.append('consultant_id', consultantId);
    if (customerId) params.append('customer_id', customerId);

    const response = await api.get(`${API.Appointment.ALL}?${params}`);
    return response.data;
  },

  async confirmAppointment(appointmentId: string, googleAccessToken?: string): Promise<ApiResponse<{ appointment: Appointment }>> {
    try {
      const requestBody = googleAccessToken ? { googleAccessToken } : {};
      const response = await api.put(`${API.Appointment.BASE}/${appointmentId}/confirm`, requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async completeAppointment(appointmentId: string, consultantNotes: string) {
    const response = await api.put(`${API.Appointment.BASE}/${appointmentId}/complete`, {
      consultant_notes: consultantNotes
    });
    return response.data;
  },

  async getAppointmentById(appointmentId: string): Promise<ApiResponse<{ appointment: Appointment }>> {
    try {
      const response = await api.get(`${API.Appointment.BASE}/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async startMeeting(appointmentId: string, googleAccessToken?: string) {
    const requestBody = googleAccessToken ? { googleAccessToken } : {};
    const response = await api.put(`${API.Appointment.BASE}/${appointmentId}/start-meeting`, requestBody);
    return response.data;
  },

  async getAvailableSlots(consultantId: string, date: string): Promise<ApiResponse<{ slots: AppointmentSlot[] }>> {
    try {
      const response = await api.get(`${API.Appointment.BASE}/slots/${consultantId}?date=${date}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async startAppointment(appointmentId: string): Promise<ApiResponse<{ meeting_link: string }>> {
    try {
      const response = await api.post(`${API.Appointment.BASE}/${appointmentId}/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


};