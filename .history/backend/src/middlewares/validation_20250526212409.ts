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