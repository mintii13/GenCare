import apiClient from './apiClient';
import { API } from '@/config/apiEndpoints';

export const testSc                                                                                                                                                                                                                                                                                                                         heduleService = {
  /** Lấy toàn bộ lịch xét nghiệm kèm danh sách đơn hàng */
  getSchedulesWithOrders: () => apiClient.get(API.STI.VIEW_TEST_SCHEDULE_WITH_ORDERS),
}; 