import { Request, Response, NextFunction } from 'express';
import { ValidationError as JoiValidationError } from 'joi';
import mongoose from 'mongoose';

/**
 * Centralized Error Handling System
 * Provides consistent error responses across the application
 */

export interface ErrorResponse {
  success: false;
  message: string;
  type: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
  stack?: string;
}

export enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    type: string = ErrorTypes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Pre-defined error classes for common scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Dữ liệu không hợp lệ', details?: any) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Xác thực thất bại') {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Không có quyền truy cập') {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Không tìm thấy tài nguyên') {
    super(message, 404, ErrorTypes.NOT_FOUND_ERROR, true);
  }
}

export class DuplicateError extends AppError {
  constructor(message: string = 'Dữ liệu đã tồn tại', details?: any) {
    super(message, 409, ErrorTypes.DUPLICATE_ERROR, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Lỗi cơ sở dữ liệu', details?: any) {
    super(message, 500, ErrorTypes.DATABASE_ERROR, true, details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorTypes.BUSINESS_LOGIC_ERROR, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR, true);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Dịch vụ tạm thời không khả dụng') {
    super(message, 503, ErrorTypes.SERVICE_UNAVAILABLE, true);
  }
}

/**
 * Error parsing functions for different error types
 */
const parseMongooseError = (error: mongoose.Error): { message: string; details?: any } => {
  if (error.name === 'ValidationError') {
    const validationError = error as mongoose.Error.ValidationError;
    const errors: Record<string, string> = {};
    
    Object.keys(validationError.errors).forEach(key => {
      const err = validationError.errors[key];
      errors[key] = err.message;
    });

    return {
      message: 'Dữ liệu không hợp lệ',
      details: errors
    };
  }

  if (error.name === 'CastError') {
    const castError = error as mongoose.Error.CastError;
    return {
      message: `Giá trị "${castError.value}" không hợp lệ cho trường ${castError.path}`,
      details: {
        field: castError.path,
        value: castError.value,
        expectedType: castError.kind
      }
    };
  }

  if (error.name === 'MongoServerError') {
    const mongoError = error as any;
    if (mongoError.code === 11000) {
      const duplicatedField = Object.keys(mongoError.keyPattern)[0];
      return {
        message: `${duplicatedField} đã tồn tại trong hệ thống`,
        details: {
          field: duplicatedField,
          value: mongoError.keyValue[duplicatedField]
        }
      };
    }
  }

  return {
    message: 'Lỗi cơ sở dữ liệu',
    details: { originalError: error.message }
  };
};

const parseJoiError = (error: JoiValidationError): { message: string; details: any } => {
  const errors: Record<string, string> = {};
  
  error.details.forEach(detail => {
    const field = detail.path.join('.');
    errors[field] = detail.message;
  });

  return {
    message: 'Dữ liệu không hợp lệ',
    details: errors
  };
};

/**
 * Convert unknown errors to AppError instances
 */
export const normalizeError = (error: any): AppError => {
  // If already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Mongoose errors
  if (error instanceof mongoose.Error) {
    const parsed = parseMongooseError(error);
    
    if (error.name === 'ValidationError') {
      return new ValidationError(parsed.message, parsed.details);
    }
    
    if (error.name === 'CastError') {
      return new ValidationError(parsed.message, parsed.details);
    }
    
    if (error.name === 'MongoServerError' && (error as any).code === 11000) {
      return new DuplicateError(parsed.message, parsed.details);
    }
    
    return new DatabaseError(parsed.message, parsed.details);
  }

  // Handle Joi validation errors
  if (error.isJoi) {
    const parsed = parseJoiError(error);
    return new ValidationError(parsed.message, parsed.details);
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new ValidationError('Định dạng JSON không hợp lệ');
  }

  // Handle other specific error types
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Token không hợp lệ');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token đã hết hạn');
  }

  if (error.code === 'ENOTFOUND') {
    return new AppError('Không thể kết nối đến dịch vụ bên ngoài', 503, ErrorTypes.NETWORK_ERROR);
  }

  if (error.code === 'ECONNREFUSED') {
    return new ServiceUnavailableError('Dịch vụ từ chối kết nối');
  }

  // Default to internal server error
  return new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'Đã xảy ra lỗi nội bộ' 
      : error.message || 'Lỗi không xác định',
    500,
    ErrorTypes.INTERNAL_SERVER_ERROR,
    false,
    process.env.NODE_ENV !== 'production' ? { originalError: error.stack } : undefined
  );
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: AppError, req?: Request): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    message: error.message,
    type: error.type,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };

  // Add request path if available
  if (req) {
    response.path = `${req.method} ${req.originalUrl}`;
  }

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Log error with appropriate level
 */
export const logError = (error: AppError, req?: Request): void => {
  const logData = {
    message: error.message,
    type: error.type,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: (req as any).jwtUser?.userId || 'anonymous'
    }),
    ...(error.details && { details: error.details }),
    ...(error.stack && { stack: error.stack })
  };

  // Log based on error severity
  if (error.statusCode >= 500) {
    console.error('🚨 Server Error:', JSON.stringify(logData, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn('⚠️ Client Error:', JSON.stringify(logData, null, 2));
  } else {
    console.info('ℹ️ Info:', JSON.stringify(logData, null, 2));
  }
};

/**
 * Express error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const normalizedError = normalizeError(error);
  
  // Log the error
  logError(normalizedError, req);
  
  // Format and send response
  const errorResponse = formatErrorResponse(normalizedError, req);
  
  res.status(normalizedError.statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`);
  const errorResponse = formatErrorResponse(error, req);
  
  logError(error, req);
  res.status(404).json(errorResponse);
};

/**
 * Async wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Success response formatter
 */
export const successResponse = (
  data: any,
  message: string = 'Thành công',
  statusCode: number = 200
) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode
  };
};

/**
 * Pagination response formatter  
 */
export const paginationResponse = (
  data: any[],
  pagination: any,
  message: string = 'Lấy dữ liệu thành công',
  statusCode: number = 200
) => {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    statusCode
  };
};

/**
 * Health check response
 */
export const healthCheckResponse = () => {
  return {
    success: true,
    message: 'Dịch vụ hoạt động bình thường',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
};

/**
 * Handle process errors
 */
export const handleProcessErrors = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}; 