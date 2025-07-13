import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

// Types for STI Result
export interface StiResult {
  _id: string;
  order_id: string;
  sample: {
    sampleQualities: Record<string, boolean | null>;
    timeReceived?: Date;
    timeTesting?: Date;
  };
  time_result?: Date;
  result_value?: string;
  diagnosis?: string;
  is_confirmed: boolean;
  is_critical?: boolean;
  is_notified?: boolean;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateStiResultRequest {
  result_value?: string;
  diagnosis?: string;
  is_confirmed?: boolean;
  is_critical?: boolean;
  is_notified?: boolean;
  notes?: string;
}

export interface UpdateStiResultRequest {
  sample?: {
    sampleQualities?: Record<string, boolean | null>;
    timeReceived?: Date;
    timeTesting?: Date;
  };
  time_result?: Date;
  result_value?: string;
  diagnosis?: string;
  is_confirmed?: boolean;
  is_critical?: boolean;
  notes?: string;
  is_active?: boolean;
}

export interface StiResultResponse {
  success: boolean;
  message: string;
  data?: StiResult;
}

export interface StiResultListResponse {
  success: boolean;
  message: string;
  data?: StiResult[];
}

class StiResultService {
  /**
   * Tạo kết quả STI mới
   */
  static async createStiResult(orderId: string, data: CreateStiResultRequest): Promise<StiResultResponse> {
    try {
      const response = await apiClient.post(`${API.STI.STI_RESULT}?orderId=${orderId}`, data);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error creating STI result:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo kết quả STI'
      };
    }
  }

  /**
   * Lấy danh sách kết quả STI
   */
  static async getStiResults(orderId?: string): Promise<StiResultListResponse> {
    try {
      const url = orderId ? `${API.STI.STI_RESULT}?orderId=${orderId}` : API.STI.STI_RESULT;
      const response = await apiClient.get(url);
      return response.data as StiResultListResponse;
    } catch (error: any) {
      console.error('Error fetching STI results:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy danh sách kết quả STI'
      };
    }
  }

  /**
   * Lấy chi tiết kết quả STI theo ID
   */
  static async getStiResultById(resultId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.get(`${API.STI.STI_RESULT}/${resultId}`);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error fetching STI result:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy chi tiết kết quả STI'
      };
    }
  }

  /**
   * Cập nhật kết quả STI
   */
  static async updateStiResult(resultId: string, data: UpdateStiResultRequest): Promise<StiResultResponse> {
    try {
      const response = await apiClient.patch(`${API.STI.STI_RESULT}/${resultId}`, data);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error updating STI result:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật kết quả STI'
      };
    }
  }

  /**
   * Đồng bộ sample từ order
   */
  static async syncSampleFromOrder(orderId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.patch(`${API.STI.STI_RESULT}/sync-sample?orderId=${orderId}`);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error syncing sample from order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi đồng bộ sample từ order'
      };
    }
  }

  /**
   * Gửi mail thông báo kết quả
   */
  static async notifyResult(resultId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.post(`${API.STI.STI_RESULT}/notify?result_id=${resultId}`);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error notifying result:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi gửi thông báo kết quả'
      };
    }
  }
}

/**
 * Lấy danh sách kết quả STI của customer hiện tại
 */
export const getMySTIResults = async () => {
    try {
        const response = await apiClient.get(API.STI.MY_STI_RESULTS);
        return response.data as StiResultListResponse;
    } catch (error) {
        console.error('Error fetching my STI results:', error);
        throw error;
    }
};

/**
 * Lấy kết quả STI chi tiết cho một order cụ thể
 */
export const getMySTIResultByOrderId = async (orderId: string) => {
    try {
        const response = await apiClient.get(API.STI.MY_STI_RESULT(orderId));
        return response.data as StiResultResponse;
    } catch (error) {
        console.error('Error fetching my STI result:', error);
        throw error;
    }
};

export default StiResultService; 