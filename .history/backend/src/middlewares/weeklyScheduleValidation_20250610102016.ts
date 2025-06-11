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
        .required()
        .messages({
            'string.pattern.base': 'Consultant ID must be a valid ObjectId',
            'any.required': 'Consultant ID is required'
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
        })
});

const updateWeeklyScheduleSchema = Joi.object({
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
        })
});