import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const menstrualCycleSchema = Joi.object({
    notes: Joi.string().max(500).optional().messages({
        'string.max': 'Ghi chú không được vượt quá 500 ký tự'
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