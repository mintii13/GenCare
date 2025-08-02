import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';
import {
  Appointment,
  AppointmentHistory,
  AppointmentQuery,
  AppointmentHistoryQuery,
  AppointmentsPaginatedResponse,
  AppointmentHistoryPaginatedResponse,
  AppointmentResponse,
  AppointmentSlot,
  BookAppointmentRequest,
  AppointmentStats,
} from '../types/appointment';
import { GetAppointmentHistoryListResponse } from './appointmentHistoryService';

// Helper function to remove undefined/null properties from an object
const cleanQuery = (obj: unknown) => {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== ''));
};

export const appointmentService = {
  // NEW PAGINATED APIs
  
  // Lấy appointments với pagination cho customer
  getMyAppointmentsPaginated: async (query?: AppointmentQuery): Promise<AppointmentsPaginatedResponse> => {
    try {
      const response = await apiClient.get<AppointmentsPaginatedResponse>(API.Appointment.MY_APPOINTMENTS, {
        params: cleanQuery(query)
      }, { attempts: 1 }); // Disable retry temporarily
      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Lấy appointments với pagination cho consultant
  getConsultantAppointmentsPaginated: async (query?: AppointmentQuery): Promise<AppointmentsPaginatedResponse> => {
    try {
      const response = await apiClient.get<AppointmentsPaginatedResponse>(API.Appointment.CONSULTANT_APPOINTMENTS, {
        params: cleanQuery(query)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả appointments với pagination cho staff/admin
  getAllAppointmentsPaginated: async (query?: AppointmentQuery): Promise<ApiResponse<AppointmentsPaginatedResponse>> => {
    try {
      const response = await apiClient.safeGet<AppointmentsPaginatedResponse>(API.Appointment.ALL, {
        params: cleanQuery(query)
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Lấy appointment history với pagination
  getAppointmentHistory: async (query?: AppointmentHistoryQuery): Promise<AppointmentHistoryPaginatedResponse> => {
    try {
      const response = await apiClient.get<AppointmentHistoryPaginatedResponse>(API.AppointmentHistory.LIST, { // Corrected endpoint
        params: cleanQuery(query)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // EXISTING APIs (giữ lại để backward compatibility)
  
  // Customer APIs
  async bookAppointment(data: BookAppointmentRequest): Promise<ApiResponse<GetAppointmentHistoryListResponse>> {
    try {
      const response = await apiClient.post(API.Appointment.BOOK, data);
      return {
        success: true,
        data: response.data as GetAppointmentHistoryListResponse,
        message: 'Đặt lịch thành công'
      };
    } catch (error: any) {
      // Xử lý response error từ backend
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Đặt lịch thất bại',
          errorType: error.response.data.errorType,
          details: error.response.data.details
        };
      }
      throw error;
    }
  },

  async getMyAppointments(query: AppointmentQuery): Promise<ApiResponse<AppointmentsPaginatedResponse>> {
    const cleanQuery = (obj: any) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
    };

    return apiClient.safeGet<AppointmentsPaginatedResponse>(API.Appointment.MY_APPOINTMENTS, {
      params: cleanQuery(query)
    }, { attempts: 1 }); // Disable retry temporarily
  },

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<GetAppointmentHistoryListResponse>> {
    return apiClient.safePut(`${API.Appointment.BASE}/${appointmentId}/cancel`);
  },

  async rescheduleAppointment(appointmentId: string, newSlot: any): Promise<ApiResponse<any>> {
    try {
      // Sử dụng endpoint PUT /api/appointments/:id với explicitAction: 'rescheduled'
      const updateData = {
        ...newSlot,
        explicitAction: 'rescheduled'
      };
      
      const response = await apiClient.safePut(`${API.Appointment.BASE}/${appointmentId}`, updateData);
      
      return {
        success: true,
        data: response.data,
        message: 'Đổi lịch hẹn thành công'
      };
    } catch (error: any) {
      console.error('[ERROR] rescheduleAppointment failed:', error);
      console.error('[ERROR] Error response:', (error as { response?: { data?: unknown } }).response?.data);
      throw error;
    }
  },

  // Consultant APIs
  async getConsultantAppointments(status?: string): Promise<ApiResponse<{ appointments: Appointment[] }>> {
    const params: { status?: string } = {};
    if (status) {
      params.status = status;
    }
    const response = await apiClient.get<{ appointments: Appointment[] }>(API.Appointment.CONSULTANT_APPOINTMENTS, { params });
    return { success: true, message: 'Success', data: response.data };
  },

  // Staff/Admin APIs
  async getAllAppointments(status?: string, startDate?: string, endDate?: string, consultantId?: string, customerId?: string) {
    const params = {
      status: status !== 'all' ? status : undefined,
      start_date: startDate,
      end_date: endDate,
      consultant_id: consultantId,
      customer_id: customerId
    };

    const response = await apiClient.get(API.Appointment.ALL, { params: cleanQuery(params) });
    return response.data;
  },

  async confirmAppointment(appointmentId: string, googleAccessToken?: string): Promise<ApiResponse<{ appointment: Appointment }>> {
    const requestBody = googleAccessToken ? { googleAccessToken } : {};
    return apiClient.safePut(`${API.Appointment.BASE}/${appointmentId}/confirm`, requestBody);
  },

  async completeAppointment(appointmentId: string, consultantNotes: string) {
    return apiClient.safePut(`${API.Appointment.BASE}/${appointmentId}/complete`, {
      consultant_notes: consultantNotes
    });
  },

  async getAppointmentById(appointmentId: string): Promise<ApiResponse<{ appointment: Appointment }>> {
    return apiClient.safeGet(`${API.Appointment.BASE}/${appointmentId}`);
  },

  async startMeeting(appointmentId: string, googleAccessToken?: string) {
    const requestBody = googleAccessToken ? { googleAccessToken } : {};
    return apiClient.safePut(`${API.Appointment.BASE}/${appointmentId}/start-meeting`, requestBody);
  },

  async getAvailableSlots(consultantId: string, date: string): Promise<ApiResponse<{ slots: AppointmentSlot[] }>> {
    return apiClient.safeGet(`${API.Appointment.BASE}/slots/${consultantId}`, { params: { date } });
  },

  async startAppointment(appointmentId: string): Promise<ApiResponse<{ meeting_link: string }>> {
    return apiClient.safePost(`${API.Appointment.BASE}/${appointmentId}/start`);
  }
};

// Backward compatibility exports
export type { Appointment, BookAppointmentRequest, AppointmentResponse } from '../types/appointment';