import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

// Define the structure for pagination information
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next?: boolean;
  has_prev?: boolean;
}

// Define the structure for the API response
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
  message?: string;
}

// Define the service function that fetches data
type ApiService<T> = (params: URLSearchParams) => Promise<PaginatedResponse<T>>;

// Define the parameters for the hook
interface UsePaginatedResourceParams<T> {
  apiService: ApiService<T>;
  initialFilters?: Record<string, any>;
  debounceTime?: number;
}

const usePaginatedResource = <T>({
  apiService,
  initialFilters = {},
  debounceTime = 500,
}: UsePaginatedResourceParams<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search term changes
      setFilters(prev => ({ ...prev, page: 1 })); 
    }, debounceTime);
    return () => clearTimeout(timer);
  }, [searchTerm, debounceTime]);

  // The core data fetching logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Append all filters to the search params
      for (const key in filters) {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== 'all' && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      }
      // Add debounced search term if it exists
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await apiService(params);
      if (response.success && response.data) {
        setData(response.data.items || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        } else {
          // Fallback if pagination is missing in a successful response
          setPagination({ current_page: 1, total_pages: 1, total_items: response.data.items?.length || 0, items_per_page: 10 });
        }
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      message.error(error.message || 'An error occurred while fetching data.');
      setData([]);
      setPagination({ current_page: 1, total_pages: 1, total_items: 0, items_per_page: 10 });
    } finally {
      setLoading(false);
    }
  }, [apiService, filters, debouncedSearchTerm]);

  // Re-fetch data whenever filters or the debounced search term change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to change page or page size
  const handlePageChange = (page: number, pageSize?: number) => {
    setFilters(prev => ({
      ...prev,
      page,
      limit: pageSize || prev.limit || 10,
    }));
  };

  // Handler to update a specific filter's value
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 on filter change
    }));
  };
  
  // Expose the state and handlers to the component
  return {
    data,
    loading,
    pagination,
    filters,
    searchTerm,
    setSearchTerm,
    setFilters,
    handlePageChange,
    handleFilterChange,
    refresh: fetchData, // Allow manual refresh
  };
};

export default usePaginatedResource; 