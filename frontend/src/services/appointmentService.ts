import api from './api';

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

export const appointmentService = {
  // Customer APIs
  async bookAppointment(data: BookAppointmentRequest) {
    const response = await api.post('/appointments/book', data);
    return response.data;
  },

  async getMyAppointments(status?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/appointments/my-appointments?${params}`);
    return response.data;
  },

  async cancelAppointment(appointmentId: string) {
    const response = await api.put(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },

  async rescheduleAppointment(appointmentId: string, data: { appointment_date: string; start_time: string; end_time: string }) {
    const response = await api.put(`/appointments/${appointmentId}/reschedule`, data);
    return response.data;
  },

  // Consultant APIs
  async getConsultantAppointments(status?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/appointments/consultant-appointments?${params}`);
    return response.data;
  },

  async confirmAppointment(appointmentId: string) {
    const response = await api.put(`/appointments/${appointmentId}/confirm`);
    return response.data;
  },

  async completeAppointment(appointmentId: string, consultantNotes: string) {
    const response = await api.put(`/appointments/${appointmentId}/complete`, {
      consultant_notes: consultantNotes
    });
    return response.data;
  },

  async getAppointmentById(appointmentId: string) {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  }
}; 