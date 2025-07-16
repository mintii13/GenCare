import apiClient, { ApiResponse } from './apiClient';
import { API } from '../config/apiEndpoints';
import { PaginatedResponse, PaginationQuery } from '../types/pagination';
import { AuditLog } from '../types/audit';

export interface AuditLogQuery extends PaginationQuery {
  target_type?: string;
  user_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

export interface RevenueData {
  total_revenue: number;
}


export const analyticsService = {
  getAuditLogs: (
    query: AuditLogQuery
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> => {
    return apiClient.safeGet(API.STI.GET_AUDIT_LOGS, { params: query });
  },
  getTotalRevenue: (): Promise<ApiResponse<RevenueData>> => {
      return apiClient.safeGet(API.STI.GET_TOTAL_REVENUE);
  },
  getRevenueByCustomer: (customerId: string): Promise<ApiResponse<RevenueData>> => {
    return apiClient.safeGet(API.STI.GET_REVENUE_BY_CUSTOMER(customerId));
  }
}; 