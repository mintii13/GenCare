import apiClient from './apiClient';
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

export interface RevenueResponse {
    success: boolean;
    message: string;
    data: {
      total_revenue: number;
    };
}

export const analyticsService = {
  getAuditLogs: (
    query: AuditLogQuery
  ): Promise<PaginatedResponse<AuditLog>> => {
    return apiClient.get(API.STI.GET_AUDIT_LOGS, { params: query });
  },
  getTotalRevenue: (): Promise<RevenueResponse> => {
    return apiClient.get(API.STI.GET_TOTAL_REVENUE);
  },
  getRevenueByCustomer: (customerId: string): Promise<RevenueResponse> => {
    return apiClient.get(API.STI.GET_REVENUE_BY_CUSTOMER(customerId));
  }
}; 