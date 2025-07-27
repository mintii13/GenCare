import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';

/**
 * Middleware to validate and group menstrual cycle period days.
 * It checks if the period_days is an array, normalizes the dates,
 * sorts them, and groups consecutive days together.
 */
export const groupPeriodDays = (req: Request, res: Response, next: NextFunction) => {
    const rawDates = req.body.period_days;
    if (!Array.isArray(rawDates) || rawDates.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'period_days phải là mảng và chứa ít nhất một ngày'
        });
    }

    // Normalize and sort
    const normalized = rawDates.map(dateStr => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${dateStr}`);
        }
        date.setUTCHours(0, 0, 0, 0);
        return date;
    }).sort((a, b) => a.getTime() - b.getTime());

    // Grouping logic
    const groups: Date[][] = [];
    let current: Date[] = [normalized[0]];

    for (let i = 1; i < normalized.length; i++) {
        const currentDate = normalized[i];
        const prevDate = normalized[i - 1];
        const diff = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);

        if (diff === 1) {
            current.push(currentDate);
        } else {
            groups.push(current);
            current = [currentDate];
        }
    }
    groups.push(current);

    for (let i = 0; i < groups.length - 1; i++) {
        const currentStart = groups[i][0];
        const nextStart = groups[i + 1][0];
        const diff = Math.round((nextStart.getTime() - currentStart.getTime()) / 86400000);

        if (diff < 21) {
            return res.status(400).json({
                success: false,
                message: `Khoảng cách giữa chu kỳ ${i + 1} và ${i + 2} phải tối thiểu 21 ngày`
            });
        }
    }
    // Gắn grouped_period_days vào request để service dùng
    req.body.grouped_period_days = groups;

    next();
};

// Schema for daily mood data
const dailyMoodDataSchema = Joi.object({
    mood: Joi.string().valid('happy', 'sad', 'tired', 'excited', 'calm', 'stressed', 'neutral').default('neutral'),
    energy: Joi.string().valid('high', 'medium', 'low').default('medium'),
    symptoms: Joi.array().items(Joi.string()),
    notes: Joi.string().allow('').optional()
});

// Schema for period day with mood data
const periodDaySchema = Joi.object({
    date: Joi.date().required(),
    mood_data: dailyMoodDataSchema.optional()
});

// Schema for mood data structure
const moodDataSchema = Joi.object().pattern(
    Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
    dailyMoodDataSchema
);

// Updated menstrual cycle schema
const menstrualCycleSchema = Joi.object({
    period_days: Joi.array().items(periodDaySchema).min(1).required(),
    mood_data: moodDataSchema.optional() // Keep for backward compatibility
});

// Validation middleware for processing menstrual cycle
export const validateProcessMenstrualCycle = (req: any, res: any, next: any) => {
    const { error } = menstrualCycleSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail: any) => detail.message)
        });
    }
    next();
};

// Validation schemas for mood data operations
const createMoodDataSchema = Joi.object({
    date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
    mood_data: dailyMoodDataSchema.required()
});

const updateMoodDataSchema = Joi.object({
    date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
    mood_data: dailyMoodDataSchema.required()
});

const getMoodDataSchema = Joi.object({
    date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Validation middleware for mood data operations
export const validateCreateMoodData = (req: any, res: any, next: any) => {
    const { error } = createMoodDataSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail: any) => detail.message)
        });
    }
    next();
};

export const validateUpdateMoodData = (req: any, res: any, next: any) => {
    const { error } = updateMoodDataSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail: any) => detail.message)
        });
    }
    next();
};

export const validateGetMoodData = (req: any, res: any, next: any) => {
    const { error } = getMoodDataSchema.validate(req.query);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail: any) => detail.message)
        });
    }
    next();
};

// Legacy schema for backward compatibility
export const legacyMenstrualCycleSchema = Joi.object({
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
    const { error } = legacyMenstrualCycleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(err => err.message)
      });
    }
    next();
};
