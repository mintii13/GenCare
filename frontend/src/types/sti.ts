import { PaginationInfo, ApiResponse, BaseEntity, OrderStatus } from './common';

// STI Test Types
export type TestTypes = 'blood' | 'urine' | 'swab';
export type TestCategory = 'bacterial' | 'viral' | 'parasitic';

export interface StiTest extends BaseEntity {
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  is_active: boolean;
  category: TestCategory;
  sti_test_type: TestTypes;
  created_by: string;
}

// STI Package Types  
export interface StiPackage extends BaseEntity {
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
  is_active: boolean;
  created_by: string;
}

// STI Order Types
export interface StiOrder extends BaseEntity {
  order_code: string;
  customer_id: string;
  sti_package_item?: {
    sti_package_id: string;
    sti_test_ids: string[];
  };
  sti_test_items?: string[];
  total_amount: number;
  order_status: OrderStatus;
  order_date: string;
  appointment_date?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  notes?: string;
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