import Joi, { valid } from 'joi';
import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { OrderStatus, IStiOrder } from '../models/StiOrder';

// Extend Request interface để thêm currentOrder
declare global {
  namespace Express {
    interface Request {
      currentOrder?: IStiOrder;
    }
  }
}

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

  created_by: objectId.required().messages({
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

  sti_test_type: Joi.string().valid('blood', 'urine', 'swab').required().messages({
    'any.only': 'Loại mẫu phải là blood, urine hoặc swab',
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

dayjs.extend(isSameOrAfter);

export const stiOrderCreateSchema = Joi.object({
  order_date: Joi.string().required().custom((value, helpers) => {
    const inputDate = dayjs(value, 'YYYY-MM-DD', true);
    const today = dayjs().startOf('day');

    if (!inputDate.isValid()) {
      return helpers.error('any.invalid');
    }

    if (!inputDate.isAfter(today)) {
      return helpers.error('date.futureOnly');
    }

    return value;
  }).messages({
    'any.required': 'Ngày đặt là bắt buộc',
    'date.futureOnly': 'Ngày đặt phải sau hôm nay',
    'any.invalid': 'Ngày không hợp lệ'
  }),

  notes: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Ghi chú không được vượt quá 500 ký tự'
  })
})

export const validateStiOrderCreate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = stiOrderCreateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map(err => err.message)
    });
  }
  next();
}

const validTransitionsForUpdate: Record<OrderStatus, OrderStatus[]> = {
  Booked: ['Accepted', 'Canceled'],
  Accepted: ['Processing', 'Canceled'],
  Processing: ['SpecimenCollected'],
  SpecimenCollected: ['Testing'],
  Testing: ['Completed'],
  Completed: [],
  Canceled: [],
};

export const stiOrderUpdateSchema = Joi.object({
  customer_id: objectId.optional().messages({
    'string.pattern.base': 'Customer ID không hợp lệ'
  }),

  consultant_id: objectId.allow(null).optional().messages({
    'string.pattern.base': 'Consultant ID không hợp lệ'
  }),

  staff_id: objectId.allow(null).optional().messages({
    'string.pattern.base': 'Staff ID không hợp lệ'
  }),

  sti_package_item: Joi.object({
    sti_package_id: objectId.allow(null).optional().messages({
      'any.invalid': 'STI Package ID không hợp lệ',
    }),
  }).optional(),

  sti_test_items: Joi.array().items(objectId).optional().messages({
    'array.base': 'STI Test Items phải là một mảng',
  }),

  order_date: Joi.date().optional().custom((value, helpers) => {
    const today = dayjs().startOf('day');
    const inputDate = dayjs(value).startOf('day');

    if (!inputDate.isAfter(today)) {
      return helpers.error('date.futureOnly');
    }

    return value;
  }).messages({
    'date.base': 'Ngày đặt không hợp lệ',
    'any.required': 'Ngày đặt là bắt buộc',
    'date.futureOnly': 'Ngày đặt phải sau hôm nay'
  }),

  order_status: Joi.string().optional().messages({
    'any.only': 'Trạng thái đơn hàng không hợp lệ'
  }),

  is_paid: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Trạng thái thanh toán phải là true hoặc false'
    }),

  total_amount: Joi.number().min(0).optional().messages({
    'number.base': 'Tổng tiền phải là số',
    'number.min': 'Tổng tiền không được âm',
    'any.required': 'Tổng tiền là bắt buộc'
  }),

  notes: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Ghi chú không được vượt quá 500 ký tự'
  })
});

export const validateStiOrderUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = stiOrderUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map(err => err.message)
    });
  }
  next();
}

// ====================== LOGIC RÀNG BUỘC TRẠNG THÁI ======================

/**
 * Các trạng thái đơn hàng có thể chuyển đổi
 */
export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    Booked: ['Accepted', 'Canceled'],
    Accepted: ['Processing', 'Canceled'],
    Processing: ['SpecimenCollected'],
    SpecimenCollected: ['Testing'],
    Testing: ['Completed'],
    Completed: [],
    Canceled: [],
};