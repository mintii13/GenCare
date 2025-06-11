import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

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
  isActive: Joi.boolean().optional(),
  category: Joi.string()
    .valid('bacterial', 'viral', 'parasitic')
    .required()
    .messages({
      'any.only': 'Category must be bacterial, viral or parasitic'
    }),
  sti_test_type: Joi.string()
    .valid('máu', 'nước tiểu', 'dịch ngoáy')
    .required()
    .messages({
      'any.only': 'Sti test type must be máu, nước tiểu or dịch ngoáy'
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

export const stiPackageSchema = Joi.object({
  sti_package_name: Joi.string().trim().required().messages({
    'any.required': 'STI package name is required',
    'string.empty': 'STI package name cannot be empty'
  }),

  sti_package_code: Joi.string().trim().uppercase().pattern(/^STI-[A-Z0-9\-]+$/).required().messages({
    'any.required': 'STI package code is required',
    'string.empty': 'STI package code cannot be empty',
    'string.pattern.base': 'STI package code must be in format: STI-{CODE}, for example, STI-BASIC'
  }),

  price: Joi.number().min(0).required().messages({
    'any.required': 'Price is required',
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative'
  }),

  description: Joi.string().trim().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  is_active: Joi.boolean().optional()
});

export const validateStiPackage = (req: Request, res: Response, next: NextFunction) => {
  const { error } = stiPackageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};