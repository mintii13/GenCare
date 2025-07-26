import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';

// ========================= TYPES =========================

export interface DashboardStat {
  id: string;
  title: string;
  value: number | string;
  loading: boolean;
  error?: string;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
  by_role: {
    customer: number;
    staff: number;
    consultant: number;
    admin: number;
  };
  recent_registrations: {
    total: number;
    period: string;
  };
}

export interface AppointmentStatistics {
  total_appointments: number;
  today_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  by_status: {
    [key: string]: number;
  };
}

export interface ConsultantPerformance {
  consultant_info: {
    consultant_id: string;
    name: string;
    specialization: string;
    experience_years: number;
  };
  appointment_stats: {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    completion_rate: number;
  };
  feedback_stats: {
    total_feedbacks: number;
    average_rating: number;
    rating_distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  recent_feedback: Array<{
    appointment_id: string;
    rating: number;
    comment: string;
    feedback_date: string;
    customer_name: string;
  }>;
}

export interface STIOrderStatistics {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  critical_results: number;
  by_status: {
    [key: string]: number;
  };
}

// ========================= SERVICE CLASS =========================

export class DashboardStatsService {
  
  /**
   * Get user statistics (Admin/Staff only)
   */
  static async getUserStatistics(): Promise<ApiResponse<UserStatistics>> {
    try {
      const response = await apiClient.safeGet<UserStatistics>(
        API.Users.STATISTICS
      );
      return response;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê người dùng'
      };
    }
  }

  /**
   * Get appointment statistics (Staff/Admin)  
   */
  static async getAppointmentStatistics(filters?: {
    consultant_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<AppointmentStatistics>> {
    try {
      const params = new URLSearchParams();
      if (filters?.consultant_id) params.append('consultant_id', filters.consultant_id);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      const url = params.toString() ? 
        `${API.Appointment.STATS}?${params.toString()}` : 
        API.Appointment.STATS;

      const response = await apiClient.safeGet<AppointmentStatistics>(url);
      return response;
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê lịch hẹn'
      };
    }
  }

  /**
   * Get consultant performance (Consultant only)
   */
  static async getConsultantPerformance(): Promise<ApiResponse<ConsultantPerformance>> {
    try {
      const response = await apiClient.safeGet<ConsultantPerformance>(
        API.Consultant.MY_PERFORMANCE
      );
      return response;
    } catch (error) {
      console.error('Error fetching consultant performance:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê hiệu suất'
      };
    }
  }

  /**
   * Get STI order statistics (Staff/Admin)
   */
  static async getSTIOrderStatistics(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<STIOrderStatistics>> {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1'); // We only need pagination info, not actual data
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      const response = await apiClient.safeGet(
        `${API.STI.GET_ALL_ORDERS_PAGINATED}?${params.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data as any;
        return {
          success: true,
          data: {
            total_orders: data.pagination?.total_items || 0,
            pending_orders: 0, // Would need separate API call with status filter
            completed_orders: 0, // Would need separate API call with status filter
            cancelled_orders: 0, // Would need separate API call with status filter
            total_revenue: 0, // Would need revenue API call
            critical_results: 0, // Would need results API call
            by_status: {}
          }
        };
      }

      return response as ApiResponse<STIOrderStatistics>;
    } catch (error) {
      console.error('Error fetching STI order statistics:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê đơn hàng STI'
      };
    }
  }

  /**
   * Get total revenue (Staff/Admin)
   */
  static async getTotalRevenue(): Promise<ApiResponse<{ total_revenue: number }>> {
    try {
      const response = await apiClient.safeGet(API.STI.GET_TOTAL_REVENUE);
      return response;
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê doanh thu'
      };
    }
  }

  /**
   * Get appointment counts for consultant
   */
  static async getConsultantAppointmentCounts(filters?: {
    status?: string;
    date?: string;
  }): Promise<ApiResponse<{ total_items: number }>> {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1'); // We only need pagination info
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) {
        params.append('appointment_date_from', filters.date);
        params.append('appointment_date_to', filters.date);
      }

      const response = await apiClient.safeGet(
        `${API.Appointment.MY_APPOINTMENTS}?${params.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data as any;
        return {
          success: true,
          data: {
            total_items: data.pagination?.total_items || 0
          }
        };
      }

      return response as ApiResponse<{ total_items: number }>;
    } catch (error) {
      console.error('Error fetching consultant appointment counts:', error);
      return {
        success: false,
        message: 'Không thể tải số lượng lịch hẹn'
      };
    }
  }

  /**
   * Get blog statistics for consultant
   */
  static async getBlogStatistics(authorId?: string): Promise<ApiResponse<{
    total: number;
    published: number;
    draft: number;
  }>> {
    try {
      if (!authorId) {
        return {
          success: false,
          message: 'Author ID is required'
        };
      }

      const response = await apiClient.safeGet(
        `/api/blogs/author/${authorId}/stats`
      );
      return response;
    } catch (error) {
      console.error('Error fetching blog statistics:', error);
      return {
        success: false,
        message: 'Không thể tải thống kê bài viết'
      };
    }
  }

  /**
   * Generic method to get statistics based on user role
   */
  static async getDashboardStatistics(userRole: string, userId?: string): Promise<{
    [key: string]: any;
  }> {
    const stats: { [key: string]: any } = {};

    try {
      switch (userRole) {
        case 'admin':
          const [userStats, appointmentStats, revenueStats] = await Promise.allSettled([
            this.getUserStatistics(),
            this.getAppointmentStatistics(),
            this.getTotalRevenue()
          ]);

          if (userStats.status === 'fulfilled' && userStats.value.success) {
            stats.users = userStats.value.data;
          }
          if (appointmentStats.status === 'fulfilled' && appointmentStats.value.success) {
            stats.appointments = appointmentStats.value.data;
          }
          if (revenueStats.status === 'fulfilled' && revenueStats.value.success) {
            stats.revenue = revenueStats.value.data;
          }
          break;

        case 'staff':
          const [userStatsStaff, appointmentStatsStaff, stiStats] = await Promise.allSettled([
            this.getUserStatistics(),
            this.getAppointmentStatistics(),
            this.getSTIOrderStatistics()
          ]);

          if (userStatsStaff.status === 'fulfilled' && userStatsStaff.value.success) {
            stats.users = userStatsStaff.value.data;
          }
          if (appointmentStatsStaff.status === 'fulfilled' && appointmentStatsStaff.value.success) {
            stats.appointments = appointmentStatsStaff.value.data;
          }
          if (stiStats.status === 'fulfilled' && stiStats.value.success) {
            stats.sti = stiStats.value.data;
          }
          break;

        case 'consultant':
          const [consultantPerformance, todayAppointments] = await Promise.allSettled([
            this.getConsultantPerformance(),
            this.getConsultantAppointmentCounts({
              date: new Date().toISOString().split('T')[0]
            })
          ]);

          if (consultantPerformance.status === 'fulfilled' && consultantPerformance.value.success) {
            stats.performance = consultantPerformance.value.data;
          }
          if (todayAppointments.status === 'fulfilled' && todayAppointments.value.success) {
            stats.todayAppointments = todayAppointments.value.data;
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    }

    return stats;
  }
}

export default DashboardStatsService; 