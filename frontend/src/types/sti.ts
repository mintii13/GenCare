import { PaginationInfo, ApiResponse } from './api';

export interface StiPackage {
  _id: string;
  name: string;
}

export interface StiOrder {
  _id: string;
  order_code: string;
  package_id?: StiPackage;
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface StiOrdersPaginatedData {
    items: StiOrder[];
    pagination: PaginationInfo;
}

export type StiOrdersPaginatedResponse = ApiResponse<StiOrdersPaginatedData>;

export interface StiOrderQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  order_status?: string;
}