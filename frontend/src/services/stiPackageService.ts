import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';
import { StiPackage, ApiResponse, BaseQuery } from '../types';

// Backend response interfaces
interface BackendSTIPackageResponse {
  success: boolean;
  message: string;
  stipackage: StiPackage;
}

interface BackendSTIPackageListResponse {
  success: boolean;
  message: string;
  stipackage: StiPackage[];
}

// Re-export types for convenience
export type STIPackage = StiPackage;

export interface CreateSTIPackageRequest {
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
}

export interface UpdateSTIPackageRequest {
  sti_package_name?: string;
  sti_package_code?: string;
  price?: number;
  description?: string;
  is_active?: boolean;
}

export interface STIPackageQuery extends BaseQuery {
  is_active?: boolean;
}

export interface STIPackageResponse extends ApiResponse<STIPackage> {
  stipackage?: STIPackage; // Backward compatibility
}

export interface STIPackageListResponse {
  success: boolean;
  message: string;
  stipackage?: STIPackage[];
  data?: {
    items: STIPackage[];
    total: number;
    page: number;
    limit: number;
  };
}

class STIPackageService {
  static async getAllPackages(query?: STIPackageQuery): Promise<STIPackageListResponse> {
    try {
      const response = await apiClient.get<BackendSTIPackageListResponse>(API.STI.GET_ALL_PACKAGES, {
        params: query
      });
      return {
        success: true,
        message: 'Lấy danh sách gói xét nghiệm thành công',
        data: {
          items: response.data.stipackage || [],
          total: response.data.stipackage?.length || 0,
          page: 1,
          limit: 50
        }
      };
    } catch (error: any) {
      console.error('Error fetching STI packages:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy danh sách gói xét nghiệm'
      };
    }
  }

  static async getPackageById(id: string): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.get<BackendSTIPackageResponse>(API.STI.GET_PACKAGE(id));
      return {
        success: true,
        message: 'Lấy thông tin gói xét nghiệm thành công',
        data: response.data.stipackage
      };
    } catch (error: any) {
      console.error('Error fetching STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi lấy thông tin gói xét nghiệm'
      };
    }
  }

  static async createPackage(data: CreateSTIPackageRequest): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.post<BackendSTIPackageResponse>(API.STI.CREATE_PACKAGE, data);
      return {
        success: true,
        message: 'Tạo gói xét nghiệm thành công',
        data: response.data.stipackage
      };
    } catch (error: any) {
      console.error('Error creating STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tạo gói xét nghiệm'
      };
    }
  }

  static async updatePackage(id: string, data: UpdateSTIPackageRequest): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.put<BackendSTIPackageResponse>(API.STI.UPDATE_PACKAGE(id), data);
      return {
        success: true,
        message: 'Cập nhật gói xét nghiệm thành công',
        data: response.data.stipackage
      };
    } catch (error: any) {
      console.error('Error updating STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi cập nhật gói xét nghiệm'
      };
    }
  }

  static async deletePackage(id: string): Promise<STIPackageResponse> {
    try {
      const response = await apiClient.put<BackendSTIPackageResponse>(API.STI.DELETE_PACKAGE(id));
      return {
        success: true,
        message: 'Xóa gói xét nghiệm thành công',
        data: response.data.stipackage
      };
    } catch (error: any) {
      console.error('Error deleting STI package:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa gói xét nghiệm'
      };
    }
  }
}

export { STIPackageService };
export default STIPackageService; 