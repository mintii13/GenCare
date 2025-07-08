import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const stiAssessmentSchema = Joi.object({
    age: Joi.number().min(13).max(100).required().messages({
        'any.required': 'Tuổi là bắt buộc',
        'number.min': 'Tuổi phải từ 13 trở lên',
        'number.max': 'Tuổi không được quá 100'
    }),

    gender: Joi.string().valid('male', 'female', 'transgender', 'other').required().messages({
        'any.required': 'Giới tính là bắt buộc',
        'any.only': 'Giới tính phải là male, female, transgender hoặc other'
    }),

    is_pregnant: Joi.boolean().optional(),
    pregnancy_trimester: Joi.string().valid('first', 'second', 'third').optional(),

    sexually_active: Joi.string().valid('not_active', 'active_single', 'active_multiple').required().messages({
        'any.required': 'Tình trạng hoạt động tình dục là bắt buộc'
    }),

    sexual_orientation: Joi.string().valid('heterosexual', 'homosexual', 'msm', 'bisexual', 'other').optional(),
    number_of_partners: Joi.string().valid('none', 'one', 'two_to_five', 'multiple').optional(),
    new_partner_recently: Joi.boolean().optional(),
    partner_has_sti: Joi.boolean().optional(),
    condom_use: Joi.string().valid('always', 'sometimes', 'rarely', 'never').optional(),

    previous_sti_history: Joi.array().items(Joi.string()).optional(),
    hiv_status: Joi.string().valid('unknown', 'negative', 'positive').required().messages({
        'any.required': 'Tình trạng HIV là bắt buộc'
    }),
    last_sti_test: Joi.string().valid('never', 'within_3months', '3_6months', '6_12months', 'over_1year').optional(),
    has_symptoms: Joi.boolean().optional(),
    symptoms: Joi.array().items(Joi.string()).optional(),

    risk_factors: Joi.array().items(Joi.string()).optional(),
    living_area: Joi.string().optional(),

    test_purpose: Joi.string().valid('routine', 'symptoms', 'partner_positive', 'pregnancy', 'new_relationship', 'occupational').required().messages({
        'any.required': 'Mục đích xét nghiệm là bắt buộc'
    }),
    urgency: Joi.string().valid('normal', 'urgent', 'emergency').optional()
});

export const validateStiAssessment = (req: Request, res: Response, next: NextFunction) => {
    const { error } = stiAssessmentSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errorMessages
        });
    }

    next();
};