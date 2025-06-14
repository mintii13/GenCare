import api from './api';

export interface Consultant {
  consultant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
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
  // Get all consultants (for customer)
  async getAllConsultants(page: number = 1, limit: number = 10, specialization?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (specialization && specialization !== 'all') {
      params.append('specialization', specialization);
    }

    const response = await api.get(`/consultants?${params}`);
    return response.data;
  },

  // Get consultant by ID
  async getConsultantById(consultantId: string) {
    const response = await api.get(`/consultants/${consultantId}`);
    return response.data;
  },

  // Get consultant profile (for logged in consultant)
  async getMyProfile() {
    const response = await api.get('/consultants/my-profile');
    return response.data;
  },

  // Update consultant profile
  async updateProfile(data: {
    specialization?: string;
    bio?: string;
    consultation_fee?: number;
    availability_status?: 'available' | 'busy' | 'offline';
  }) {
    const response = await api.put('/consultants/profile', data);
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