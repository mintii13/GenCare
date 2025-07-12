import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const menstrualCycleSchema = Joi.object({
    period_days: Joi.array()
        .items(
            Joi.string()
                .pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) // Định dạng YYYY-MM-DD
                .required()
                .messages({
                    'string.pattern.base': 'Ngày phải có định dạng YYYY-MM-DD',
                })
        )
        .min(1)
        .max(10)
        .required()
        .messages({
            'array.base': 'period_days phải là một mảng',
            'array.empty': 'Cần có ít nhất một ngày kinh nguyệt',
            'array.min': 'Cần có ít nhất một ngày kinh nguyệt',
            'array.max': 'Không được vượt quá 10 ngày kinh nguyệt',
            'any.required': 'period_days là bắt buộc',
        }),
    notes: Joi.string().optional().messages({
        'string.max': 'Ghi chú không được vượt quá 500 ký tự',
    }),
});

export const validateMenstrualCycle = (req: Request, res: Response, next: NextFunction) => {
    const { error } = menstrualCycleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(err => err.message)
      });
    }
    next();
}
