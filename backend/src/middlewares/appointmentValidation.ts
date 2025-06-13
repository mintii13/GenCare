import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Simplified validation - chỉ validate format, logic business rules sẽ handle ở service layer
const bookAppointmentSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
        }),
    appointment_date: Joi.date()
        .required()
        .messages({
            'date.base': 'Appointment date must be a valid date',
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
});

const updateAppointmentSchema = Joi.object({
    appointment_date: Joi.date()
        .optional()
        .messages({
            'date.base': 'Appointment date must be a valid date'
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

    // Basic business rule validation here
    const { start_time, end_time } = req.body;

    // Check start_time < end_time
    const startTime = start_time.split(':').map(Number);
    const endTime = end_time.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: 'Start time must be before end time'
        });
        return;
    }

    // Check duration
    const duration = endMinutes - startMinutes;
    if (duration < 15) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: 'Appointment duration must be at least 15 minutes'
        });
        return;
    }

    if (duration > 240) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: 'Appointment duration cannot exceed 4 hours'
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

    // Basic validation for time if provided
    const { start_time, end_time } = req.body;

    if (start_time && end_time) {
        const startTime = start_time.split(':').map(Number);
        const endTime = end_time.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                details: 'Start time must be before end time'
            });
            return;
        }
    }

    if ((start_time && !end_time) || (!start_time && end_time)) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: 'Both start_time and end_time are required when updating appointment time'
        });
        return;
    }

    next();
};