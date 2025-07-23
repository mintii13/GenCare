import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const baseSchema = {
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'any.required': 'Email là bắt buộc',
      'string.email': 'Email không hợp lệ',
    }),

  full_name: Joi.string()
    .min(2)
    .required()
    .messages({
      'any.required': 'Họ và tên là bắt buộc',
      'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    }),

  role: Joi.string()
    .valid('customer', 'consultant', 'staff')
    .required()
    .messages({
      'any.required': 'Vai trò là bắt buộc',
      'any.only': 'Vai trò không hợp lệ',
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 chữ số)',
    }),

   gender: Joi.string()
    .optional()
    .messages({
      'any.only': 'Giới tính không hợp lệ',
    }),

  password: Joi.string()
    .min(6)
    .allow('', null)
    .messages({ 'string.min': 'Mật khẩu phải có ít nhất 6 ký tự' }),

  date_of_birth: Joi.date()
    .min(new Date(new Date().getFullYear() - 100, 0, 1))
    .max(new Date(new Date().getFullYear() - 13, 11, 31))
    .allow('', null)
    .messages({
      'date.base': 'Ngày sinh không hợp lệ',
      'date.min': 'Tuổi phải từ 13-100',
      'date.max': 'Tuổi phải từ 13-100',
    }),

  hire_date: Joi.date()
    .min(new Date(1970, 0, 1))
    .max(new Date(new Date().getFullYear() + 1, 11, 31))
    .allow('', null)
    .messages({
      'date.base': 'Ngày bắt đầu làm việc không hợp lệ',
      'date.min': 'Ngày bắt đầu làm việc phải từ năm 1970 đến hiện tại',
      'date.max': 'Ngày bắt đầu làm việc phải từ năm 1970 đến hiện tại',
    }),

  specialization: Joi.string().allow('', null),
  qualifications: Joi.string().allow('', null),
  experience_years: Joi.number().positive().allow(null),
  department: Joi.string().allow('', null),
  status: Joi.boolean().allow(null),
  email_verified: Joi.boolean().allow(null),
};

const createSchema = Joi.object({
  ...baseSchema,
  specialization: Joi.when('role', {
    is: 'consultant',
    then: Joi.string().required().messages({
      'any.required': 'Chuyên môn là bắt buộc cho tư vấn viên',
    }),
    otherwise: baseSchema.specialization,
  }),
  qualifications: Joi.when('role', {
    is: 'consultant',
    then: Joi.string().required().messages({
      'any.required': 'Bằng cấp/Chứng chỉ là bắt buộc cho tư vấn viên',
    }),
    otherwise: baseSchema.qualifications,
  }),
  experience_years: Joi.when('role', {
    is: 'consultant',
    then: Joi.number().positive().required().messages({
      'any.required': 'Số năm kinh nghiệm phải lớn hơn 0 cho tư vấn viên',
      'number.positive': 'Số năm kinh nghiệm phải lớn hơn 0 cho tư vấn viên',
    }),
    otherwise: baseSchema.experience_years,
  }),
  department: Joi.when('role', {
    is: 'staff',
    then: Joi.string().required().messages({
      'any.required': 'Phòng ban là bắt buộc cho nhân viên',
    }),
    otherwise: baseSchema.department,
  }),
  hire_date: Joi.when('role', {
    is: 'staff',
    then: baseSchema.hire_date.required().messages({
      'any.required': 'Ngày bắt đầu làm việc là bắt buộc cho nhân viên',
    }),
    otherwise: baseSchema.hire_date,
  }),
});

const updateSchema = Joi.object(baseSchema);

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
  }
  next();
};

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
  }
  next();
};