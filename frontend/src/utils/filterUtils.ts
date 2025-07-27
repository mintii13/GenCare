/**
 * Frontend Filter Utilities
 * Provides consistent filter parameter handling and validation
 */

export interface FilterValue {
  [key: string]: string | number | boolean | null | undefined;
}

export interface FilterOptions {
  excludeEmpty?: boolean;
  excludeNull?: boolean;
  excludeUndefined?: boolean;
  excludeDefaults?: string[];
  allowedKeys?: string[];
  maxLength?: number;
}

/**
 * Standardized filter parameter builder
 */
export class FilterUtils {
  /**
   * Convert filter object to URLSearchParams with consistent handling
   */
  static buildUrlParams(
    filters: FilterValue,
    options: FilterOptions = {}
  ): URLSearchParams {
    const {
      excludeEmpty = true,
      excludeNull = true,
      excludeUndefined = true,
      excludeDefaults = ['all', 'any'],
      allowedKeys = [],
      maxLength = 1000
    } = options;

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      // Skip if key not in allowed list (when specified)
      if (allowedKeys.length > 0 && !allowedKeys.includes(key)) {
        continue;
      }

      // Skip null values
      if (excludeNull && value === null) {
        continue;
      }

      // Skip undefined values
      if (excludeUndefined && value === undefined) {
        continue;
      }

      // Skip empty strings
      if (excludeEmpty && value === '') {
        continue;
      }

      // Skip default values
      if (excludeDefaults.includes(String(value))) {
        continue;
      }

      // Convert value to string safely
      const stringValue = this.safeToString(value, maxLength);
      if (stringValue !== null) {
        params.append(key, stringValue);
      }
    }

