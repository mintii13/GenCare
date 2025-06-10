import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const stiTestSchema = Joi.object({
  sti_test_name: Joi.string().required().messages({
    'any.required': 'Sti test name is required',
    'string.empty': 'Sti test name cannot be empty'
  }),
  sti_test_code: Joi.string()
    .pattern(/^STI-(VIR|BAC|PAR)-(BLD|URN|SWB)-[A-Z0-9]+$/)
    .required()
    .messages({
      'any.required': 'Sti test code is required',
      'string.pattern.base': 'Sti test code must be in format: STI-{category}-{type}-{code}, for example: STI-VIR-BLD-HIV'
    }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'Price is required',
    'number.base': 'Price must be numerical',
    'number.min': 'Price cannot be negative'
  }),
  duration: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  category: Joi.string()
    .valid('bacterial', 'viral', 'parasitic')
    .required()
    .messages({
      'any.only': 'Category must be bacterial, viral or parasitic'
    }),
  sti_test_type: Joi.string()
    .valid('blood', 'urine', 'swab')
    .required()
    .messages({
      'any.only': 'Sti test type must be blood, urine or swab'
    })
});

export const validateStiTest = (req: Request, res: Response, next: NextFunction) => {
  const { error } = stiTestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
