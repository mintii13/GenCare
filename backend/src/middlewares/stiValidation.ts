import Joi, { valid } from 'joi';
import { Request, Response, NextFunction } from 'express';
import { OrderStatus } from '../models/StiOrder';

const objectId = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('ID không hợp lệ. Phải là ObjectId hợp lệ (24 ký tự hex).');

export const stiPackageSchema = Joi.object({
    sti_package_name: Joi.string().trim().required().messages({
      'string.empty': 'Tên gói không được để trống',
      'any.required': 'Tên gói là bắt buộc'
    }),

    sti_package_code: Joi.string().trim().uppercase().pattern(/^STI-[A-Z0-9\-]+$/).required().messages({
      'string.empty': 'Mã gói không được để trống',
      'any.required': 'Mã gói là bắt buộc',
      'string.pattern.base': 'Mã gói phải theo định dạng: STI-XXXX'
    }),

    price: Joi.number().min(0).required().messages({
      'number.base': 'Giá phải là số',
      'number.min': 'Giá không được âm',
      'any.required': 'Giá là bắt buộc'
    }),

    description: Joi.string().trim().required().messages({
      'string.empty': 'Mô tả không được để trống',
      'any.required': 'Mô tả là bắt buộc'
    }),

    is_active: Joi.boolean().optional(),

    createdBy: objectId.required().messages({
      'any.required': 'Người tạo là bắt buộc'
    }),

    sti_test_ids: Joi.array().items(objectId).optional().messages({
      'string.pattern.base': 'ID trong danh sách xét nghiệm không hợp lệ'
    })
});

export const validateStiPackage = (req: Request, res: Response, next: NextFunction) => {
    const { error } = stiPackageSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(err => err.message)
      });
    }
    next();
}
export const stiTestSchema = Joi.object({
    sti_test_name: Joi.string().required().messages({
      'any.required': 'Tên xét nghiệm là bắt buộc',
      'string.empty': 'Tên xét nghiệm không được để trống'
    }),

    sti_test_code: Joi.string()
      .pattern(/^STI-(VIR|BAC|PAR)-(BLD|URN|SWB)-[A-Z0-9]+$/)
      .required()
      .messages({
        'any.required': 'Mã xét nghiệm là bắt buộc',
        'string.pattern.base': 'Mã xét nghiệm phải theo định dạng: STI-loại-mẫu-code, ví dụ: STI-VIR-BLD-HIV'
      }),

    description: Joi.string().required().messages({
      'any.required': 'Mô tả là bắt buộc',
      'string.empty': 'Mô tả không được để trống'
    }),

    price: Joi.number().min(0).required().messages({
      'any.required': 'Giá là bắt buộc',
      'number.base': 'Giá phải là số',
      'number.min': 'Giá không được âm'
    }),

    is_active: Joi.boolean().optional(),

    category: Joi.string().valid('bacterial', 'viral', 'parasitic').required().messages({
      'any.only': 'Loại phải là bacterial, viral hoặc parasitic',
      'any.required': 'Loại là bắt buộc'
    }),

    sti_test_type: Joi.string().valid('máu', 'nước tiểu', 'dịch ngoáy').required().messages({
      'any.only': 'Loại mẫu phải là máu, nước tiểu hoặc dịch ngoáy',
      'any.required': 'Loại mẫu là bắt buộc'
    })
});

export const validateStiTest = (req: Request, res: Response, next: NextFunction) => {
    const { error } = stiTestSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(err => err.message)
      });
    }
    next();
}

export const stiOrderSchema = Joi.object({
    sti_package_id: objectId.optional().messages({
      'any.required': 'STI Package ID là bắt buộc trong sti_package_item'
    }),

    sti_test_items: Joi.array().items(objectId.required()).optional().messages({
      'array.base': 'sti_test_items phải là một mảng',
      'any.required': 'Mỗi phần tử trong sti_test_items là bắt buộc'
    }),

    order_date: Joi.date().required().messages({
      'date.base': 'Ngày đặt không hợp lệ',
      'any.required': 'Ngày đặt là bắt buộc'
    }),

    notes: Joi.string().optional()
  }).xor('sti_package_id', 'sti_test_items').messages({
    'object.missing': 'Phải cung cấp ít nhất một trong sti_package_id hoặc sti_test_items'
  });

export const validateStiOrder = (req: Request, res: Response, next: NextFunction) => {
    const { error } = stiOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(err => err.message)
      });
    }
    next();
}

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    Booked: ['Accepted', 'Canceled'],
    Accepted: ['Processing', 'Canceled'],
    Processing: ['SpecimenCollected'],
    SpecimenCollected: ['Testing'],
    Testing: ['Completed'],
    Completed: [],
    Canceled: [],
};