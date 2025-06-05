import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const getBlogCommentsSchema = Joi.object({
    blogId: Joi.number().integer().min(1).required().messages({
        'number.base': 'Blog ID phải là số',
        'number.integer': 'Blog ID phải là số nguyên',
        'number.min': 'Blog ID phải lớn hơn 0',
        'any.required': 'Blog ID là bắt buộc'
    })
});

export const validateGetBlogComments = (req: Request, res: Response, next: NextFunction) => {
    const { error } = getBlogCommentsSchema.validate({ blogId: parseInt(req.params.blogId) });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
    }
    next();
};