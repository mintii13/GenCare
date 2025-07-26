import toast from 'react-hot-toast';
import { ApiResponse } from '@/services/apiClient';

export interface ErrorInfo {
  title: string;
  message: string;
  details?: string;
  errors?: any[];
  type?: string;
  timestamp?: string;
}

/**
 * Trích xuất thông tin lỗi chi tiết từ response
 */
export const extractErrorInfo = (error: any): ErrorInfo => {
  // Nếu là ApiResponse
  if (error?.success === false) {
    return {
      title: error.message || 'Có lỗi xảy ra',
      message: error.details || error.message || 'Có lỗi xảy ra',
      details: error.details,
      errors: error.errors,
      type: error.errorType,
      timestamp: error.timestamp
    };
  }

  // Nếu là AxiosError
  if (error?.response?.data) {
    const responseData = error.response.data;
    return {
      title: responseData.message || 'Có lỗi xảy ra',
      message: responseData.details || responseData.message || 'Có lỗi xảy ra',
      details: responseData.details,
      errors: responseData.errors,
      type: responseData.type,
      timestamp: responseData.timestamp
    };
  }

  // Fallback cho các lỗi khác
  return {
    title: 'Có lỗi xảy ra',
    message: error?.message || 'Có lỗi không xác định',
    type: 'UNKNOWN_ERROR'
  };
};

/**
 * Hiển thị toast lỗi với thông tin chi tiết
 */
export const showErrorToast = (error: any, customMessage?: string) => {
  const errorInfo = extractErrorInfo(error);
  
  // Sử dụng custom message nếu có
  const message = customMessage || errorInfo.message;
  
  // Hiển thị toast với thông tin chi tiết
  if (errorInfo.errors && Array.isArray(errorInfo.errors) && errorInfo.errors.length > 0) {
    // Nếu có nhiều lỗi validation
    const errorMessages = errorInfo.errors.join('\n• ');
    toast.error(`${message}\n\nChi tiết:\n• ${errorMessages}`, {
      duration: 6000,
      style: {
        maxWidth: '500px',
        whiteSpace: 'pre-line'
      }
    });
  } else if (errorInfo.details && errorInfo.details !== errorInfo.title) {
    // Nếu có chi tiết bổ sung
    toast.error(`${message}\n\nChi tiết: ${errorInfo.details}`, {
      duration: 5000,
      style: {
        maxWidth: '500px',
        whiteSpace: 'pre-line'
      }
    });
  } else {
    // Lỗi đơn giản
    toast.error(message, {
      duration: 4000
    });
  }
};

/**
 * Hiển thị toast lỗi validation với danh sách lỗi
 */
export const showValidationErrorToast = (errors: string[] | any[], title = 'Dữ liệu không hợp lệ') => {
  if (!errors || errors.length === 0) {
    toast.error(title);
    return;
  }

  const errorMessages = Array.isArray(errors) 
    ? errors.map(err => typeof err === 'string' ? err : err.message || err.toString())
    : [String(errors)];

  const message = `${title}\n\n• ${errorMessages.join('\n• ')}`;
  
  toast.error(message, {
    duration: 6000,
    style: {
      maxWidth: '500px',
      whiteSpace: 'pre-line'
    }
  });
};

/**
 * Xử lý lỗi cho form submission
 */
export const handleFormError = (error: any, fieldName?: string) => {
  const errorInfo = extractErrorInfo(error);
  
  // Nếu là lỗi validation cho field cụ thể
  if (fieldName && errorInfo.errors) {
    const fieldErrors = errorInfo.errors.filter(err => 
      err.field === fieldName || err.path === fieldName
    );
    
    if (fieldErrors.length > 0) {
      showValidationErrorToast(fieldErrors.map(err => err.message));
      return;
    }
  }
  
  // Hiển thị lỗi chung
  showErrorToast(error);
};

/**
 * Xử lý lỗi cho API calls
 */
export const handleApiError = (error: any, context?: string) => {
  const errorInfo = extractErrorInfo(error);
  
  // Thêm context nếu có
  const contextMessage = context ? `${context}: ${errorInfo.message}` : errorInfo.message;
  
  showErrorToast(error, contextMessage);
  
  // Log chi tiết cho debugging
  console.error(`API Error ${context ? `(${context})` : ''}:`, {
    type: errorInfo.type,
    message: errorInfo.message,
    details: errorInfo.details,
    errors: errorInfo.errors,
    timestamp: errorInfo.timestamp
  });
};

/**
 * Kiểm tra xem có phải lỗi authentication không
 */
export const isAuthError = (error: any): boolean => {
  const errorInfo = extractErrorInfo(error);
  return errorInfo.type === 'AUTHENTICATION_ERROR' || 
         error?.response?.status === 401;
};

/**
 * Kiểm tra xem có phải lỗi authorization không
 */
export const isAuthorizationError = (error: any): boolean => {
  const errorInfo = extractErrorInfo(error);
  return errorInfo.type === 'AUTHORIZATION_ERROR' || 
         error?.response?.status === 403;
};

/**
 * Kiểm tra xem có phải lỗi validation không
 */
export const isValidationError = (error: any): boolean => {
  const errorInfo = extractErrorInfo(error);
  return errorInfo.type === 'VALIDATION_ERROR' || 
         error?.response?.status === 400;
}; 