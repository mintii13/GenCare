import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';

// ================ INTERFACES ================

export interface STITest {
  _id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  is_active: boolean;
  category: 'bacterial' | 'viral' | 'parasitic';
  sti_test_type: 'máu' | 'nước tiểu' | 'dịch ngoáy';
  createdAt: string;
  updatedAt: string;
}

export interface STIPackage {
  _id: string;
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
  is_active: boolean;
  sti_test_ids: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSTITestRequest {
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  category: 'bacterial' | 'viral' | 'parasitic';
  sti_test_type: 'máu' | 'nước tiểu' | 'dịch ngoáy';
  is_active?: boolean;
}

export interface UpdateSTITestRequest {
  sti_test_name?: string;
  sti_test_code?: string;
  description?: string;
  price?: number;
  category?: 'bacterial' | 'viral' | 'parasitic';
  sti_test_type?: 'máu' | 'nước tiểu' | 'dịch ngoáy';
  is_active?: boolean;
}

export interface CreateSTIPackageRequest {
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
  sti_test_ids: string[];
  is_active?: boolean;
}

export interface UpdateSTIPackageRequest {
  sti_package_name?: string;
  sti_package_code?: string;
  price?: number;
  description?: string;
  sti_test_ids?: string[];
  is_active?: boolean;
}

export interface STIQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  category?: string;
  test_type?: string;
  is_active?: boolean;
}

export interface STITestResponse {
  success: boolean;
  message: string;
  data?: STITest;
}

export interface STITestsResponse {
  success: boolean;
  message: string;
  data?: STITest[];
}

export interface STIPackageResponse {
  success: boolean;
  message: string;
  data?: STIPackage;
}

export interface STIPackagesResponse {
  success: boolean;
  message: string;
  data?: STIPackage[];
}

