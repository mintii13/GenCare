import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

// Types for STI Result - Updated to match your actual schema
export type TestTypes = 'blood' | 'urine' | 'swab';

export interface StiResultItem {
  sti_test_id: string;
  result: {
    sample_type: TestTypes;
    is_testing_completed?: boolean; // Thêm field này nếu backend hỗ trợ
    urine?: {
      color?: 'light yellow' | 'clear' | 'dark yellow to orange' | 'dark brown' | 'pink or red' | 'blue or green' | 'black';
      clarity?: 'clearly' | 'cloudy';
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
      // HBsAg?: boolean | null;
      anti_HBs?: boolean | null;
      anti_HBc?: boolean | null;
      anti_HCV?: boolean | null;
      HCV_RNA?: boolean | null;
      TPHA_syphilis?: boolean | null;
      // VDRL_syphilis?: boolean | null;
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
  is_testing_completed: boolean;
  diagnosis: string;
  is_confirmed: boolean;
  is_critical: boolean;
  is_notified?: boolean;
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

// Main function to get STI result by order ID
export const getStiResultByOrderId = async (orderId: string): Promise<StiResultResponse> => {
  try {
    const response = await apiClient.get(API.STI.GET_STI_RESULT(orderId));
    return response.data as StiResultResponse;
  } catch (error: any) {
    console.error('Error fetching STI result by order ID:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Không thể lấy kết quả xét nghiệm STI'
    };
  }
};

// Helper function để check xem một STI result item có hoàn thành không
export const isResultItemCompleted = (item: StiResultItem): boolean => {
  // Nếu có field is_testing_completed trong result, ưu tiên sử dụng
  if (item.result.is_testing_completed !== undefined) {
    return item.result.is_testing_completed;
  }
  
  // Fallback: Kiểm tra time_completed
  return !!item.result.time_completed;
};

// Helper function để lấy chỉ những item đã hoàn thành
export const getCompletedResultItems = (stiResult: StiResult): StiResultItem[] => {
  return stiResult.sti_result_items.filter(item => isResultItemCompleted(item));
};

// Helper function để lấy chỉ những item chưa hoàn thành
export const getPendingResultItems = (stiResult: StiResult): StiResultItem[] => {
  return stiResult.sti_result_items.filter(item => !isResultItemCompleted(item));
};

// STI Result Service Class
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
      const url = orderId ? `${API.STI.GET_STI_RESULT(orderId)}` : 'API.STI.GET_ALL_STI_RESULTS';
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
      const response = await apiClient.patch(`${API.STI.UPDATE_STI_RESULT_BY_CONSULTANT(orderId)}`, data);
      return response.data as StiResultResponse;
    } catch (error: unknown) {
      console.error('Error updating STI result by consultant:', error);
      return {
        success: false,
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lỗi khi cập nhật kết quả bởi consultant'
      };
    }
  }

  static async deleteStiResult(orderId: string): Promise<StiResultResponse> {
    try {
      const response = await apiClient.delete(`${API.STI.DELETE_STI_RESULT(orderId)}`);
      return response.data as StiResultResponse;
    } catch (error: any) {
      console.error('Error deleting STI result:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa kết quả STI'
      };
    }
  }

  // Method to export STI results
  static async exportStiResults(params: {
    orderId?: string;
    format: 'excel' | 'pdf' | 'csv';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.get(`${API.STI.EXPORT_STI_RESULTS}`, {
        params,
        responseType: 'blob'
      });
      return response.data as Blob;
    } catch (error: any) {
      console.error('Error exporting STI results:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xuất kết quả STI');
    }
  }

  // Method to get STI result statistics
  static async getStiResultStats(params?: {
    dateFrom?: string;
    dateTo?: string;
    sampleType?: TestTypes;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      totalTests: number;
      completedTests: number;
      pendingTests: number;
      positiveResults: number;
      negativeResults: number;
      bySampleType: Record<TestTypes, number>;
    };
  }> {
    try {
      const response = await apiClient.get(`${API.STI.GET_STI_STATS}`, { params });
      return (response as any).data;
    } catch (error: any) {
      console.error('Error fetching STI result stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thống kê kết quả STI'
      };
    }
  }
}

// Functions for patient/user access
export const getMySTIResults = async (): Promise<StiResultListResponse> => {
  try {
    const response = await apiClient.get(API.STI.MY_STI_RESULTS);
    return response.data as StiResultListResponse;
  } catch (error: any) {
    console.error('Error fetching my STI results:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Lỗi khi lấy kết quả STI của tôi'
    };
  }
};

export const getMySTIResultByOrderId = async (orderId: string): Promise<StiResultResponse> => {
  try {
    const response = await apiClient.get(API.STI.MY_STI_RESULT(orderId));
    return response.data as StiResultResponse;
  } catch (error: any) {
    console.error('Error fetching my STI result:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Lỗi khi lấy kết quả STI của tôi'
    };
  }
};

// Helper functions
export const formatSampleType = (type: TestTypes): string => {
  const typeMap = {
    urine: 'Nước tiểu',
    blood: 'Máu',
    swab: 'Dịch tiết'
  };
  return typeMap[type] || type;
};

export const formatBooleanResult = (value: boolean | null): string => {
  if (value === null) return 'Chưa xét nghiệm';
  return value ? 'Dương tính (+)' : 'Âm tính (-)';
};

export const getUrineColorLabel = (color: string): string => {
  const colorMap: Record<string, string> = {
    'light yellow': 'Vàng nhạt',
    'clear': 'Trong suốt',
    'dark yellow to orange': 'Vàng đậm đến cam',
    'dark brown': 'Nâu đậm',
    'pink or red': 'Hồng hoặc đỏ',
    'blue or green': 'Xanh dương hoặc xanh lá',
    'black': 'Đen'
  };
  return colorMap[color] || color;
};

export const getClarityLabel = (clarity: string): string => {
  const clarityMap: Record<string, string> = {
    'clearly': 'Trong',
    'cloudy': 'Đục'
  };
  return clarityMap[clarity] || clarity;
};

// Thêm vào stiResultService.ts

export interface StiOrderSummary {
  id: string;
  customer_name?: string;
  customer_id?: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_tests: number;
  completed_tests: number;
  has_results: boolean;
  is_urgent?: boolean;
}

export interface StiOrdersResponse {
  success: boolean;
  message: string;
  data?: StiOrderSummary[];
  total?: number;
}

// Fetch all STI orders for consultant/staff view
export const getAllStiOrders = async (params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StiOrdersResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API.STI.GET_ALL_ORDERS}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    
    return response.data as StiOrdersResponse;
  } catch (error: any) {
    console.error('Error fetching all STI orders:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Không thể lấy danh sách đơn hàng STI'
    };
  }
};

// Helper function to get order status display info
export const getOrderStatusInfo = (status: string) => {
  const statusMap = {
    'pending': { color: 'blue', text: 'Chờ xử lý' },
    'in_progress': { color: 'orange', text: 'Đang xử lý' },
    'completed': { color: 'green', text: 'Hoàn thành' },
    'cancelled': { color: 'red', text: 'Đã hủy' }
  };
  
  return statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
};
export default StiResultService;