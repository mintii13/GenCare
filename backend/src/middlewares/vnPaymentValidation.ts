import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Schema validation cho tạo payment
const createPaymentSchema = Joi.object({
    order_id: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .required()
        .messages({
            'any.required': 'Order ID là bắt buộc',
            'string.empty': 'Order ID không được để trống',
            'any.invalid': 'Order ID không hợp lệ'
        }),

    bank_code: Joi.string()
        .valid('', 'VNPAYQR', 'VNBANK', 'INTCARD', 'VISA', 'MASTERCARD', 'JCB', 'UPI', 'VIB', 'VIETCOMBANK', 'ICB', 'AGRIBANK', 'NCB', 'SACOMBANK', 'EXIMBANK', 'MSBANK', 'NAMABANK', 'VNMART', 'VIETINBANK', 'MILITARYBANK', 'HDBANK', 'DONGABANK', 'TPBANK', 'OJB', 'BIDV', 'TECHCOMBANK', 'VPBANK', 'MBBANK', 'ACB', 'OCB', 'IVB', 'SHB')
        .optional()
        .allow('')
        .messages({
            'any.only': 'Mã ngân hàng không hợp lệ'
        }),

    locale: Joi.string()
        .valid('vn', 'en')
        .optional()
        .default('vn')
        .messages({
            'any.only': 'Ngôn ngữ phải là "vn" hoặc "en"'
        })
});

// Schema validation cho query payment status
const paymentStatusSchema = Joi.object({
    order_id: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .required()
        .messages({
            'any.required': 'Order ID là bắt buộc',
            'any.invalid': 'Order ID không hợp lệ'
        })
});

// Schema validation cho pagination
const paginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .optional()
        .default(1)
        .messages({
            'number.base': 'Page phải là số',
            'number.integer': 'Page phải là số nguyên',
            'number.min': 'Page phải lớn hơn 0'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .messages({
            'number.base': 'Limit phải là số',
            'number.integer': 'Limit phải là số nguyên',
            'number.min': 'Limit phải lớn hơn 0',
            'number.max': 'Limit không được vượt quá 100'
        })
});

// Schema validation cho statistics query
const statisticsSchema = Joi.object({
    start_date: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date phải là ngày hợp lệ'
        }),

    end_date: Joi.date()
        .optional()
        .min(Joi.ref('start_date'))
        .messages({
            'date.base': 'End date phải là ngày hợp lệ',
            'date.min': 'End date phải sau start date'
        })
});

/**
 * Validate tạo payment request
 */
export const validateCreatePayment = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = createPaymentSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    req.body = value;
    next();
};

/**
 * Validate payment status query
 */
export const validatePaymentStatus = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = paymentStatusSchema.validate(req.params, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    req.params = value;
    next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = paginationSchema.validate(req.query, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Tham số phân trang không hợp lệ',
            errors: error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    req.query = { ...req.query, ...value };
    next();
};

/**
 * Validate statistics query parameters
 */
export const validateStatistics = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = statisticsSchema.validate(req.query, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Tham số thống kê không hợp lệ',
            errors: error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    req.query = { ...req.query, ...value };
    next();
};

/**
 * Validate VNPay callback parameters
 */
export const validateVNPayCallback = (req: Request, res: Response, next: NextFunction) => {
    const requiredParams = [
        'vnp_Amount',
        'vnp_BankCode',
        'vnp_OrderInfo',
        'vnp_ResponseCode',
        'vnp_TxnRef',
        'vnp_SecureHash'
    ];

    const missingParams = requiredParams.filter(param => !req.query[param]);

    if (missingParams.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu tham số bắt buộc từ VNPay',
            missing_params: missingParams
        });
    }

    next();
};

/**
 * Middleware để log VNPay requests
 */
export const vnpayRequestLogger = (req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/vnpayment/')) {
        console.log('VNPay Request:', {
            method: req.method,
            path: req.path,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            body: Object.keys(req.body).length > 0 ? req.body : undefined,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

/**
 * Rate limiting cho VNPay endpoints
 */
export const vnpayRateLimit = (req: Request, res: Response, next: NextFunction) => {
    // Implement rate limiting logic here if needed
    // For now, just pass through
    next();
};