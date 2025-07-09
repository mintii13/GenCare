import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

export interface Consultant {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  bio: string;
  consultationRate: number;
  availableSlots: any[];
  rating: number;
  totalConsultations: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultantResponse {
  success: boolean;
  message: string;
  data: {
    consultants: Consultant[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ConsultantStats {
  total_appointments: number;
  completed_appointments: number;
  average_rating: number;
  total_revenue: number;
  this_month_appointments: number;
  this_month_revenue: number;
}

export const consultantService = {
  /**
   * Lấy danh sách tất cả consultants (public endpoint)
   */
  async getAllConsultants(page: number = 1, limit: number = 10): Promise<{ data: { consultants: Consultant[] } }> {
    const response = await apiClient.get<any>(API.Consultant.PUBLIC_LIST, {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết consultant theo ID
   */
  async getConsultantById(id: string): Promise<Consultant> {
    const response = await apiClient.get<any>(API.Consultant.PUBLIC_DETAIL(id));
    return response.data;
  },

  /**
   * Cập nhật profile consultant (authenticated)
   */
  async updateProfile(profileData: Partial<Consultant>): Promise<{ data: Consultant }> {
    const response = await apiClient.put<any>(API.Consultant.MY_PROFILE, profileData);
    return response.data;
  },

  /**
   * Lấy thống kê consultant (authenticated)
   */
  async getStats(): Promise<any> {
    const response = await apiClient.get(API.Consultant.MY_STATS);
    return response.data;
  },

  // Get consultant profile (for logged in consultant)
  async getMyProfile() {
    const response = await apiClient.get(API.Consultant.MY_PROFILE);
    return response.data;
  },

  // Get consultant stats
  async getMyStats() {
    const response = await apiClient.get(API.Consultant.MY_STATS);
    return response.data;
  },

  // Get consultant reviews
  async getMyReviews(page: number = 1, limit: number = 10) {
    const response = await apiClient.get(API.Consultant.MY_REVIEWS, {
      params: { page, limit }
    });
    return response.data;
  },

  // Search consultants
  async searchConsultants(query: string, filters?: {
    specialization?: string;
    min_rating?: number;
    max_fee?: number;
    availability?: string;
  }) {
    const params = {
      search: query,
      ...filters
    };
    const response = await apiClient.get(API.Consultant.SEARCH, { params });
    return response.data;
  }
};