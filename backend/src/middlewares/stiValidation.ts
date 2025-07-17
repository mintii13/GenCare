import Joi, { valid } from 'joi';
import { Request, Response, NextFunction } from 'express';
import { OrderStatus } from '../models/StiOrder';
import dayjs from 'dayjs';
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

export const stiOrderCreateSchema = Joi.object({
  order_date: Joi.date().required().custom((value, helpers) => {
    const today = dayjs().startOf('day');
    const inputDate = dayjs(value).startOf('day');

    if (!inputDate.isAfter(today)) {
      return helpers.error('date.futureOnly');
    }

    return value;
  }).messages({
    'date.base': 'Ngày đặt không hợp lệ',
    'any.required': 'Ngày đặt là bắt buộc'
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
    sti_package_id: objectId.required().messages({
      'string.pattern.base': 'STI Package ID không hợp lệ',
      'any.required': 'STI Package ID là bắt buộc'
    }),
    sti_test_ids: Joi.array().items(objectId).required().messages({
      'array.base': 'STI Test IDs phải là một mảng',
      'string.pattern.base': 'STI Test ID không hợp lệ',
      'any.required': 'STI Test IDs là bắt buộc'
    })
  }).optional(),

  sti_test_items: Joi.array().items(objectId).optional().messages({
    'array.base': 'STI Test Items phải là một mảng',
    'string.pattern.base': 'STI Test ID không hợp lệ'
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

  payment_status: Joi.string().optional().messages({
    'any.only': 'Trạng thái thanh toán không hợp lệ'
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

/**
 * Ràng buộc giữa trạng thái đơn hàng và trạng thái thanh toán
 */
export const orderPaymentConstraints = {
    // Trạng thái thanh toán bắt buộc theo từng trạng thái đơn hàng
    requiredPaymentStatus: {
        'Booked': ['Pending'],
        'Accepted': ['Pending', 'Paid'],
        'Processing': ['Paid'], // Phải thanh toán mới được xử lý
        'SpecimenCollected': ['Paid'],
        'Testing': ['Paid'],
        'Completed': ['Paid'],
        'Canceled': ['Pending', 'Paid', 'Failed']
    },
    
    // Trạng thái thanh toán có thể chuyển đổi
    validPaymentTransitions: {
        'Pending': ['Paid', 'Failed'],
        'Paid': [], // Không thể chuyển từ Paid sang trạng thái khác
        'Failed': ['Pending', 'Paid']
    },
    
    // Ràng buộc đặc biệt
    specialRules: {
        // Không thể hủy đơn hàng đã thanh toán thành công
        cannotCancelPaidOrder: true,
        // Phải thanh toán trước khi chuyển sang Processing
        mustPayBeforeProcessing: true,
        // Đơn hàng Completed không thể thay đổi payment status
        completedOrderPaymentLocked: true
    }
};

/**
 * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái đơn hàng
 */
export const validateOrderStatusTransition = (
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    currentPaymentStatus: string,
    newPaymentStatus?: string
): { valid: boolean; message?: string } => {
    // Kiểm tra chuyển đổi trạng thái đơn hàng
    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
        return {
            valid: false,
            message: `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}". Chỉ có thể chuyển sang: ${allowedTransitions.join(', ')}`
        };
    }
    
    // Kiểm tra ràng buộc thanh toán
    const finalPaymentStatus = newPaymentStatus || currentPaymentStatus;
    const allowedPaymentStatuses = orderPaymentConstraints.requiredPaymentStatus[newStatus];
    
    if (!allowedPaymentStatuses.includes(finalPaymentStatus)) {
        return {
            valid: false,
            message: `Trạng thái đơn hàng "${newStatus}" yêu cầu trạng thái thanh toán phải là: ${allowedPaymentStatuses.join(' hoặc ')}. Hiện tại: ${finalPaymentStatus}`
        };
    }
    
    // Kiểm tra rule đặc biệt: Không thể hủy đơn hàng đã thanh toán
    if (newStatus === 'Canceled' && currentPaymentStatus === 'Paid' && orderPaymentConstraints.specialRules.cannotCancelPaidOrder) {
        return {
            valid: false,
            message: 'Không thể hủy đơn hàng đã thanh toán thành công'
        };
    }
    
    return { valid: true };
};

/**
 * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái thanh toán
 */
export const validatePaymentStatusTransition = (
    currentPaymentStatus: string,
    newPaymentStatus: string,
    orderStatus: OrderStatus
): { valid: boolean; message?: string } => {
    // Kiểm tra chuyển đổi trạng thái thanh toán
    const allowedTransitions = orderPaymentConstraints.validPaymentTransitions[currentPaymentStatus as keyof typeof orderPaymentConstraints.validPaymentTransitions];
    if (!allowedTransitions.includes(newPaymentStatus)) {
        return {
            valid: false,
            message: `Không thể chuyển trạng thái thanh toán từ "${currentPaymentStatus}" sang "${newPaymentStatus}". Chỉ có thể chuyển sang: ${allowedTransitions.join(', ')}`
        };
    }
    
    // Kiểm tra rule đặc biệt: Đơn hàng Completed không thể thay đổi payment status
    if (orderStatus === 'Completed' && orderPaymentConstraints.specialRules.completedOrderPaymentLocked) {
        return {
            valid: false,
            message: 'Không thể thay đổi trạng thái thanh toán của đơn hàng đã hoàn thành'
        };
    }
    
    // Kiểm tra ràng buộc với trạng thái đơn hàng
    const allowedPaymentStatuses = orderPaymentConstraints.requiredPaymentStatus[orderStatus];
    if (!allowedPaymentStatuses.includes(newPaymentStatus)) {
        return {
            valid: false,
            message: `Trạng thái đơn hàng "${orderStatus}" không cho phép trạng thái thanh toán "${newPaymentStatus}". Chỉ cho phép: ${allowedPaymentStatuses.join(', ')}`
        };
    }
    
    return { valid: true };
};

/**
 * Middleware validation cho việc cập nhật trạng thái đơn hàng
 */
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { order_status, payment_status } = req.body;
    const currentOrder = (req as any).currentOrder; // Giả định order hiện tại được attach vào req
    
    if (!currentOrder) {
        return res.status(400).json({
            success: false,
            message: 'Không tìm thấy thông tin đơn hàng hiện tại'
        });
    }
    
    // Kiểm tra nếu có thay đổi trạng thái đơn hàng
    if (order_status && order_status !== currentOrder.order_status) {
        const orderValidation = validateOrderStatusTransition(
            currentOrder.order_status,
            order_status,
            currentOrder.payment_status,
            payment_status
        );
        
        if (!orderValidation.valid) {
            return res.status(400).json({
                success: false,
                message: orderValidation.message
            });
        }
    }
    
    // Kiểm tra nếu có thay đổi trạng thái thanh toán
    if (payment_status && payment_status !== currentOrder.payment_status) {
        const paymentValidation = validatePaymentStatusTransition(
            currentOrder.payment_status,
            payment_status,
            order_status || currentOrder.order_status
        );
        
        if (!paymentValidation.valid) {
            return res.status(400).json({
                success: false,
                message: paymentValidation.message
            });
        }
    }
    
    next();
};

/**
 * Lấy các trạng thái có thể chuyển đổi tiếp theo
 */
export const getAvailableTransitions = (currentOrderStatus: OrderStatus, currentPaymentStatus: string) => {
    const availableOrderStatuses = validTransitions[currentOrderStatus];
    const availablePaymentStatuses = orderPaymentConstraints.validPaymentTransitions[currentPaymentStatus as keyof typeof orderPaymentConstraints.validPaymentTransitions];
    
    return {
        orderStatuses: availableOrderStatuses,
        paymentStatuses: availablePaymentStatuses,
        constraints: orderPaymentConstraints.requiredPaymentStatus
    };
};