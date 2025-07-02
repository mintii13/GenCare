import api from './api';

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
      // Sử dụng API_URL từ config
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      // Build URL with query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const url = `${API_URL}/consultants/public?${params}`;
      
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
      // Sử dụng API_URL từ config
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = `${API_URL}/consultants/public/${id}`;
      
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
    const response = await api.get('/consultants/my-profile');
    return response.data;
  },

  // Get consultant stats
  async getMyStats() {
    const response = await api.get('/consultants/my-stats');
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