import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';

interface CustomError extends Error {
    statusCode?: number;
    status?: number;
    code?: string;
    details?: any;
    errors?: any[];
    isOperational?: boolean;
}

export const errorHandler = (
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', error);

    if (res.headersSent) {
        return next(error);
    }

    // Determine status code
    const statusCode = error.statusCode || error.status || 500;

    // Base error response
    const errorResponse: any = {
        success: false,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    // Handle different types of errors
    switch (statusCode) {
        case 400:
            errorResponse.message = 'Dữ liệu không hợp lệ';
            errorResponse.type = 'VALIDATION_ERROR';
            
            // Include validation details if available
            if (error.details || error.errors) {
                errorResponse.details = error.details || error.message;
                errorResponse.errors = error.errors;
            } else {
                errorResponse.details = error.message || 'Dữ liệu gửi lên không đúng định dạng';
            }
            break;

        case 401:
            errorResponse.message = 'Phiên đăng nhập đã hết hạn';
            errorResponse.type = 'AUTHENTICATION_ERROR';
            errorResponse.details = 'Vui lòng đăng nhập lại để tiếp tục';
            break;

        case 403:
            errorResponse.message = 'Không có quyền truy cập';
            errorResponse.type = 'AUTHORIZATION_ERROR';
            errorResponse.details = 'Bạn không có quyền thực hiện hành động này';
            break;

        case 404:
            errorResponse.message = 'Không tìm thấy tài nguyên';
            errorResponse.type = 'NOT_FOUND_ERROR';
            errorResponse.details = 'Tài nguyên bạn yêu cầu không tồn tại hoặc đã bị xóa';
            break;

        case 409:
            errorResponse.message = 'Xung đột dữ liệu';
            errorResponse.type = 'CONFLICT_ERROR';
            errorResponse.details = error.message || 'Dữ liệu đã tồn tại hoặc có xung đột';
            break;

        case 422:
            errorResponse.message = 'Dữ liệu không thể xử lý';
            errorResponse.type = 'UNPROCESSABLE_ERROR';
            errorResponse.details = error.message || 'Dữ liệu không đúng định dạng yêu cầu';
            break;

        case 429:
            errorResponse.message = 'Quá nhiều yêu cầu';
            errorResponse.type = 'RATE_LIMIT_ERROR';
            errorResponse.details = 'Vui lòng thử lại sau ít phút';
            break;

        case 500:
        default:
            errorResponse.message = 'Lỗi hệ thống';
            errorResponse.type = 'INTERNAL_SERVER_ERROR';
            errorResponse.details = 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
            
            // Only show detailed error in development
            if (process.env.NODE_ENV === 'development') {
                errorResponse.error = error.message;
                errorResponse.stack = error.stack;
            }
            break;
    }

    // Handle MongoDB errors
    if (error.name === 'CastError') {
        errorResponse.message = 'ID không hợp lệ';
        errorResponse.type = 'INVALID_ID_ERROR';
        errorResponse.details = 'ID được cung cấp không đúng định dạng';
        return res.status(400).json(errorResponse);
    }

    // Handle MongoDB duplicate key errors
    if ((error as any).code === 11000) {
        errorResponse.message = 'Dữ liệu đã tồn tại';
        errorResponse.type = 'DUPLICATE_ERROR';
        errorResponse.details = 'Dữ liệu này đã tồn tại trong hệ thống';
        return res.status(409).json(errorResponse);
    }

    // Handle Joi validation errors
    if (error.name === 'ValidationError' && error.details) {
        errorResponse.message = 'Dữ liệu không hợp lệ';
        errorResponse.type = 'VALIDATION_ERROR';
        errorResponse.details = error.details;
        return res.status(400).json(errorResponse);
    }

    res.status(statusCode).json(errorResponse);
};

export function isAuthenticated(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    const error: CustomError = new Error('Unauthorized');
    error.statusCode = 401;
    error.isOperational = true;
    
    res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn',
        type: 'AUTHENTICATION_ERROR',
        details: 'Vui lòng đăng nhập lại để tiếp tục',
        timestamp: new Date().toISOString()
    });
}