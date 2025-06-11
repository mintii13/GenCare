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
    breaks: Joi.array().items(
        Joi.object({
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
        })
    ).optional(),
    is_available: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'is_available must be true or false'
        })
});

const createWeeklyScheduleSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
        }),
    template_name: Joi.string()
        .required()
        .messages({
            'any.required': 'Template name is required'
        }),
    working_days: Joi.object({
        monday: workingDaySchema,
        tuesday: workingDaySchema,
        wednesday: workingDaySchema,
        thursday: workingDaySchema,
        friday: workingDaySchema,
        saturday: workingDaySchema,
        sunday: workingDaySchema
    }).required().messages({
        'any.required': 'Working days are required'
    }),
    default_slot_duration: Joi.number()
        .integer()
        .min(15)
        .max(120)
        .default(60)
        .messages({
            'number.base': 'Default slot duration must be a number',
            'number.integer': 'Default slot duration must be an integer',
            'number.min': 'Default slot duration must be at least 15 minutes',
            'number.max': 'Default slot duration must be at most 120 minutes'
        }),
    effective_from: Joi.date()
        .required()
        .messages({
            'date.base': 'Effective from must be a valid date',
            'any.required': 'Effective from is required'
        }),
    effective_to: Joi.date()
        .min(Joi.ref('effective_from'))
        .optional()
        .messages({
            'date.base': 'Effective to must be a valid date',
            'date.min': 'Effective to must be after effective from'
        }),
    is_active: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'is_active must be true or false'
        })
}).custom((value, helpers) => {
    // Validate working hours and breaks
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

        // Validate breaks
        if (workingDay.breaks) {
            for (const breakTime of workingDay.breaks) {
                const breakStartTime = breakTime.start_time.split(':').map(Number);
                const breakEndTime = breakTime.end_time.split(':').map(Number);

                const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                if (breakStartMinutes >= breakEndMinutes) {
                    return helpers.error('any.invalid', { message: `${day}: Break start time must be before break end time` });
                }

                if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                    return helpers.error('any.invalid', { message: `${day}: Break time must be within working hours` });
                }
            }
        }
    }

    return value;
});

const updateWeeklyScheduleSchema = Joi.object({
    template_name: Joi.string()
        .optional()
        .messages({
            'string.base': 'Template name must be a string'
        }),
    working_days: Joi.object({
        monday: workingDaySchema,
        tuesday: workingDaySchema,
        wednesday: workingDaySchema,
        thursday: workingDaySchema,
        friday: workingDaySchema,
        saturday: workingDaySchema,
        sunday: workingDaySchema
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
    effective_from: Joi.date()
        .optional()
        .messages({
            'date.base': 'Effective from must be a valid date'
        }),
    effective_to: Joi.date()
        .min(Joi.ref('effective_from'))
        .optional()
        .messages({
            'date.base': 'Effective to must be a valid date',
            'date.min': 'Effective to must be after effective from'
        }),
    is_active: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_active must be true or false'
        })
}).custom((value, helpers) => {
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

            // Validate breaks
            if (workingDay.breaks) {
                for (const breakTime of workingDay.breaks) {
                    const breakStartTime = breakTime.start_time.split(':').map(Number);
                    const breakEndTime = breakTime.end_time.split(':').map(Number);

                    const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                    const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                    if (breakStartMinutes >= breakEndMinutes) {
                        return helpers.error('any.invalid', { message: `${day}: Break start time must be before break end time` });
                    }

                    if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                        return helpers.error('any.invalid', { message: `${day}: Break time must be within working hours` });
                    }
                }
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