import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
    })
});

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { error } = loginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
    }
    next();
};

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
    }),
    confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password phải trùng với password',
        'any.required': 'Xác nhận mật khẩu là bắt buộc'
    }),
    full_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ỹ\s]+$/)
        .required()
        .messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được quá 100 ký tự',
            'string.pattern.base': 'Họ tên chỉ được chứa chữ cái và khoảng trắng',
            'any.required': 'Họ tên là bắt buộc'
        }),
    phone: Joi.string()
        .pattern(/^(\+84|0)[3-9]\d{8}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Số điện thoại không đúng định dạng (VD: 0987654321 hoặc +84987654321)',
        }),
    date_of_birth: Joi.date()
        .max('now')
        .min('1900-01-01')
        .iso()
        .optional()
        .messages({
            'date.max': 'Ngày sinh không thể trong tương lai',
            'date.min': 'Ngày sinh không hợp lệ',
            'date.base': 'Ngày sinh phải có định dạng hợp lệ (YYYY-MM-DD)'
        }),
    gender: Joi.string()
        .valid('male', 'female', 'other')
        .optional()
        .messages({
            'any.only': 'Giới tính phải là male, female hoặc other'
        })
});

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
        return;
    }
    next();
};

// Schema validation cho createBlog
const createBlogSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
            'string.max': 'Tiêu đề không được quá 200 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    content: Joi.string()
        .min(10)
        .required()
        .messages({
            'string.min': 'Nội dung phải có ít nhất 10 ký tự',
            'any.required': 'Nội dung là bắt buộc'
        })
});

export const validateCreateBlog = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createBlogSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
        return;
    }
    next();
};

// Schema validation cho createBlogComment
const createBlogCommentSchema = Joi.object({
    content: Joi.string()
        .min(1)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Nội dung comment không được để trống',
            'string.max': 'Nội dung comment không được quá 1000 ký tự',
            'any.required': 'Nội dung comment là bắt buộc'
        }),
    is_anonymous: Joi.boolean()
        .optional()
        .default(false)
        .messages({
            'boolean.base': 'is_anonymous phải là true hoặc false'
        }),
    parent_comment_id: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Parent comment ID phải là chuỗi'
        })
});

export const validateCreateBlogComment = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createBlogCommentSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
        return;
    }
    next();
};