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
    override_type: Joi.string()
        .valid('unavailable', 'custom_hours', 'extended_break')
        .required()
        .messages({
            'any.only': 'Override type must be unavailable, custom_hours, or extended_break',
            'any.required': 'Override type is required'
        }),
    custom_start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .when('override_type', {
            is: 'custom_hours',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.pattern.base': 'Custom start time must be in HH:mm format (24-hour)',
            'any.required': 'Custom start time is required for custom_hours override'
        }),
    custom_end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .when('override_type', {
            is: 'custom_hours',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.pattern.base': 'Custom end time must be in HH:mm format (24-hour)',
            'any.required': 'Custom end time is required for custom_hours override'
        }),
    custom_breaks: Joi.array()
        .items(breakSchema)
        .optional()
        .messages({
            'array.base': 'Custom breaks must be an array'
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
    // Validate custom working hours and breaks for custom_hours type
    if (value.override_type === 'custom_hours') {
        if (!value.custom_start_time || !value.custom_end_time) {
            return helpers.error('any.invalid', {
                message: 'Custom start time and end time are required for custom_hours override'
            });
        }

        const startTime = value.custom_start_time.split(':').map(Number);
        const endTime = value.custom_end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            return helpers.error('any.invalid', {
                message: 'Custom start time must be before custom end time'
            });
        }

        // Validate custom breaks
        if (value.custom_breaks && value.custom_breaks.length > 0) {
            for (const breakTime of value.custom_breaks) {
                const breakStartTime = breakTime.start_time.split(':').map(Number);
                const breakEndTime = breakTime.end_time.split(':').map(Number);

                const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                if (breakStartMinutes >= breakEndMinutes) {
                    return helpers.error('any.invalid', {
                        message: 'Break start time must be before break end time'
                    });
                }

                if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                    return helpers.error('any.invalid', {
                        message: 'Break time must be within custom working hours'
                    });
                }
            }
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
    override_type: Joi.string()
        .valid('unavailable', 'custom_hours', 'extended_break')
        .optional()
        .messages({
            'any.only': 'Override type must be unavailable, custom_hours, or extended_break'
        }),
    custom_start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'Custom start time must be in HH:mm format (24-hour)'
        }),
    custom_end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'Custom end time must be in HH:mm format (24-hour)'
        }),
    custom_breaks: Joi.array()
        .items(breakSchema)
        .optional()
        .messages({
            'array.base': 'Custom breaks must be an array'
        }),
    reason: Joi.string()
        .optional()
        .messages({
            'string.base': 'Reason must be a string'
        }),
    is_active: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_active must be true or false'
        })
}).custom((value, helpers) => {
    // Validate custom working hours and breaks if provided
    if (value.override_type === 'custom_hours' ||
        (value.custom_start_time && value.custom_end_time)) {

        if (value.custom_start_time && value.custom_end_time) {
            const startTime = value.custom_start_time.split(':').map(Number);
            const endTime = value.custom_end_time.split(':').map(Number);

            const startMinutes = startTime[0] * 60 + startTime[1];
            const endMinutes = endTime[0] * 60 + endTime[1];

            if (startMinutes >= endMinutes) {
                return helpers.error('any.invalid', {
                    message: 'Custom start time must be before custom end time'
                });
            }

            // Validate custom breaks
            if (value.custom_breaks && value.custom_breaks.length > 0) {
                for (const breakTime of value.custom_breaks) {
                    const breakStartTime = breakTime.start_time.split(':').map(Number);
                    const breakEndTime = breakTime.end_time.split(':').map(Number);

                    const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
                    const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

                    if (breakStartMinutes >= breakEndMinutes) {
                        return helpers.error('any.invalid', {
                            message: 'Break start time must be before break end time'
                        });
                    }

                    if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                        return helpers.error('any.invalid', {
                            message: 'Break time must be within custom working hours'
                        });
                    }
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