import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const createOverridedScheduleSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional() // Will be resolved in controller
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId'
        }),
    override_date: Joi.date()
        .required()
        .messages({
            'date.base': 'Override date must be a valid date',
            'any.required': 'Override date is required'
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
    reason: Joi.string()
        .required()
        .messages({
            'string.base': 'Reason must be a string',
            'any.required': 'Reason is required'
        }),
    created_by: Joi.object({
        user_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        role: Joi.string().valid('consultant', 'staff', 'admin'),
        name: Joi.string()
    }).optional() // Will be added in controller
}).custom((value, helpers) => {
    // Validate working hours - nếu có start_time thì phải có end_time
    if ((value.start_time && !value.end_time) || (!value.start_time && value.end_time)) {
        return helpers.error('any.invalid', {
            message: 'Both start time and end time are required if working hours are specified'
        });
    }

    // Validate time order
    if (value.start_time && value.end_time) {
        const startTime = value.start_time.split(':').map(Number);
        const endTime = value.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            return helpers.error('any.invalid', {
                message: 'Start time must be before end time'
            });
        }

        // Validate break time
        if (value.break_start && value.break_end) {
            const breakStartTime = value.break_start.split(':').map(Number);
            const breakEndTime = value.break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                return helpers.error('any.invalid', {
                    message: 'Break start time must be before break end time'
                });
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                return helpers.error('any.invalid', {
                    message: 'Break time must be within working hours'
                });
            }
        } else if ((value.break_start && !value.break_end) || (!value.break_start && value.break_end)) {
            return helpers.error('any.invalid', {
                message: 'Both break start and end time are required if break is specified'
            });
        }
    }

    return value;
});

const updateOverridedScheduleSchema = Joi.object({
    override_date: Joi.date()
        .optional()
        .messages({
            'date.base': 'Override date must be a valid date'
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
    reason: Joi.string()
        .optional()
        .messages({
            'string.base': 'Reason must be a string'
        })
}).custom((value, helpers) => {
    // Validate working hours if provided
    if ((value.start_time && !value.end_time) || (!value.start_time && value.end_time)) {
        return helpers.error('any.invalid', {
            message: 'Both start time and end time are required if working hours are specified'
        });
    }

    if (value.start_time && value.end_time) {
        const startTime = value.start_time.split(':').map(Number);
        const endTime = value.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            return helpers.error('any.invalid', {
                message: 'Start time must be before end time'
            });
        }

        // Validate break time
        if (value.break_start && value.break_end) {
            const breakStartTime = value.break_start.split(':').map(Number);
            const breakEndTime = value.break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                return helpers.error('any.invalid', {
                    message: 'Break start time must be before break end time'
                });
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                return helpers.error('any.invalid', {
                    message: 'Break time must be within working hours'
                });
            }
        } else if ((value.break_start && !value.break_end) || (!value.break_start && value.break_end)) {
            return helpers.error('any.invalid', {
                message: 'Both break start and end time are required if break is specified'
            });
        }
    }

    return value;
});

export const validateCreateOverridedSchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createOverridedScheduleSchema.validate(req.body);

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

export const validateUpdateOverridedSchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateOverridedScheduleSchema.validate(req.body);

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