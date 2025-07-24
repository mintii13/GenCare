import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';
import { cleanQuery } from '@/utils/queryUtils';
import { StiOrdersPaginatedResponse, StiOrderQuery } from '../types/sti';

export const stiService = {
  getMyOrdersPaginated: async (query?: StiOrderQuery): Promise<StiOrdersPaginatedResponse> => {
    try {
      const response = await apiClient.get<StiOrdersPaginatedResponse>(API.STI.GET_MY_ORDERS, {
        params: cleanQuery(query)
      });
      return response.data;
    } catch (error) {
      console.error('API call to get my STI orders failed:', error);
      throw error;
    }
  },
};
