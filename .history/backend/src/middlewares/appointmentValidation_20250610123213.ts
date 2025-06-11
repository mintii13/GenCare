import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const bookAppointmentSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
        }),
    appointment_date: Joi.date()
        .min('now')
        .required()
        .messages({
            'date.base': 'Appointment date must be a valid date',
            'date.min': 'Appointment date cannot be in the past',
            'any.required': 'Appointment date is required'
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
    customer_notes: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Customer notes cannot exceed 500 characters'
        })
}).custom((value, helpers) => {
    // Validate that start_time is before end_time
    const startTime = value.start_time.split(':').map(Number);
    const endTime = value.end_time.split(':').map(Number);

    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
        return helpers.error('any.invalid', {
            message: 'Start time must be before end time'
        });
    }

    // Validate minimum duration (15 minutes)
    const duration = endMinutes - startMinutes;
    if (duration < 15) {
        return helpers.error('any.invalid', {
            message: 'Appointment duration must be at least 15 minutes'
        });
    }

    // Validate maximum duration (4 hours = 240 minutes)
    if (duration > 240) {
        return helpers.error('any.invalid', {
            message: 'Appointment duration cannot exceed 4 hours'
        });
    }

    return value;
});

const updateAppointmentSchema = Joi.object({
    appointment_date: Joi.date()
        .min('now')
        .optional()
        .messages({
            'date.base': 'Appointment date must be a valid date',
            'date.min': 'Appointment date cannot be in the past'
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
    status: Joi.string()
        .valid('pending', 'confirmed', 'cancelled', 'completed')
        .optional()
        .messages({
            'any.only': 'Status must be one of: pending, confirmed, cancelled, completed'
        }),
    customer_notes: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Customer notes cannot exceed 500 characters'
        }),
    consultant_notes: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Consultant notes cannot exceed 500 characters'
        })
}).custom((value, helpers) => {
    // If both start_time and end_time are provided, validate them
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

        // Validate minimum duration (15 minutes)
        const duration = endMinutes - startMinutes;
        if (duration < 15) {
            return helpers.error('any.invalid', {
                message: 'Appointment duration must be at least 15 minutes'
            });
        }

        // Validate maximum duration (4 hours = 240 minutes)
        if (duration > 240) {
            return helpers.error('any.invalid', {
                message: 'Appointment duration cannot exceed 4 hours'
            });
        }
    }

    // If only one time is provided, require both
    if ((value.start_time && !value.end_time) || (!value.start_time && value.end_time)) {
        return helpers.error('any.invalid', {
            message: 'Both start_time and end_time are required when updating appointment time'
        });
    }

    return value;
});

export const validateBookAppointment = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = bookAppointmentSchema.validate(req.body);

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

export const validateUpdateAppointment = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateAppointmentSchema.validate(req.body);

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