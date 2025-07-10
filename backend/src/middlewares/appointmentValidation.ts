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
            message: 'Dữ liệu không hợp lệ',
            details: error.details[0].message
        });
        return;
    }

    // Convert string date to Date object if needed
    if (req.body.appointment_date && typeof req.body.appointment_date === 'string') {
        try {
            req.body.appointment_date = new Date(req.body.appointment_date);
            
            // Check if the parsed date is valid
            if (isNaN(req.body.appointment_date.getTime())) {
                res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    details: 'Invalid appointment date format'
                });
                return;
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                details: 'Failed to parse appointment date'
            });
            return;
        }
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
                message: 'Dữ liệu không hợp lệ',
                details: 'Start time must be before end time'
            });
            return;
        }
    }

    if ((start_time && !end_time) || (!start_time && end_time)) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: 'Both start_time and end_time are required when updating appointment time'
        });
        return;
    }

    next();
};


const appointmentSchema = Joi.object({
    consultant_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid consultant ID format',
            'any.required': 'Consultant ID is required'
        }),
    appointment_date: Joi.date()
        .min('now')
        .required()
        .messages({
            'date.min': 'Appointment date cannot be in the past',
            'any.required': 'Appointment date is required'
        }),
    start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format',
            'any.required': 'Start time is required'
        }),
    end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format',
            'any.required': 'End time is required'
        }),
    customer_notes: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Customer notes cannot exceed 500 characters'
        })
});

export const validateAppointmentCreation = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = appointmentSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }

    // Validate that start_time is before end_time
    const { start_time, end_time } = req.body;
    if (start_time && end_time) {
        const startMinutes = start_time.split(':').map(Number);
        const endMinutes = end_time.split(':').map(Number);

        const startTotal = startMinutes[0] * 60 + startMinutes[1];
        const endTotal = endMinutes[0] * 60 + endMinutes[1];

        if (startTotal >= endTotal) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                details: 'Start time must be before end time'
            });
            return;
        }
    }

    next();
};

const updateAppointmentSchema = Joi.object({
    appointment_date: Joi.alternatives()
        .try(
            Joi.date(),
            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
        )
        .optional()
        .messages({
            'alternatives.match': 'Appointment date must be a valid date or YYYY-MM-DD format'
        }),
    start_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'Start time must be in HH:mm format'
        }),
    end_time: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
        .messages({
            'string.pattern.base': 'End time must be in HH:mm format'
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
        }),
    googleAccessToken: Joi.string().optional(),
    explicitAction: Joi.string().valid('confirmed', 'rescheduled', 'cancelled', 'completed').optional()
});

export const validateAppointmentUpdate = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = updateAppointmentSchema.validate(req.body);

    if (error) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
        return;
    }

    // Validate time relationship if both are provided
    const { start_time, end_time } = req.body;
    if (start_time && end_time) {
        const startMinutes = start_time.split(':').map(Number);
        const endMinutes = end_time.split(':').map(Number);

        const startTotal = startMinutes[0] * 60 + startMinutes[1];
        const endTotal = endMinutes[0] * 60 + endMinutes[1];

        if (startTotal >= endTotal) {
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

const feedbackSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
            'number.base': 'Rating must be a number',
            'number.integer': 'Rating must be an integer',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating must be at most 5',
            'any.required': 'Rating is required'
        }),
    comment: Joi.string()
        .max(1000)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Comment cannot exceed 1000 characters'
        })
});

export const validateFeedback = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = feedbackSchema.validate(req.body);

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