export interface STIPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    items: STITest[] | STIPackage[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

// ================ STI TEST SERVICE ================

export class STITestService {
  /**
   * Tạo STI Test mới (Staff/Admin)
   */
  static async createTest(data: CreateSTITestRequest): Promise<STITestResponse> {
    try {
      const response = await apiClient.post<STITestResponse>(API.STI.CREATE_TEST, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi tạo xét nghiệm STI'
      };
    }
  }

  /**
   * Lấy tất cả STI Tests với pagination (Staff/Admin)
   */
  static async getAllTests(query?: STIQuery): Promise<STIPaginatedResponse> {
    try {
      const response = await apiClient.get<any>(API.STI.GET_ALL_TESTS_PAGINATED, {
        params: this.cleanQuery(query)
      });
      
      // Xử lý response format từ endpoint cũ
      if (response.data.success && response.data.stitest) {
        return {
          success: true,
          message: response.data.message,
          data: {
            items: response.data.stitest,
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_items: response.data.stitest.length,
              items_per_page: response.data.stitest.length,
              has_next: false,
              has_prev: false
            }
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching STI tests:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả STI Tests active (Public)
   */
  static async getActiveTests(): Promise<STITestsResponse> {
    try {
      const response = await apiClient.get<any>(API.STI.GET_ALL_TESTS);
      
      // Xử lý response format từ backend
      if (response.data.success && response.data.stitest) {
        // Lọc chỉ những test active
        const activeTests = response.data.stitest.filter((test: STITest) => test.is_active);
        return {
          success: true,
          message: response.data.message,
          data: activeTests
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active STI tests:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách xét nghiệm'
      };
    }
  }

  /**
   * Lấy STI Test theo ID
   */
  static async getTestById(testId: string): Promise<STITestResponse> {
    try {
      const response = await apiClient.get<STITestResponse>(API.STI.GET_TEST(testId));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thông tin xét nghiệm'
      };
    }
  }

  /**
   * Cập nhật STI Test
   */
  static async updateTest(testId: string, data: UpdateSTITestRequest): Promise<STITestResponse> {
    try {
      const response = await apiClient.patch<STITestResponse>(API.STI.UPDATE_TEST(testId), data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi cập nhật xét nghiệm'
      };
    }
  }

  /**
   * Xóa STI Test (Soft delete)
   */
  static async deleteTest(testId: string): Promise<STITestResponse> {
    try {
      const response = await apiClient.delete<STITestResponse>(API.STI.DELETE_TEST(testId));
      return response.data;
    } catch (error: any) {
      console.error('Error deleting STI test:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi xóa xét nghiệm'
      };
    }
  }

  /**
   * Kích hoạt/Vô hiệu hóa STI Test
   */
  static async toggleTestStatus(testId: string, isActive: boolean): Promise<STITestResponse> {
    try {
      const response = await apiClient.patch<STITestResponse>(API.STI.UPDATE_TEST(testId), {
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling STI test status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi thay đổi trạng thái xét nghiệm'
      };
    }
  }

  /**
   * Lấy thống kê STI Tests
   */
  static async getTestStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    by_category: {
      bacterial: number;
      viral: number;
      parasitic: number;
    };
    by_type: {
      máu: number;
      'nước tiểu': number;
      'dịch ngoáy': number;
    };
  }>> {
    try {
      const response = await apiClient.get<{
        total: number;
        active: number;
        inactive: number;
        by_category: {
          bacterial: number;
          viral: number;
          parasitic: number;
        };
        by_type: {
          máu: number;
          'nước tiểu': number;
          'dịch ngoáy': number;
        };
      }>(API.STI.GET_TEST_STATS);
      return {
        success: true,
        message: 'Success',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching STI test stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thống kê xét nghiệm'
      };
    }
  }

  private static cleanQuery(obj: unknown) {
    if (!obj || typeof obj !== 'object') return {};
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
  }
}

// ================ STI PACKAGE SERVICE ================

export class STIPackageService {
  /**
   * Tạo STI Package mới (Staff/Admin)
   */
  static async createPackage(data: CreateSTIPackageRequest): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.post<STIPackageResponse>(API.STI.CREATE_PACKAGE, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi tạo gói xét nghiệm STI'
      };
    }
  }

  /**
   * Lấy tất cả STI Packages với pagination (Staff/Admin)
   */
  static async getAllPackages(query?: STIQuery): Promise<STIPaginatedResponse> {
    try {
      const response = await apiClient.get<any>(API.STI.GET_ALL_PACKAGES_PAGINATED, {
        params: this.cleanQuery(query)
      });
      
      // Xử lý response format từ endpoint cũ
      if (response.data.success && response.data.stipackage) {
        return {
          success: true,
          message: response.data.message,
          data: {
            items: response.data.stipackage,
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_items: response.data.stipackage.length,
              items_per_page: response.data.stipackage.length,
              has_next: false,
              has_prev: false
            }
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching STI packages:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả STI Packages active (Public)
   */
  static async getActivePackages(): Promise<STIPackagesResponse> {
    try {
      const response = await apiClient.get<any>(API.STI.GET_ALL_PACKAGES);
      
      // Xử lý response format từ backend
      if (response.data.success && response.data.stipackage) {
        // Lọc chỉ những package active
        const activePackages = response.data.stipackage.filter((pkg: STIPackage) => pkg.is_active);
        return {
          success: true,
          message: response.data.message,
          data: activePackages
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active STI packages:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách gói xét nghiệm'
      };
    }
  }

  /**
   * Lấy STI Package theo ID
   */
  static async getPackageById(packageId: string): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.get<STIPackageResponse>(API.STI.GET_PACKAGE(packageId));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thông tin gói xét nghiệm'
      };
    }
  }

  /**
   * Cập nhật STI Package
   */
  static async updatePackage(packageId: string, data: UpdateSTIPackageRequest): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.patch<STIPackageResponse>(API.STI.UPDATE_PACKAGE(packageId), data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi cập nhật gói xét nghiệm'
      };
    }
  }

  /**
   * Xóa STI Package (Soft delete)
   */
  static async deletePackage(packageId: string): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.delete<STIPackageResponse>(API.STI.DELETE_PACKAGE(packageId));
      return response.data;
    } catch (error: any) {
      console.error('Error deleting STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi xóa gói xét nghiệm'
      };
    }
  }

  /**
   * Kích hoạt/Vô hiệu hóa STI Package
   */
  static async togglePackageStatus(packageId: string, isActive: boolean): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.patch<STIPackageResponse>(API.STI.UPDATE_PACKAGE(packageId), {
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling STI package status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi thay đổi trạng thái gói xét nghiệm'
      };
    }
  }

  /**
   * Lấy thống kê STI Packages
   */
  static async getPackageStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    avg_price: number;
    total_value: number;
  }>> {
    try {
      const response = await apiClient.get<{
        total: number;
        active: number;
        inactive: number;
        avg_price: number;
        total_value: number;
      }>(API.STI.GET_PACKAGE_STATS);
      return {
        success: true,
        message: 'Success',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching STI package stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thống kê gói xét nghiệm'
      };
    }
  }

  /**
   * Lấy danh sách tests trong package
   */
  static async getPackageTests(packageId: string): Promise<ApiResponse<STITest[]>> {
    try {
      const response = await apiClient.get<STITest[]>(API.STI.GET_PACKAGE_TESTS(packageId));
      return {
        success: true,
        message: 'Success',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching package tests:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy danh sách xét nghiệm trong gói'
      };
    }
  }

  /**
   * Cập nhật danh sách tests trong package
   */
  static async updatePackageTests(packageId: string, testIds: string[]): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.patch<STIPackageResponse>(API.STI.UPDATE_PACKAGE_TESTS(packageId), {
        sti_test_ids: testIds
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating package tests:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi cập nhật danh sách xét nghiệm trong gói'
      };
    }
  }

  private static cleanQuery(obj: unknown) {
    if (!obj || typeof obj !== 'object') return {};
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
  }
}
