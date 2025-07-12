import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const menstrualCycleSchema = Joi.object({
    period_days: Joi.array()
        .items(Joi.string().isoDate().required())
        .min(1)
        .max(10)
        .required()
        .messages({
            'array.base': 'period_days phải là một mảng',
            'array.empty': 'Cần có ít nhất một ngày kinh nguyệt',
            'array.min': 'Cần có ít nhất một ngày kinh nguyệt',
            'array.max': 'Không được vượt quá 10 ngày kinh nguyệt',
            'any.required': 'period_days là bắt buộc',
            'string.isoDate': 'Định dạng ngày không hợp lệ (cần ISO date format)'
        }),
    notes: Joi.string().optional().messages({
        'string.max': 'Ghi chú không được vượt quá 3000 ký tự'
    })
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