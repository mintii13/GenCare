import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email is invalid',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    })
});

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { error } = loginSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data',
            details: error.details[0].message
        });
    }
    next();
};

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email is invalid',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match password',
        'any.required': 'Password confirmation is required'
    }),
    full_name: Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀ-ỹ\s]+$/)
        .required()
        .messages({
            'string.min': 'Full name must be at least 2 characters',
            'string.max': 'Full name cannot exceed 100 characters',
            'string.pattern.base': 'Full name can only contain letters and spaces',
            'any.required': 'Full name is required'
        }),
    phone: Joi.string()
        .pattern(/^(\+84|0)[3-9]\d{8}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number is not in correct format (e.g.: 0987654321 or +84987654321)',
        }),
    date_of_birth: Joi.date()
        .max('now')
        .min('1900-01-01')
        .iso()
        .optional()
        .messages({
            'date.max': 'Date of birth cannot be in the future',
            'date.min': 'Date of birth is invalid',
            'date.base': 'Date of birth must be in valid format (YYYY-MM-DD)'
        }),
    gender: Joi.string()
        .valid('male', 'female', 'other')
        .optional()
        .messages({
            'any.only': 'Gender must be male, female or other'
        })
});

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid data',
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
            'string.min': 'Title must be at least 5 characters',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),
    content: Joi.string()
        .min(10)
        .required()
        .messages({
            'string.min': 'Content must be at least 10 characters',
            'any.required': 'Content is required'
        })
});

export const validateCreateBlog = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createBlogSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid data',
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
            'string.min': 'Comment content cannot be empty',
            'string.max': 'Comment content cannot exceed 1000 characters',
            'any.required': 'Comment content is required'
        }),
    is_anonymous: Joi.boolean()
        .optional()
        .default(false)
        .messages({
            'boolean.base': 'is_anonymous must be true or false'
        }),
    parent_comment_id: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Parent comment ID must be a string'
        })
});

export const validateCreateBlogComment = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createBlogCommentSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid data',
            details: error.details[0].message
        });
        return;
    }
    next();
};