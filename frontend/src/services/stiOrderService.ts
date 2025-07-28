import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';

// ================ INTERFACES ================

export interface STIOrder {
  _id: string;
  customer_id: string;
  sti_package_item?: {
    sti_package_id: string;
    sti_test_ids: string[];
  };
  sti_test_items: string[];
  sti_schedule_id: string;
  order_date: string;
  total_amount: number;
  notes?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSTIOrderRequest {
  order_date: string; // Format: YYYY-MM-DD
  notes?: string;
  sti_package_id?: string;
  sti_test_items?: string[];
}

export interface UpdateSTIOrderRequest {
  order_date?: string;
  notes?: string;
  status?: string;
  sti_package_id?: string;
  sti_test_items?: string[];
}

export interface STIOrderQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  order_status?: string;
  payment_status?: string;
  min_amount?: string;
  max_amount?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface STIOrdersPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    items: STIOrder[];
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

export interface STIOrderResponse {
  success: boolean;
  message: string;
  data?: STIOrder;
}

// ================ SERVICE CLASS ================

export class STIOrderService {
  
  /**
   * Tạo STI Order mới (Customer)
   */
  static async createOrder(data: CreateSTIOrderRequest): Promise<STIOrderResponse> {
    try {
      console.log('Creating STI order with data:', data);
      
      // Validate required fields
      if (!data.order_date) {
        throw new Error('Order date is required');
      }
      
      // Convert order_date to proper format for backend validation
      // Backend expects Joi.date() which accepts Date object or ISO string
      let formattedOrderDate: Date;
      
      try {
        // Parse the date string and create Date object
        const parsedDate = new Date(data.order_date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        formattedOrderDate = parsedDate;
      } catch (parseError) {
        throw new Error('Order date must be a valid date in format YYYY-MM-DD');
      }
      
      // Create request data with Date object
      const requestData = {
        ...data,
        order_date: formattedOrderDate
      };
      
      console.log('Sending request with formatted data:', requestData);
      
      const response = await apiClient.post<STIOrderResponse>(API.STI.CREATE_ORDER, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating STI order:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi tạo đơn hàng STI'
      };
    }
  }

  /**
   * Lấy danh sách STI Orders của customer với pagination
   */
  static async getMyOrders(query?: STIOrderQuery): Promise<STIOrdersPaginatedResponse> {
    try {
      const response = await apiClient.get<STIOrdersPaginatedResponse>(API.STI.GET_MY_ORDERS, {
        params: this.cleanQuery(query)
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my STI orders:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả STI Orders với pagination (Staff/Admin)
   */
  static async getAllOrders(query?: STIOrderQuery): Promise<STIOrdersPaginatedResponse> {
    try {
      const response = await apiClient.get<STIOrdersPaginatedResponse>(API.STI.GET_ALL_ORDERS_PAGINATED, {
        params: this.cleanQuery(query)
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all STI orders:', error);
      throw error;
    }
  }

  /**
   * Lấy STI Order theo ID
   */
  static async getOrderById(orderId: string): Promise<STIOrderResponse> {
    try {
      const response = await apiClient.get<STIOrderResponse>(API.STI.GET_ORDER(orderId));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching STI order:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thông tin đơn hàng'
      };
    }
  }

  /**
   * Cập nhật STI Order
   */
  static async updateOrder(orderId: string, data: UpdateSTIOrderRequest): Promise<STIOrderResponse> {
    try {
      const response = await apiClient.patch<STIOrderResponse>(API.STI.UPDATE_ORDER(orderId), data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating STI order:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi cập nhật đơn hàng'
      };
    }
  }

  /**
   * Cập nhật trạng thái STI Order
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<STIOrderResponse> {
    try {
      const response = await apiClient.patch<STIOrderResponse>(API.STI.UPDATE_ORDER_STATUS(orderId), {
        status
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating STI order status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi cập nhật trạng thái đơn hàng'
      };
    }
  }

  /**
   * Lấy STI Orders theo customer ID (Staff/Admin)
   */
  static async getOrdersByCustomer(customerId: string): Promise<ApiResponse<{ orders: STIOrder[] }>> {
    try {
      const response = await apiClient.get<{ orders: STIOrder[] }>(API.STI.GET_ORDERS_BY_CUSTOMER(customerId));
      return {
        success: true,
        message: 'Success',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching customer STI orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy đơn hàng của khách hàng'
      };
    }
  }

  /**
   * Hủy STI Order
   */
  static async cancelOrder(orderId: string): Promise<STIOrderResponse> {
    try {
      const response = await apiClient.patch<STIOrderResponse>(API.STI.UPDATE_ORDER_STATUS(orderId), {
        status: 'Canceled'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error canceling STI order:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi hủy đơn hàng'
      };
    }
  }

  /**
   * Xác nhận STI Order
   */
  static async confirmOrder(orderId: string): Promise<STIOrderResponse> {
    try {
      const response = await apiClient.patch<STIOrderResponse>(API.STI.UPDATE_ORDER_STATUS(orderId), {
        status: 'Accepted'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error confirming STI order:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi xác nhận đơn hàng'
      };
    }
  }

  /**
   * Lấy thống kê STI Orders
   */
  static async getOrderStats(): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    canceled: number;
    today: number;
  }>> {
    try {
      const response = await apiClient.get<{
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        canceled: number;
        today: number;
      }>('/sti/orders/stats');
      return {
        success: true,
        message: 'Success',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching STI order stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Lỗi khi lấy thống kê đơn hàng'
      };
    }
  }

  /**
   * Helper function để loại bỏ các giá trị undefined/null từ query object
   */
  private static cleanQuery(obj: unknown) {
    if (!obj) return {};
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== ''));
  }
}

// ================ EXPORT DEFAULT INSTANCE ================

export default STIOrderService; 