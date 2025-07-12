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

export const auditLogService = {
  getAuditLogs: async (
    query: AuditLogQuery
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
      API.STI.GET_AUDIT_LOGS, 
      { params: query }
    );
    return data;
  },
}; 