import { apiClient } from './apiClient';
import { API } from '../config/apiEndpoints';
import {
  CreateFeedbackRequest,
  FeedbackResponse,
  FeedbackStatsResponse,
  ConsultantWithRating
} from '../types/feedback';

export class FeedbackService {
  /**
   * Submit feedback for a completed appointment
   */
  static async submitFeedback(
    appointmentId: string,
    feedbackData: CreateFeedbackRequest
  ): Promise<FeedbackResponse> {
    const response = await apiClient.post(
      `${API.Appointment.BASE}/${appointmentId}/feedback`,
      feedbackData
    );
    return response.data as FeedbackResponse;
  }

  /**
   * Get feedback for a specific appointment
   */
  static async getAppointmentFeedback(appointmentId: string): Promise<FeedbackResponse> {
    const response = await apiClient.get(`${API.Appointment.BASE}/${appointmentId}/feedback`);
    return response.data as FeedbackResponse;
  }

  /**
   * Update feedback for an appointment (within 24 hours)
   */
  static async updateFeedback(
    appointmentId: string,
    feedbackData: CreateFeedbackRequest
  ): Promise<FeedbackResponse> {
    const response = await apiClient.put(
      `${API.Appointment.BASE}/${appointmentId}/feedback`,
      feedbackData
    );
    return response.data as FeedbackResponse;
  }

  /**
   * Delete feedback for an appointment (within 24 hours)
   */
  static async deleteFeedback(appointmentId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${API.Appointment.BASE}/${appointmentId}/feedback`);
    return response.data as { success: boolean; message: string };
  }

  /**
   * Get feedback statistics for a consultant
   */
  static async getConsultantFeedbackStats(consultantId: string): Promise<FeedbackStatsResponse> {
    const response = await apiClient.get(`${API.Appointment.BASE}/consultant/${consultantId}/feedback-stats`);
    return response.data as FeedbackStatsResponse;
  }

  /**
   * Get all consultants with their ratings for booking page
   */
  static async getConsultantsWithRatings(): Promise<{
    success: boolean;
    data: ConsultantWithRating[];
  }> {
    const response = await apiClient.get(API.Consultant.WITH_RATINGS);
    return response.data as { success: boolean; data: ConsultantWithRating[] };
  }

  /**
   * Get customer's feedback history
   */
  static async getCustomerFeedbackHistory(): Promise<{
    success: boolean;
    data: Array<{
      appointment_id: string;
      consultant_name: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      feedback: {
        rating: number;
        comment?: string;
        feedback_date: string;
      };
    }>;
  }> {
    const response = await apiClient.get(API.Appointment.MY_FEEDBACK);
    return response.data as any;
  }

  /**
   * Check if appointment can receive feedback
   */
  static async canSubmitFeedback(appointmentId: string): Promise<{
    success: boolean;
    can_submit: boolean;
    reason?: string;
  }> {
    const response = await apiClient.get(`/appointments/${appointmentId}/can-feedback`);
    return response.data as { success: boolean; can_submit: boolean; reason?: string };
  }
}

export default FeedbackService; 