import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { FilterUtils, FilterValue } from '../utils/filterUtils';

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export interface UsePaginatedResourceParams<T> {
  apiService: (params: URLSearchParams) => Promise<any>;
  initialFilters?: Record<string, any>;
  debounceTime?: number;
  searchParamName?: string;
}

const usePaginatedResource = <T>({
  apiService,
  initialFilters = {},
  debounceTime = 500,
  searchParamName = 'search',
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

  // The core data fetching logic with improved filter handling
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Create complete filter object including search term
      const completeFilters: FilterValue = {
        ...filters,
      };

      // Add debounced search term if it exists
      if (debouncedSearchTerm) {
        completeFilters[searchParamName] = FilterUtils.sanitizeSearchQuery(debouncedSearchTerm);
      }

      // Use FilterUtils for consistent parameter building
      const params = FilterUtils.buildUrlParams(completeFilters, {
        excludeDefaults: ['all', 'any', ''],
        maxLength: 500
      });

      console.log('🔍 API Request params:', params.toString());

      const response = await apiService(params);
      
      // Handle the wrapped response structure from `safeGet`
      if (response.success && response.data && response.data.data) {
        setData(response.data.data.items || []);
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        } else {
          // Fallback if pagination is missing in a successful response
          setPagination({ 
            current_page: 1, 
            total_pages: 1, 
            total_items: response.data.data.items?.length || 0, 
            items_per_page: 10 
          });
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
  }, [apiService, filters, debouncedSearchTerm, searchParamName]);

  // Re-fetch data whenever filters or the debounced search term change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to change page or page size with validation
  const handlePageChange = (page: number, pageSize?: number) => {
    // Validate page number
    const validPage = Math.max(1, Math.min(page, pagination.total_pages || 1));
    const validPageSize = pageSize ? Math.min(100, Math.max(1, pageSize)) : filters.limit || 10;

    setFilters(prev => ({
      ...prev,
      page: validPage,
      limit: validPageSize,
    }));
  };

  // Handler to update a specific filter's value with validation
  const handleFilterChange = (key: string, value: any) => {
    // Sanitize search queries
    if (key === 'search' || key === searchParamName) {
      value = FilterUtils.sanitizeSearchQuery(String(value || ''));
    }

    // Validate ObjectId fields
    if (key.includes('_id') && value && !FilterUtils.isValidObjectId(String(value))) {
      console.warn(`Invalid ObjectId format for ${key}:`, value);
      // Don't update if invalid ObjectId
      return;
    }

    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 on filter change
    }));
  };

  // Enhanced filter reset function
  const resetFilters = useCallback(() => {
    FilterUtils.resetFilters(initialFilters, setFilters, setSearchTerm);
    setDebouncedSearchTerm('');
  }, [initialFilters]);

  // Get clean filters for debugging
  const getCleanFilters = useCallback(() => {
    return FilterUtils.cleanFilters(filters);
  }, [filters]);

  // Check if filters have changed from initial state
  const hasFiltersChanged = useCallback(() => {
    return FilterUtils.hasFiltersChanged(initialFilters, filters);
  }, [initialFilters, filters]);
  
  // Expose the state and handlers to the component
  return {
    data,
    loading,
    pagination,
    filters,
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    setFilters,
    handlePageChange,
    handleFilterChange,
    resetFilters,
    refresh: fetchData, // Allow manual refresh
    getCleanFilters, // For debugging
    hasFiltersChanged, // Check if filters changed
    // Additional utilities
    isLoading: loading,
    isEmpty: data.length === 0 && !loading,
    hasData: data.length > 0,
  };
};

export default usePaginatedResource; 