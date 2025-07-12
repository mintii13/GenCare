import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const stiAssessmentSchema = Joi.object({
    age: Joi.number().min(13).max(100).required().messages({
        'any.required': 'Tuổi là bắt buộc',
        'number.min': 'Tuổi phải từ 13 trở lên',
        'number.max': 'Tuổi không được quá 100'
    }),

    gender: Joi.string().valid('male', 'female', 'transgender').required().messages({
        'any.required': 'Giới tính là bắt buộc',
        'any.only': 'Giới tính phải là male, female hoặc transgender'
    }),

    is_pregnant: Joi.boolean().default(false),

    pregnancy_trimester: Joi.when('is_pregnant', {
        is: true,
        then: Joi.string().valid('first', 'second', 'third').optional(),
        otherwise: Joi.string().allow('').optional()
    }),

    sexually_active: Joi.string().valid('not_active', 'active_single', 'active_multiple').required().messages({
        'any.required': 'Tình trạng hoạt động tình dục là bắt buộc',
        'any.only': 'Tình trạng hoạt động tình dục phải là not_active, active_single hoặc active_multiple'
    }),

    sexual_orientation: Joi.when('sexually_active', {
        is: 'not_active',
        then: Joi.string().valid('heterosexual', 'homosexual', 'msm', 'bisexual').default('heterosexual'),
        otherwise: Joi.string().valid('heterosexual', 'homosexual', 'msm', 'bisexual').required().messages({
            'any.required': 'Xu hướng tình dục là bắt buộc khi có hoạt động tình dục'
        })
    }),

    number_of_partners: Joi.string().valid('none', 'one', 'multiple').optional(),

    new_partner_recently: Joi.when('sexually_active', {
        is: 'not_active',
        then: Joi.boolean().default(false),
        otherwise: Joi.boolean().optional()
    }),

    partner_has_sti: Joi.when('sexually_active', {
        is: 'not_active',
        then: Joi.boolean().default(false),
        otherwise: Joi.boolean().optional()
    }),

    condom_use: Joi.when('sexually_active', {
        is: 'not_active',
        then: Joi.string().valid('never').default('never'),
        otherwise: Joi.string().valid('always', 'sometimes', 'rarely', 'never').required().messages({
            'any.required': 'Tần suất sử dụng bao cao su là bắt buộc khi có hoạt động tình dục',
            'any.only': 'Tần suất sử dụng bao cao su phải là always, sometimes, rarely hoặc never'
        })
    }),

    previous_sti_history: Joi.array().items(
        Joi.string().valid('chlamydia', 'gonorrhea', 'syphilis', 'herpes', 'hpv', 'hepatitis_b', 'hepatitis_c', 'trichomonas')
    ).default([]),

    hiv_status: Joi.string().valid('unknown', 'negative', 'positive').required().messages({
        'any.required': 'Tình trạng HIV là bắt buộc',
        'any.only': 'Tình trạng HIV phải là unknown, negative hoặc positive'
    }),

    last_sti_test: Joi.string().valid('never', 'within_3months', '3_6months', '6_12months', 'over_1year').default('never'),

    has_symptoms: Joi.boolean().default(false),

    symptoms: Joi.when('has_symptoms', {
        is: true,
        then: Joi.array().items(Joi.string()).min(1).messages({
            'array.min': 'Phải chọn ít nhất 1 triệu chứng khi có triệu chứng'
        }),
        otherwise: Joi.array().items(Joi.string()).default([])
    }),

    risk_factors: Joi.array().items(
        Joi.string().valid('injection_drug', 'sex_work', 'incarceration', 'blood_transfusion', 'prep_user', 'immunocompromised', 'geographic_risk', 'has_cervix')
    ).default([]),

    living_area: Joi.string().valid(
        'normal', 'sti_clinic', 'correctional_facility', 'adolescent_clinic',
        'drug_treatment_center', 'emergency_department', 'family_planning_clinic', 'high_prevalence_area'
    ).default('normal'),

    test_purpose: Joi.string().valid('routine', 'symptoms', 'partner_positive', 'pregnancy', 'new_relationship', 'occupational').required().messages({
        'any.required': 'Mục đích xét nghiệm là bắt buộc',
        'any.only': 'Mục đích xét nghiệm không hợp lệ'
    }),

    urgency: Joi.string().valid('normal', 'urgent', 'emergency').default('normal')
});

// ✅ ENHANCED: Additional custom validation
const customValidation = (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

    // Custom validation: pregnancy_trimester only for females
    if (data.is_pregnant === true && data.gender !== 'female') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: ['Chỉ phụ nữ mới có thể mang thai']
        });
    }

    // Custom validation: MSM only for males
    if (data.sexual_orientation === 'msm' && data.gender !== 'male') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: ['MSM chỉ áp dụng cho nam giới']
        });
    }

    // Custom validation: has_cervix only for transgender
    if (data.risk_factors?.includes('has_cervix') && data.gender !== 'transgender') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: ['Thông tin cervix chỉ áp dụng cho người chuyển giới']
        });
    }

    // Custom validation: pregnancy test purpose should match is_pregnant
    if (data.test_purpose === 'pregnancy' && data.is_pregnant !== true) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: ['Mục đích pregnancy phải kèm theo is_pregnant = true']
        });
    }

    next();
};

export const validateStiAssessment = (req: Request, res: Response, next: NextFunction) => {
    // First run Joi validation
    const { error, value } = stiAssessmentSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
    });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errorMessages
        });
    }

    // Update request body with validated and defaulted values
    req.body = value;

    // Then run custom validation
    customValidation(req, res, next);
};