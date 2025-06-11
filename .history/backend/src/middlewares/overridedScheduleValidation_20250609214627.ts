import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const breakSchema = Joi.object({
    start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Break start time must be in HH:mm format (24-hour)',
            'any.required': 'Break start time is required'
        }),
    end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Break end time must be in HH:mm format (24-hour)',
            'any.required': 'Break end time is required'
        }),
    reason: Joi.string().optional()
});

const createOverridedScheduleSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
        }),
    date: Joi.date()
        .required()
        .messages({
            'date.base': 'Date must be a valid date',
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
    breaks: Joi.array()
        .items(breakSchema)
        .optional()
        .messages({
            'array.base': 'Breaks must be an array'
        }),
    slot_duration: Joi.number()
        .integer()
        .min(15)
        .max(120)
        .default(60)
        .messages({
            'number.base': 'Slot duration must be a number',
            'number.integer': 'Slot duration must be an integer',
            'number.min': 'Slot duration must be at least 15 minutes',
            'number.max': 'Slot duration must be at most 120 minutes'
        }),
    is_available: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'is_available must be true or false'
        }),
    reason: Joi.string()
        .optional()
        .messages({
            'string.base': 'Reason must be a string'
        })
}).custom((value, helpers) => {
    // Validate working hours and breaks
    const startTime = value.start_time.split(':').map(Number);
    const endTime = value.end_time.split(':').map(Number);

    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
        return helpers.error('any.invalid', { message: 'Start time must be before end time' });
    }

    // Validate breaks
    if (value.breaks) {
        for (const breakTime of value.breaks) {
            const breakStartTime = breakTime.start_time.split(':').map(Number);
            const breakEndTime = breakTime.end_time.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                return helpers.error('any.invalid', { message: 'Break start time must be before break end time' });
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                return helpers.error('any.invalid', { message: 'Break time must be within working hours' });
            }
        }
    }

    return value;
});

const updateOverridedScheduleSchema = Joi.object({
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
    breaks: Joi.array()
        .items(breakSchema)
        .optional()
        .messages({
            'array.base': 'Breaks must be an array'
        }),
    slot_duration: Joi.number()
        .integer()
        .min(15)
        .max(120)
        .optional()
        .messages({
            'number.base': 'Slot duration must be a number',
            'number.integer': 'Slot duration must be an integer',
            'number.min': 'Slot duration must be at least 15 minutes',
            'number.max': 'Slot duration must be at most 120 minutes'
        }),
    is_available: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_available must be true or false'
        }),
    reason: Joi.string()
        .optional()
        .messages({
            'string.base': 'Reason must be a string'
        })
}).custom((value, helpers) => {
    // Validate working hours and breaks if provided
    if (value.start_time && value.end_time) {
        const startTime = value.start_time.split(':').map(Number);
        const endTime = value.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            return helpers.error('any.invalid', { message: 'Start time must be before end time' });
        }

        // Validate breaks
        if (value.breaks) {
            for (const breakTime of value.breaks) {
                const breakStartTime = breakTime.start_time.split(':').map(Number);
                const breakEndTime = breakTime.end_time.split(':').map(Number);

                const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                if (breakStartMinutes >= breakEndMinutes) {
                    return helpers.error('any.invalid', { message: 'Break start time must be before break end time' });
                }

                if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                    return helpers.error('any.invalid', { message: 'Break time must be within working hours' });
                }
            }
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