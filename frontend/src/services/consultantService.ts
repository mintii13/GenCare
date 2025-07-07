import api from './api';
import { API, BASE_API } from '../config/apiEndpoints';

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
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `${BASE_API}${API.Consultant.PUBLIC_LIST}?${params}`;
      
      const publicResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Không thêm Authorization header
        }
      });

      if (!publicResponse.ok) {
        const errorText = await publicResponse.text();
        throw new Error(`HTTP error! status: ${publicResponse.status}`);
      }

      const jsonData = await publicResponse.json();
      return jsonData;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết consultant theo ID
   */
  async getConsultantById(id: string): Promise<Consultant> {
    try {
      const url = `${BASE_API}${API.Consultant.PUBLIC_DETAIL(id)}`;
      
      const publicResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!publicResponse.ok) {
        throw new Error(`HTTP error! status: ${publicResponse.status}`);
      }

      return await publicResponse.json();
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Cập nhật profile consultant (authenticated)
   */
  async updateProfile(profileData: Partial<Consultant>): Promise<{ data: Consultant }> {
    try {
      const response = await api.put('/consultant/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy thống kê consultant (authenticated)
   */
  async getStats(): Promise<any> {
    try {
      const response = await api.get('/consultant/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get consultant profile (for logged in consultant)
  async getMyProfile() {
    const response = await api.get(API.Consultant.MY_PROFILE);
    return response.data;
  },

  // Get consultant stats
  async getMyStats() {
    const response = await api.get(API.Consultant.MY_STATS);
    return response.data;
  },

  // Get consultant reviews
  async getMyReviews(page: number = 1, limit: number = 10) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/consultants/my-reviews?${params}`);
    return response.data;
  },

  // Search consultants
  async searchConsultants(query: string, filters?: {
    specialization?: string;
    min_rating?: number;
    max_fee?: number;
    availability?: string;
  }) {
    const params = new URLSearchParams();
    params.append('search', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/consultants/search?${params}`);
    return response.data;
  }
};