import apiClient from './apiClient';
import { API } from '../config/apiEndpoints';

export interface HomepageData {
  success: boolean;
  data: {
    sti_tests: any[];
    sti_packages: any[];
    blogs: any[];
    consultants: any[];
    stats: {
      total_tests: number;
      total_packages: number;
      total_blogs: number;
      total_consultants: number;
    };
  };
  message: string;
}

class HomeService {
  /**
   * Fetch all homepage data in a single API call
   */
  async getHomepageData(): Promise<HomepageData> {
    try {
      console.log('🏠 HomeService: Fetching homepage data...');
      const response = await apiClient.get<HomepageData>(API.Home.GET_DATA);
      console.log(' HomeService: Homepage data fetched successfully', response.data);
      return response.data;
    } catch (error) {
      console.error(' HomeService: Failed to fetch homepage data', error);
      throw error;
    }
  }
}

export default new HomeService(); 