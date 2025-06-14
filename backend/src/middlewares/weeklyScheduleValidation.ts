import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const workingDaySchema = Joi.object({
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
        .default(true)
        .messages({
            'boolean.base': 'is_available must be true or false'
        })
});

const createWeeklyScheduleSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional() // Will be resolved in controller
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId'
        }),
    week_start_date: Joi.date()
        .required()
        .messages({
            'date.base': 'Week start date must be a valid date',
            'any.required': 'Week start date is required'
        }),
    working_days: Joi.object({
        monday: workingDaySchema.optional(),
        tuesday: workingDaySchema.optional(),
        wednesday: workingDaySchema.optional(),
        thursday: workingDaySchema.optional(),
        friday: workingDaySchema.optional(),
        saturday: workingDaySchema.optional(),
        sunday: workingDaySchema.optional()
    }).optional().messages({
        'object.base': 'Working days must be an object'
    }),
    default_slot_duration: Joi.number()
        .integer()
        .min(15)
        .max(120)
        .default(30)
        .messages({
            'number.base': 'Default slot duration must be a number',
            'number.integer': 'Default slot duration must be an integer',
            'number.min': 'Default slot duration must be at least 15 minutes',
            'number.max': 'Default slot duration must be at most 120 minutes'
        }),
    notes: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        }),
    created_by: Joi.object({
        user_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        role: Joi.string().valid('consultant', 'staff', 'admin'),
        name: Joi.string()
    }).optional() // Will be added in controller
}).custom((value, helpers) => {
    // Validate working hours and breaks
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const workingDay = value.working_days?.[day];
        if (!workingDay) continue;

        const startTime = workingDay.start_time.split(':').map(Number);
        const endTime = workingDay.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            return helpers.error('any.invalid', { message: `${day}: Start time must be before end time` });
        }

        // Validate break time
        if (workingDay.break_start && workingDay.break_end) {
            const breakStartTime = workingDay.break_start.split(':').map(Number);
            const breakEndTime = workingDay.break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                return helpers.error('any.invalid', { message: `${day}: Break start time must be before break end time` });
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                return helpers.error('any.invalid', { message: `${day}: Break time must be within working hours` });
            }
        } else if ((workingDay.break_start && !workingDay.break_end) || (!workingDay.break_start && workingDay.break_end)) {
            return helpers.error('any.invalid', { message: `${day}: Both break start and end time are required if break is specified` });
        }
    }

    return value;
});

const updateWeeklyScheduleSchema = Joi.object({
    week_start_date: Joi.date()
        .optional()
        .messages({
            'date.base': 'Week start date must be a valid date'
        }),
    working_days: Joi.object({
        monday: workingDaySchema.optional(),
        tuesday: workingDaySchema.optional(),
        wednesday: workingDaySchema.optional(),
        thursday: workingDaySchema.optional(),
        friday: workingDaySchema.optional(),
        saturday: workingDaySchema.optional(),
        sunday: workingDaySchema.optional()
    }).optional().messages({
        'object.base': 'Working days must be an object'
    }),
    default_slot_duration: Joi.number()
        .integer()
        .min(15)
        .max(120)
        .optional()
        .messages({
            'number.base': 'Default slot duration must be a number',
            'number.integer': 'Default slot duration must be an integer',
            'number.min': 'Default slot duration must be at least 15 minutes',
            'number.max': 'Default slot duration must be at most 120 minutes'
        }),
    notes: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
}).unknown(true).custom((value, helpers) => {
    // Validate working hours and breaks if provided
    if (value.working_days) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        for (const day of days) {
            const workingDay = value.working_days[day];
            if (!workingDay) continue;

            const startTime = workingDay.start_time.split(':').map(Number);
            const endTime = workingDay.end_time.split(':').map(Number);

            const startMinutes = startTime[0] * 60 + startTime[1];
            const endMinutes = endTime[0] * 60 + endTime[1];

            if (startMinutes >= endMinutes) {
                return helpers.error('any.invalid', { message: `${day}: Start time must be before end time` });
            }

            // Validate break time
            if (workingDay.break_start && workingDay.break_end) {
                const breakStartTime = workingDay.break_start.split(':').map(Number);
                const breakEndTime = workingDay.break_end.split(':').map(Number);

                const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                if (breakStartMinutes >= breakEndMinutes) {
                    return helpers.error('any.invalid', { message: `${day}: Break start time must be before break end time` });
                }

                if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                    return helpers.error('any.invalid', { message: `${day}: Break time must be within working hours` });
                }
            } else if ((workingDay.break_start && !workingDay.break_end) || (!workingDay.break_start && workingDay.break_end)) {
                return helpers.error('any.invalid', { message: `${day}: Both break start and end time are required if break is specified` });
            }
        }
    }

    return value;
});

export const validateCreateWeeklySchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = createWeeklyScheduleSchema.validate(req.body);

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

export const validateUpdateWeeklySchedule = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateWeeklyScheduleSchema.validate(req.body);

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