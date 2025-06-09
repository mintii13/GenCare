import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const createScheduleSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
        }),
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required'
        }),
    start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format (24-hour)',
            'any.required': 'Start time is required'
        }),
    end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format (24-hour)',
            'any.required': 'End time is required'
        }),
    break_start: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Break start time must be in HH:mm format (24-hour)'
        }),
    break_end: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Break end time must be in HH:mm format (24-hour)'
        }),
    is_available: Joi.boolean()
        .optional()
        .default(true)
        .messages({
            'boolean.base': 'is_available must be true or false'
        })
}).custom((value, helpers) => {
    // Validate that date is not in the past
    const scheduleDate = new Date(value.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
        return helpers.error('any.invalid', { message: 'Cannot create schedule for past dates' });
    }

    // Validate start_time < end_time
    const startTime = value.start_time.split(':').map(Number);
    const endTime = value.end_time.split(':').map(Number);

    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
        return helpers.error('any.invalid', { message: 'Start time must be before end time' });
    }

    // Validate break time if provided
    if (value.break_start && value.break_end) {
        const breakStartTime = value.break_start.split(':').map(Number);
        const breakEndTime = value.break_end.split(':').map(Number);

        const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
        const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

        if (breakStartMinutes >= breakEndMinutes) {
            return helpers.error('any.invalid', { message: 'Break start time must be before break end time' });
        }

        if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
            return helpers.error('any.invalid', { message: 'Break time must be within working hours' });
        }
    } else if ((value.break_start && !value.break_end) || (!value.break_start && value.break_end)) {
        return helpers.error('any.invalid', { message: 'Both break start and end time are required if break is specified' });
    }

    return value;
});

const updateScheduleSchema = Joi.object({
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format'
        }),
    start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format (24-hour)'
        }),
    end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format (24-hour)'
        }),
    break_start: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Break start time must be in HH:mm format (24-hour)'
        }),
    break_end: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Break end time must be in HH:mm format (24-hour)'
        }),
    is_available: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_available must be true or false'
        })
});

const getScheduleQuerySchema = Joi.object({
    start_date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
        }),
    end_date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'End date must be in YYYY-MM-DD format'
        }),
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId'
        })
});

const getAvailabilityQuerySchema = Joi.object({
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format',
            'any.required': 'Date is required'
        })
});

export const validateCreateSchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createScheduleSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }
    next();
};

export const validateUpdateSchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateScheduleSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }
    next();
};

export const validateGetScheduleQuery = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = getScheduleQuerySchema.validate(req.query);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }
    next();
};

export const validateGetAvailabilityQuery = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = getAvailabilityQuerySchema.validate(req.query);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }
    next();
};