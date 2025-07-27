import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';
import { StiTest, TestTypes, TestCategory, ApiResponse, PaginatedResponse, BaseQuery } from '../types';

// Backend response interfaces
interface BackendSTITestResponse {
  success: boolean;
  message: string;
  stitest: StiTest;
}

interface BackendSTITestListResponse {
  success: boolean;
  message: string;
  stitest: StiTest[];
}

// Re-export types for convenience
export type STITest = StiTest;
export type { TestTypes, TestCategory };

export interface CreateSTITestRequest {
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  category: TestCategory;
  sti_test_type: TestTypes;
}

export interface UpdateSTITestRequest {
  sti_test_name?: string;
  sti_test_code?: string;
  description?: string;
  price?: number;
  category?: TestCategory;
  sti_test_type?: TestTypes;
  is_active?: boolean;
}

export interface STITestQuery extends BaseQuery {
  category?: TestCategory;
  test_type?: TestTypes;
  is_active?: boolean;
}

export interface STITestResponse extends ApiResponse<STITest> {
  stitest?: STITest; // Backward compatibility
}

export interface STITestListResponse {
  success: boolean;
  message: string;
  stitest?: STITest[];
  data?: {
    items: STITest[];
    total: number;
    page: number;
    limit: number;
  };
}

class STITestService {
  static async getAllTests(query?: STITestQuery): Promise<STITestListResponse> {
    try {
      const response = await apiClient.get<BackendSTITestListResponse>(API.STI.GET_ALL_TESTS, {
        params: query
      });
      return {
        success: true,
        message: 'Lấy danh sách xét nghiệm thành công',
        data: {
          items: response.data.stitest || [],
          total: response.data.stitest?.length || 0,
          page: 1,
          limit: 50
        }
      };
    } catch (error: any) {
      console.error('Error fetching STI tests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy danh sách xét nghiệm'
      };
    }
  }

  static async getTestById(id: string): Promise<STITestResponse> {
    try {
      const response = await apiClient.get<BackendSTITestResponse>(API.STI.GET_TEST(id));
      return {
        success: true,
        message: 'Lấy thông tin xét nghiệm thành công',
        data: response.data.stitest
      };
    } catch (error: any) {
      console.error('Error fetching STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thông tin xét nghiệm'
      };
    }
  }

  static async createTest(data: CreateSTITestRequest): Promise<STITestResponse> {
    try {
      const response = await apiClient.post<BackendSTITestResponse>(API.STI.CREATE_TEST, data);
      return {
        success: true,
        message: 'Tạo xét nghiệm thành công',
        data: response.data.stitest
      };
    } catch (error: any) {
      console.error('Error creating STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo xét nghiệm'
      };
    }
  }

  static async updateTest(id: string, data: UpdateSTITestRequest): Promise<STITestResponse> {
    try {
      const response = await apiClient.put<BackendSTITestResponse>(API.STI.UPDATE_TEST(id), data);
      return {
        success: true,
        message: 'Cập nhật xét nghiệm thành công',
        data: response.data.stitest
      };
    } catch (error: any) {
      console.error('Error updating STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật xét nghiệm'
      };
    }
  }

  static async deleteTest(id: string): Promise<STITestResponse> {
    try {
      const response = await apiClient.put<BackendSTITestResponse>(API.STI.DELETE_TEST(id));
      return {
        success: true,
        message: 'Xóa xét nghiệm thành công',
        data: response.data.stitest
      };
    } catch (error: any) {
      console.error('Error deleting STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa xét nghiệm'
      };
    }
  }
}

export { STITestService };
export default STITestService; 