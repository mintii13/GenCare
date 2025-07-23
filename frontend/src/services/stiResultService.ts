import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

// Types for STI Result
export type TestTypes = 'blood' | 'urine' | 'swab';

export interface StiResultItem {
  sti_test_id: string;
  result: {
    sample_type: TestTypes;
    sample_quality: boolean;
    urine?: {
      color?: string;
      clarity?: string;
      URO?: number;
      GLU?: number;
      KET?: number;
      BIL?: number;
      PRO?: number;
      NIT?: number;
      pH?: number;
      blood?: boolean;
      specific_gravity?: number;
      LEU?: number;
    };
    blood?: {
      platelets?: number;
      red_blood_cells?: number;
      white_blood_cells?: number;
      hemo_level?: number;
      hiv?: boolean | null;
      HBsAg?: boolean | null;
      anti_HBs?: boolean | null;
      anti_HBc?: boolean | null;
      anti_HCV?: boolean | null;
      HCV_RNA?: boolean | null;
      TPHA_syphilis?: boolean | null;
      VDRL_syphilis?: boolean | null;
      RPR_syphilis?: boolean | null;
      treponema_pallidum_IgM?: boolean | null;
      treponema_pallidum_IgG?: boolean | null;
    };
    swab?: {
      bacteria?: string[];
      virus?: string[];
      parasites?: string[];
      PCR_HSV?: boolean | null;
      HPV?: boolean | null;
      NAAT_Trichomonas?: boolean | null;
      rapidAntigen_Trichomonas?: boolean | null;
      culture_Trichomonas?: boolean | null;
    };
    time_completed: string;
    staff_id?: string;
  };
}

export interface StiResult {
  _id: string;
  sti_order_id: string;
  sti_result_items: StiResultItem[];
  received_time: string;
  diagnosis: string;
  is_confirmed: boolean;
  is_critical: boolean;
  medical_notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStiResultRequest {
  sti_order_id: string;
  sti_result_items: StiResultItem[];
  diagnosis?: string;
  is_confirmed?: boolean;
  is_critical?: boolean;
  is_notified?: boolean;
  notes?: string;
}

export interface UpdateStiResultByStaffRequest {
  sti_order_id: string;
  sti_result_items: StiResultItem[];
}

export interface UpdateStiResultByConsultantRequest {
  diagnosis?: string;
  is_confirmed?: boolean;
  medical_notes?: string;
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
  static async createStiResult(orderId: string, data: CreateStiResultRequest): Promise<StiResultResponse> {
    try {
      const response = await apiClient.post(`${API.STI.CREATE_STI_RESULT(orderId)}`, data);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error creating STI result:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi tạo kết quả STI'
      };
    }
  }

  static async getStiResults(orderId?: string): Promise<StiResultListResponse> {
    try {
      const url = orderId ? `${API.STI.GET_STI_RESULT(orderId)}` : '';
      const response = await apiClient.get(url);
      return response.data as StiResultListResponse;
    } catch (error: unknown) {
      console.error('Error fetching STI results:', error);
      return {
        success: false, 
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi lấy danh sách kết quả STI'
      };
    }
  }

  static async updateStiResultByStaff(orderId: string, data: UpdateStiResultByStaffRequest): Promise<StiResultResponse> {
    try {
      const response = await apiClient.patch(`${API.STI.UPDATE_STI_RESULT(orderId)}`, data);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error updating STI result by staff:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi cập nhật kết quả bởi staff'
      };
    }
  }

  static async updateStiResultByConsultant(orderId: string, data: UpdateStiResultByConsultantRequest): Promise<StiResultResponse> {
    try {
      const response = await apiClient.patch(`${API.STI.UPDATE_STI_RESULT(orderId)}`, data);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error updating STI result by consultant:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi cập nhật kết quả bởi consultant'
      };
    }
  }

  /**
   * Đồng bộ sample từ order
   */
  static async syncSampleFromOrder(orderId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.patch(`/sti/sti-result/sync-sample?orderId=${orderId}`);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error syncing sample from order:', error);
      return {
        success: false, 
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi đồng bộ sample từ order'
      };
    }
  }

  /**
   * Gửi mail thông báo kết quả
   */
  static async notifyResult(resultId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.post(`/sti/sti-result/notify?result_id=${resultId}`);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error notifying result:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi gửi thông báo kết quả'
      };
    }
  }
}

export const getMySTIResults = async () => {
  try {
    const response = await apiClient.get(API.STI.MY_STI_RESULTS);
    return response.data as StiResultListResponse;
  } catch (error) {
    console.error('Error fetching my STI results:', error);
    throw error;
  }
};

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