    return params;
  }

  /**
   * Safely convert any value to string with length limits
   */
  private static safeToString(value: any, maxLength: number = 1000): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    let stringValue: string;

    if (typeof value === 'object') {
      try {
        stringValue = JSON.stringify(value);
      } catch {
        console.warn('Unable to stringify object value:', value);
        return null;
      }
    } else {
      stringValue = String(value);
    }

    // Limit length to prevent URL too long errors
    if (stringValue.length > maxLength) {
      console.warn(`Filter value too long (${stringValue.length} chars), truncating:`, stringValue.substring(0, 50));
      stringValue = stringValue.substring(0, maxLength);
    }

    return stringValue;
  }

  /**
   * Validate and sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove dangerous patterns that could cause issues
    const sanitized = query
      .trim()
      .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 200); // Limit length

    return sanitized;
  }

  /**
   * Validate filter values against schema
   */
  static validateFilters<T extends FilterValue>(
    filters: T,
    schema: Record<keyof T, (value: any) => boolean>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, validator] of Object.entries(schema)) {
      const value = filters[key as keyof T];
      
      if (value !== undefined && value !== null && !validator(value)) {
        errors.push(`Invalid value for filter "${key}": ${value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create debounced filter updater
   */
  static createDebouncedFilter<T extends FilterValue>(
    setFilters: (updater: (prev: T) => T) => void,
    delay: number = 500
  ) {
    let timeoutId: NodeJS.Timeout;

    return (key: keyof T, value: T[keyof T]) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        setFilters((prev: T) => ({
          ...prev,
          page: 1 as T[keyof T], // Reset to first page
          [key]: value
        }));
      }, delay);
    };
  }

  /**
   * Common filter validation schemas
   */
  static readonly ValidationSchemas = {
    // Pagination validation
    pagination: {
      page: (value: any) => {
        const num = parseInt(String(value));
        return !isNaN(num) && num >= 1 && num <= 10000;
      },
      limit: (value: any) => {
        const num = parseInt(String(value));
        return !isNaN(num) && num >= 1 && num <= 100;
      },
      sort_by: (value: any) => typeof value === 'string' && value.length <= 50,
      sort_order: (value: any) => ['asc', 'desc'].includes(String(value))
    },

    // Date validation
    dateRange: {
      date_from: (value: any) => {
        if (!value) return true;
        const date = new Date(String(value));
        return !isNaN(date.getTime());
      },
      date_to: (value: any) => {
        if (!value) return true;
        const date = new Date(String(value));
        return !isNaN(date.getTime());
      }
    },

    // Status validation
    status: {
      status: (value: any) => {
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'active', 'inactive'];
        return validStatuses.includes(String(value));
      }
    },

    // Amount validation
    amount: {
      min_amount: (value: any) => {
        if (!value) return true;
        const num = parseFloat(String(value));
        return !isNaN(num) && num >= 0;
      },
      max_amount: (value: any) => {
        if (!value) return true;
        const num = parseFloat(String(value));
        return !isNaN(num) && num >= 0;
      }
    },

    // Role validation
    role: {
      role: (value: any) => {
        const validRoles = ['admin', 'staff', 'consultant', 'customer', 'manager'];
        return validRoles.includes(String(value));
      }
    },

    // Blog-specific validation
    blog: {
      sort_by: (value: any) => {
        const validFields = ['publish_date', 'updated_date', 'title', 'read_count', 'like_count', 'comment_count'];
        return validFields.includes(String(value));
      }
    },

    // Appointment-specific validation
    appointment: {
      sort_by: (value: any) => {
        const validFields = ['appointment_date', 'created_date', 'updated_date', 'status', 'start_time'];
        return validFields.includes(String(value));
      },
      status: (value: any) => {
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'in_progress'];
        return validStatuses.includes(String(value));
      }
    },

    // STI Order-specific validation  
    stiOrder: {
      sort_by: (value: any) => {
        // ✅ FIXED: Match database field names - MongoDB uses camelCase for timestamps
        const validFields = ['order_date', 'total_amount', 'order_status', 'createdAt', 'updatedAt'];
        return validFields.includes(String(value));
      },
      order_status: (value: any) => {
        const validStatuses = ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'];
        return validStatuses.includes(String(value));
      },
      is_paid: (value: any) => {
        return ['true', 'false', true, false].includes(value);
      }
    },

    // User-specific validation
    user: {
      sort_by: (value: any) => {
        const validFields = ['registration_date', 'updated_date', 'full_name', 'email', 'role', 'last_login'];
        return validFields.includes(String(value));
      }
    }
  };

  /**
   * Reset filters to default state
   */
  static resetFilters<T extends FilterValue>(
    defaultFilters: T,
    setFilters: (filters: T) => void,
    resetSearchTerm?: (term: string) => void
  ): void {
    setFilters(defaultFilters);
    if (resetSearchTerm) {
      resetSearchTerm('');
    }
  }

  /**
   * Merge multiple filter validation schemas
   */
  static mergeValidationSchemas(
    ...schemas: Array<Record<string, (value: any) => boolean>>
  ): Record<string, (value: any) => boolean> {
    return Object.assign({}, ...schemas);
  }

  /**
   * Extract and validate pagination params
   */
  static extractPaginationParams(filters: FilterValue): {
    page: number;
    limit: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } {
    const page = Math.max(1, parseInt(String(filters.page || '1')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || '10')) || 10));
    
    const sort_by = filters.sort_by ? String(filters.sort_by) : undefined;
    const sort_order = filters.sort_order === 'asc' ? 'asc' : 'desc';

    return { page, limit, sort_by, sort_order };
  }

  /**
   * Clean filters by removing empty/default values
   */
  static cleanFilters<T extends FilterValue>(
    filters: T,
    options: {
      removeEmpty?: boolean;
      removeDefaults?: string[];
      keepKeys?: string[];
    } = {}
  ): Partial<T> {
    const {
      removeEmpty = true,
      removeDefaults = ['all', 'any', ''],
      keepKeys = []
    } = options;

    const cleaned: Partial<T> = {};

    for (const [key, value] of Object.entries(filters)) {
      // Always keep specified keys
      if (keepKeys.includes(key)) {
        cleaned[key as keyof T] = value as T[keyof T];
        continue;
      }

      // Skip empty values
      if (removeEmpty && (value === '' || value === null || value === undefined)) {
        continue;
      }

      // Skip default values
      if (removeDefaults.includes(String(value))) {
        continue;
      }

      cleaned[key as keyof T] = value as T[keyof T];
    }

    return cleaned;
  }

  /**
   * Compare two filter objects for changes
   */
  static hasFiltersChanged<T extends FilterValue>(
    oldFilters: T,
    newFilters: T,
    ignoreKeys: string[] = ['page']
  ): boolean {
    const oldKeys = Object.keys(oldFilters).filter(key => !ignoreKeys.includes(key));
    const newKeys = Object.keys(newFilters).filter(key => !ignoreKeys.includes(key));

    // Different number of keys
    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    // Check each key-value pair
    for (const key of oldKeys) {
      if (oldFilters[key] !== newFilters[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create filter query string for debugging
   */
  static createFilterDebugString<T extends FilterValue>(filters: T): string {
    const cleaned = this.cleanFilters(filters);
    const params = this.buildUrlParams(cleaned);
    
    return params.toString() || 'no-filters';
  }

  /**
   * Validate ObjectId-like strings (for MongoDB compatibility)
   */
  static isValidObjectId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // Basic ObjectId pattern validation
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Create type-safe filter updater
   */
  static createFilterUpdater<T extends FilterValue>(
    setFilters: (updater: (prev: T) => T) => void
  ) {
    return (key: keyof T, value: T[keyof T], resetPage: boolean = true) => {
      setFilters(prev => ({
        ...prev,
        ...(resetPage ? { page: 1 as T[keyof T] } : {}),
        [key]: value
      }));
    };
  }
}

/**
 * React hook for standardized filter management
 */
export function useStandardizedFilters<T extends FilterValue>(
  initialFilters: T,
  validationSchema?: Record<keyof T, (value: any) => boolean>
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [errors, setErrors] = useState<string[]>([]);

  // Create filter updater
  const updateFilter = FilterUtils.createFilterUpdater(setFilters);

  // Create debounced search updater
  const updateSearchDebounced = FilterUtils.createDebouncedFilter(setFilters, 500);

  // Validate filters when they change
  useEffect(() => {
    if (validationSchema) {
      const validation = FilterUtils.validateFilters(filters, validationSchema);
      setErrors(validation.errors);
    }
  }, [filters, validationSchema]);

  // Build URL params
  const urlParams = useMemo(() => {
    return FilterUtils.buildUrlParams(filters);
  }, [filters]);

  // Reset filters
  const resetFilters = useCallback(() => {
    FilterUtils.resetFilters(initialFilters, setFilters);
  }, [initialFilters]);

  return {
    filters,
    setFilters,
    updateFilter,
    updateSearchDebounced,
    urlParams,
    resetFilters,
    errors,
    hasErrors: errors.length > 0
  };
}

// Import React for the hook
import { useState, useEffect, useMemo, useCallback } from 'react'; 