import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

// ================ INTERFACES ================

export interface STIAssessmentData {
  // Thông tin cá nhân
  age: number;
  gender: 'female' | 'male' | 'transgender' | 'other';
  is_pregnant?: boolean;
  pregnancy_trimester?: 'first' | 'second' | 'third';
  
  // Thông tin tình dục
  sexually_active: 'not_active' | 'active_single' | 'active_multiple';
  sexual_orientation?: 'heterosexual' | 'homosexual' | 'bisexual' | 'other';
  number_of_partners: 'none' | 'one' | 'multiple';
  new_partner_recently?: boolean;
  partner_has_sti?: boolean;
  condom_use: 'always' | 'sometimes' | 'rarely' | 'never';
  
  // Tiền sử y tế
  previous_sti_history?: string[];
  hiv_status?: 'negative' | 'positive' | 'unknown';
  last_sti_test?: 'never' | 'less_than_3_months' | '3_to_6_months' | '6_to_12_months' | 'more_than_year';
  has_symptoms?: boolean;
  symptoms?: string[];
  
  // Yếu tố nguy cơ
  risk_factors?: string[];
  living_area?: 'general' | 'endemic' | 'high_risk';
  
  // Mục đích xét nghiệm
  test_purpose?: string;
  urgency?: 'normal' | 'urgent';
}

export interface STIRecommendation {
  recommended_package: string;
  risk_level: 'Thấp' | 'Trung bình' | 'Cao';
  reasoning: string[];
  package_info?: {
    name: string;
    code: string;
    price: number;
    tests: string[];
    description: string;
  };
}

export interface STIAssessment {
  _id: string;
  customer_id: string;
  assessment_data: STIAssessmentData;
  recommendation: STIRecommendation;
  created_at: string;
  updated_at?: string;
}

export interface STIPackageInfo {
  name: string;
  code: string;
  price: number;
  tests: string[];
  description: string;
}

export interface STIAssessmentStats {
  total_assessments: number;
  by_risk_level: {
    [key: string]: number;
  };
  by_package: {
    [key: string]: number;
  };
  recent_assessments: number;
  date_range?: {
    start: string;
    end: string;
  };
}

// ================ RESPONSE INTERFACES ================

export interface STIAssessmentResponse {
  success: boolean;
  message: string;
  data?: {
    assessment_id: string;
    recommendation: STIRecommendation;
  };
}

export interface STIAssessmentHistoryResponse {
  success: boolean;
  message: string;
  data?: STIAssessment[];
}

export interface STIAssessmentDetailResponse {
  success: boolean;
  message: string;
  data?: STIAssessment;
}

export interface STIPackageInfoResponse {
  success: boolean;
  message: string;
  data?: STIPackageInfo[];
}

export interface STIAssessmentStatsResponse {
  success: boolean;
  message: string;
  data?: STIAssessmentStats;
}

// ================ SERVICE CLASS ================

export class STIAssessmentService {
  
  /**
   * Tạo đánh giá STI mới (Customer only)
   */
  static async createAssessment(assessmentData: STIAssessmentData): Promise<STIAssessmentResponse> {
    try {
      const response = await apiClient.post(API.STIAssessment.CREATE, assessmentData);
      return response.data as STIAssessmentResponse;
    } catch (error: any) {
      console.error('Error creating STI assessment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo đánh giá STI'
      };
    }
  }

  /**
   * Lấy lịch sử đánh giá STI của customer hiện tại
   */
  static async getAssessmentHistory(): Promise<STIAssessmentHistoryResponse> {
    try {
      const response = await apiClient.get(API.STIAssessment.HISTORY);
      return response.data as STIAssessmentHistoryResponse;
    } catch (error: any) {
      console.error('Error fetching STI assessment history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy lịch sử đánh giá STI'
      };
    }
  }

  /**
   * Lấy chi tiết đánh giá STI theo ID (Customer/Staff/Admin)
   */
  static async getAssessmentById(assessmentId: string): Promise<STIAssessmentDetailResponse> {
    try {
      const response = await apiClient.get(API.STIAssessment.GET_BY_ID(assessmentId));
      return response.data as STIAssessmentDetailResponse;
    } catch (error: any) {
      console.error('Error fetching STI assessment details:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy chi tiết đánh giá STI'
      };
    }
  }

  /**
   * Cập nhật đánh giá STI (Staff/Admin only)
   */
  static async updateAssessment(
    assessmentId: string, 
    updateData: Partial<STIAssessmentData>
  ): Promise<STIAssessmentResponse> {
    try {
      const response = await apiClient.put(API.STIAssessment.UPDATE(assessmentId), updateData);
      return response.data as STIAssessmentResponse;
    } catch (error: any) {
      console.error('Error updating STI assessment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật đánh giá STI'
      };
    }
  }

  /**
   * Xóa đánh giá STI (Admin only)
   */
  static async deleteAssessment(assessmentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(API.STIAssessment.DELETE(assessmentId));
      return response.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error deleting STI assessment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa đánh giá STI'
      };
    }
  }

  /**
   * Lấy thống kê tổng quan đánh giá STI (Staff only)
   */
  static async getAssessmentStats(
    startDate?: string, 
    endDate?: string
  ): Promise<STIAssessmentStatsResponse> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get(API.STIAssessment.STATS_OVERVIEW, { params });
      return response.data as STIAssessmentStatsResponse;
    } catch (error: any) {
      console.error('Error fetching STI assessment stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thống kê đánh giá STI'
      };
    }
  }

  /**
   * Lấy thông tin các gói xét nghiệm STI (Public)
   */
  static async getPackageInfo(): Promise<STIPackageInfoResponse> {
    try {
      const response = await apiClient.get(API.STIAssessment.PACKAGES_INFO);
      return response.data as STIPackageInfoResponse;
    } catch (error: any) {
      console.error('Error fetching STI package info:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thông tin gói xét nghiệm'
      };
    }
  }

  // ================ UTILITY METHODS ================

  /**
   * Format risk level cho hiển thị
   */
  static formatRiskLevel(riskLevel: string): { text: string; color: string } {
    const riskConfig = {
      'Thấp': { text: 'Nguy cơ thấp', color: 'bg-green-100 text-green-800 border-green-200' },
      'Trung bình': { text: 'Nguy cơ trung bình', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'Cao': { text: 'Nguy cơ cao', color: 'bg-red-100 text-red-800 border-red-200' }
    };
    return riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig['Thấp'];
  }

  /**
   * Format package code cho hiển thị  
   */
  static formatPackageCode(packageCode: string): string {
    const packageNames: { [key: string]: string } = {
      'STI-BASIC-01': 'Gói Cơ Bản 1',
      'STI-BASIC-02': 'Gói Cơ Bản 2', 
      'STI-ADVANCE': 'Gói Nâng Cao',
      'STI-COMPREHENSIVE': 'Gói Toàn Diện'
    };
    return packageNames[packageCode] || packageCode;
  }

  /**
   * Kiểm tra xem user có quyền xem STI stats không
   */
  static canViewStats(userRole: string): boolean {
    return userRole === 'staff'; // Chỉ staff mới có quyền xem, admin không có
  }

  /**
   * Kiểm tra xem consultant có thể xem STI history của customer không
   */
  static canConsultantViewHistory(userRole: string): boolean {
    return userRole === 'consultant'; // Consultant có thể xem trong context appointment
  }
}

export default STIAssessmentService; 