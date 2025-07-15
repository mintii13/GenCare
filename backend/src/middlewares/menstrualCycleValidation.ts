import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';

export const menstrualCycleSchema = Joi.object({
    period_days: Joi.array()
    .items(
        Joi.string().required().custom((value, helpers) => {
            if (dayjs(value).isAfter(dayjs())) {
                return helpers.error('date.future');
            }
            return value;
        })
    )
    .min(1)
    .required()
    .messages({
        'array.base': 'period_days phải là một mảng',
        'array.empty': 'Cần có ít nhất một ngày kinh nguyệt',
        'array.min': 'Cần có ít nhất một ngày kinh nguyệt',
        'any.required': 'period_days là bắt buộc',
        'date.future': 'Không được chọn ngày trong tương lai'
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
