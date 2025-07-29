import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

// ================ INTERFACES ================

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role: 'customer' | 'consultant' | 'admin' | 'staff';
  status: boolean;
  email_verified: boolean;
  registration_date: string;
  updated_date?: string;
  last_login?: string;
  avatar?: string;
  googleId?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role: 'customer' | 'consultant' | 'admin' | 'staff';
  // Staff-specific fields
  department?: string; // Required for staff
  hire_date?: string; // Required for staff
  // Consultant-specific fields
  specialization?: string; // Required for consultant
  qualifications?: string; // Required for consultant
  experience_years?: number; // Required for consultant
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role?: 'customer' | 'consultant' | 'admin' | 'staff';
  password?: string; // Only if changing password
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'customer' | 'consultant' | 'staff' | 'admin';
  status?: boolean;
  email_verified?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
  by_role: {
    customer: number;
    consultant: number;
    staff: number;
    admin: number;
  };
  recent_registrations: {
    total: number;
    period: string;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ================ RESPONSE INTERFACES ================

export interface UserResponse {
  success: boolean;
  message: string;
  data?: UserData;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data?: {
    users: UserData[];
    pagination: PaginationInfo;
  };
}

export interface UserStatisticsResponse {
  success: boolean;
  message: string;
  data?: UserStatistics;
}

export interface UserActionResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserData;
  };
}

// ================ SERVICE CLASS ================

export class UserManagementService {
  
  /**
   * Lấy danh sách user với pagination và filters (Admin/Staff only)
   */
  static async getUsers(query: UserQuery = {}): Promise<UsersResponse> {
    try {
      const params = {
        page: query.page || 1,
        limit: query.limit || 10,
        ...(query.search && { search: query.search }),
        ...(query.role && { role: query.role }),
        ...(query.status !== undefined && { status: query.status.toString() }),
        ...(query.email_verified !== undefined && { email_verified: query.email_verified.toString() }),
        ...(query.date_from && { date_from: query.date_from }),
        ...(query.date_to && { date_to: query.date_to }),
        ...(query.sort_by && { sort_by: query.sort_by }),
        ...(query.sort_order && { sort_order: query.sort_order })
      };

      const response = await apiClient.get(API.Users.GET_ALL, { params });
      return response.data as UsersResponse;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy danh sách người dùng'
      };
    }
  }

  /**
   * Lấy thông tin user theo ID (Admin/Staff only)
   */
  static async getUserById(userId: string): Promise<UserResponse> {
    try {
      const response = await apiClient.get(API.Users.GET_BY_ID(userId));
      return response.data as UserResponse;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thông tin người dùng'
      };
    }
  }

  /**
   * Tạo user mới (Admin only)
   */
  static async createUser(userData: CreateUserData): Promise<UserActionResponse> {
    try {
      const response = await apiClient.post(API.Users.CREATE, userData);
      return response.data as UserActionResponse;
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo người dùng'
      };
    }
  }

  /**
   * Cập nhật thông tin user (Admin only)
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<UserActionResponse> {
    try {
      const response = await apiClient.put(API.Users.UPDATE(userId), updateData);
      return response.data as UserActionResponse;
    } catch (error: any) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật người dùng'
      };
    }
  }

  /**
   * Cập nhật trạng thái user (Admin/Staff only)
   */
  static async updateUserStatus(userId: string, status: boolean): Promise<UserActionResponse> {
    try {
      const response = await apiClient.put(API.Users.UPDATE_STATUS(userId), { status });
      return response.data as UserActionResponse;
    } catch (error: any) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật trạng thái người dùng'
      };
    }
  }

  /**
   * Xóa user (Admin only - soft delete)
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(API.Users.DELETE(userId));
      return response.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa người dùng'
      };
    }
  }

  /**
   * Lấy thống kê người dùng (Admin/Staff only)
   */
  static async getUserStatistics(): Promise<UserStatisticsResponse> {
    try {
      const response = await apiClient.get(API.Users.STATISTICS);
      return response.data as UserStatisticsResponse;
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thống kê người dùng'
      };
    }
  }

  // ================ UTILITY METHODS ================

  /**
   * Format user role cho hiển thị
   */
  static formatUserRole(role: string): { text: string; color: string } {
    const roleConfig = {
      'customer': { text: 'Khách hàng', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'consultant': { text: 'Tư vấn viên', color: 'bg-green-100 text-green-800 border-green-200' },
      'staff': { text: 'Nhân viên', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'admin': { text: 'Quản trị viên', color: 'bg-red-100 text-red-800 border-red-200' }
    };
    return roleConfig[role as keyof typeof roleConfig] || roleConfig['customer'];
  }

  /**
   * Format user status cho hiển thị
   */
  static formatUserStatus(status: boolean): { text: string; color: string } {
    return status 
      ? { text: 'Hoạt động', color: 'bg-green-100 text-green-800 border-green-200' }
      : { text: 'Đã khóa', color: 'bg-red-100 text-red-800 border-red-200' };
  }

  /**
   * Format email verification status
   */
  static formatEmailVerification(verified: boolean): { text: string; color: string } {
    return verified
      ? { text: 'Đã xác thực', color: 'bg-green-100 text-green-800 border-green-200' }
      : { text: 'Chưa xác thực', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }

  /**
   * Kiểm tra quyền tạo user
   */
  static canCreateUser(userRole: string): boolean {
    return userRole === 'admin';
  }

  /**
   * Kiểm tra quyền cập nhật user
   */
  static canUpdateUser(userRole: string): boolean {
    return userRole === 'admin';
  }

  /**
   * Kiểm tra quyền cập nhật trạng thái user
   */
  static canUpdateUserStatus(userRole: string): boolean {
    return userRole === 'admin' || userRole === 'staff';
  }

  /**
   * Kiểm tra quyền xóa user
   */
  static canDeleteUser(userRole: string): boolean {
    return userRole === 'admin';
  }

  /**
   * Kiểm tra quyền xem thống kê user
   */
  static canViewUserStatistics(userRole: string): boolean {
    return userRole === 'admin' || userRole === 'staff';
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Vietnamese)
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate random password
   */
  static generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Ngày không hợp lệ';
    }
  }

  /**
   * Format datetime for display
   */
  static formatDateTime(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Thời gian không hợp lệ';
    }
  }

  /**
   * Calculate age from birth date
   */
  static calculateAge(birthDate: string): number {
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return 0;
    }
  }
}

export default UserManagementService; 