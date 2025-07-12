// STI Status Utilities - Ràng buộc logic trạng thái đơn hàng và thanh toán

export type OrderStatus = 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

/**
 * Ràng buộc trạng thái đơn hàng và thanh toán theo cặp
 */
export const STATUS_CONSTRAINTS = {
  // Trạng thái đơn hàng có thể chuyển đổi
  validOrderTransitions: {
    'Booked': ['Accepted', 'Canceled'],
    'Accepted': ['Processing', 'Canceled'],
    'Processing': ['SpecimenCollected'],
    'SpecimenCollected': ['Testing'],
    'Testing': ['Completed'],
    'Completed': [],
    'Canceled': []
  } as Record<OrderStatus, OrderStatus[]>,

  // Trạng thái thanh toán có thể chuyển đổi
  validPaymentTransitions: {
    'Pending': ['Paid', 'Failed'],
    'Paid': [], // Không thể chuyển từ Paid sang trạng thái khác
    'Failed': ['Pending', 'Paid']
  } as Record<PaymentStatus, PaymentStatus[]>,

  // Ràng buộc cặp: Trạng thái thanh toán bắt buộc theo trạng thái đơn hàng
  requiredPaymentByOrder: {
    'Booked': ['Pending'],
    'Accepted': ['Pending', 'Paid'],
    'Processing': ['Paid'], // Phải thanh toán mới được xử lý
    'SpecimenCollected': ['Paid'],
    'Testing': ['Paid'],
    'Completed': ['Paid'],
    'Canceled': ['Pending', 'Paid', 'Failed']
  } as Record<OrderStatus, PaymentStatus[]>,

  // Ràng buộc ngược: Trạng thái đơn hàng cho phép theo trạng thái thanh toán
  allowedOrderByPayment: {
    'Pending': ['Booked', 'Accepted', 'Canceled'],
    'Paid': ['Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'],
    'Failed': ['Canceled']
  } as Record<PaymentStatus, OrderStatus[]>,

  // Các cặp trạng thái hợp lệ
  validStatusPairs: [
    ['Booked', 'Pending'],
    ['Accepted', 'Pending'],
    ['Accepted', 'Paid'],
    ['Processing', 'Paid'],
    ['SpecimenCollected', 'Paid'],
    ['Testing', 'Paid'],
    ['Completed', 'Paid'],
    ['Canceled', 'Pending'],
    ['Canceled', 'Paid'],
    ['Canceled', 'Failed']
  ] as [OrderStatus, PaymentStatus][],

  // Rules đặc biệt
  specialRules: {
    cannotCancelPaidOrder: true,
    mustPayBeforeProcessing: true,
    completedOrderLocked: true,
    failedPaymentMustCancel: false
  }
};

/**
 * Kiểm tra cặp trạng thái có hợp lệ không
 */
export const isValidStatusPair = (orderStatus: OrderStatus, paymentStatus: PaymentStatus): boolean => {
  return STATUS_CONSTRAINTS.validStatusPairs.some(
    ([order, payment]) => order === orderStatus && payment === paymentStatus
  );
};

/**
 * Kiểm tra có thể chuyển đổi trạng thái đơn hàng không
 */
export const canTransitionOrderStatus = (
  currentOrderStatus: OrderStatus,
  newOrderStatus: OrderStatus,
  currentPaymentStatus: PaymentStatus,
  newPaymentStatus?: PaymentStatus
): { valid: boolean; message?: string } => {
  // Kiểm tra chuyển đổi trạng thái đơn hàng
  const allowedTransitions = STATUS_CONSTRAINTS.validOrderTransitions[currentOrderStatus];
  if (!allowedTransitions.includes(newOrderStatus)) {
    return {
      valid: false,
      message: `Không thể chuyển từ "${currentOrderStatus}" sang "${newOrderStatus}". Chỉ có thể: ${allowedTransitions.join(', ')}`
    };
  }

  // Kiểm tra ràng buộc với trạng thái thanh toán
  const finalPaymentStatus = newPaymentStatus || currentPaymentStatus;
  const requiredPaymentStatuses = STATUS_CONSTRAINTS.requiredPaymentByOrder[newOrderStatus];
  
  if (!requiredPaymentStatuses.includes(finalPaymentStatus)) {
    return {
      valid: false,
      message: `Trạng thái "${newOrderStatus}" yêu cầu thanh toán: ${requiredPaymentStatuses.join(' hoặc ')}. Hiện tại: ${finalPaymentStatus}`
    };
  }

  // Rule đặc biệt: Không thể hủy đơn hàng đã thanh toán
  if (newOrderStatus === 'Canceled' && currentPaymentStatus === 'Paid' && STATUS_CONSTRAINTS.specialRules.cannotCancelPaidOrder) {
    return {
      valid: false,
      message: 'Không thể hủy đơn hàng đã thanh toán thành công'
    };
  }

  return { valid: true };
};

/**
 * Kiểm tra có thể chuyển đổi trạng thái thanh toán không
 */
export const canTransitionPaymentStatus = (
  currentPaymentStatus: PaymentStatus,
  newPaymentStatus: PaymentStatus,
  orderStatus: OrderStatus
): { valid: boolean; message?: string } => {
  // Kiểm tra chuyển đổi trạng thái thanh toán
  const allowedTransitions = STATUS_CONSTRAINTS.validPaymentTransitions[currentPaymentStatus];
  if (!allowedTransitions.includes(newPaymentStatus)) {
    return {
      valid: false,
      message: `Không thể chuyển thanh toán từ "${currentPaymentStatus}" sang "${newPaymentStatus}". Chỉ có thể: ${allowedTransitions.join(', ')}`
    };
  }

  // Kiểm tra ràng buộc với trạng thái đơn hàng
  const allowedOrderStatuses = STATUS_CONSTRAINTS.allowedOrderByPayment[newPaymentStatus];
  if (!allowedOrderStatuses.includes(orderStatus)) {
    return {
      valid: false,
      message: `Trạng thái thanh toán "${newPaymentStatus}" không cho phép với đơn hàng "${orderStatus}"`
    };
  }

  // Rule đặc biệt: Đơn hàng Completed không thể thay đổi payment
  if (orderStatus === 'Completed' && STATUS_CONSTRAINTS.specialRules.completedOrderLocked) {
    return {
      valid: false,
      message: 'Không thể thay đổi trạng thái thanh toán của đơn hàng đã hoàn thành'
    };
  }

  return { valid: true };
};

/**
 * Lấy các trạng thái đơn hàng có thể chuyển đổi tiếp theo
 */
export const getAvailableOrderStatuses = (
  currentOrderStatus: OrderStatus,
  currentPaymentStatus: PaymentStatus
): OrderStatus[] => {
  const possibleTransitions = STATUS_CONSTRAINTS.validOrderTransitions[currentOrderStatus];
  
  return possibleTransitions.filter(newOrderStatus => {
    const validation = canTransitionOrderStatus(
      currentOrderStatus,
      newOrderStatus,
      currentPaymentStatus
    );
    return validation.valid;
  });
};

/**
 * Lấy TẤT CẢ các trạng thái đơn hàng hợp lệ (không chỉ trạng thái tiếp theo)
 */
export const getAllValidOrderStatuses = (
  currentPaymentStatus: PaymentStatus
): OrderStatus[] => {
  const allOrderStatuses: OrderStatus[] = ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'];
  
  return allOrderStatuses.filter(orderStatus => {
    return isValidStatusPair(orderStatus, currentPaymentStatus);
  });
};

/**
 * Lấy các trạng thái thanh toán có thể chuyển đổi tiếp theo
 */
export const getAvailablePaymentStatuses = (
  currentPaymentStatus: PaymentStatus,
  orderStatus: OrderStatus
): PaymentStatus[] => {
  const possibleTransitions = STATUS_CONSTRAINTS.validPaymentTransitions[currentPaymentStatus];
  
  return possibleTransitions.filter(newPaymentStatus => {
    const validation = canTransitionPaymentStatus(
      currentPaymentStatus,
      newPaymentStatus,
      orderStatus
    );
    return validation.valid;
  });
};

/**
 * Lấy TẤT CẢ các trạng thái thanh toán hợp lệ (không chỉ trạng thái tiếp theo)
 */
export const getAllValidPaymentStatuses = (
  orderStatus: OrderStatus
): PaymentStatus[] => {
  const allPaymentStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Failed'];
  
  return allPaymentStatuses.filter(paymentStatus => {
    return isValidStatusPair(orderStatus, paymentStatus);
  });
};

/**
 * Lấy các cặp trạng thái hợp lệ cho dropdown
 */
export const getValidStatusPairs = (): Array<{
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  label: string;
  disabled?: boolean;
}> => {
  return STATUS_CONSTRAINTS.validStatusPairs.map(([orderStatus, paymentStatus]) => ({
    orderStatus,
    paymentStatus,
    label: `${getOrderStatusLabel(orderStatus)} - ${getPaymentStatusLabel(paymentStatus)}`,
    disabled: false
  }));
};

/**
 * Lấy label hiển thị cho trạng thái đơn hàng
 */
export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    'Booked': 'Đã đặt',
    'Accepted': 'Đã chấp nhận',
    'Processing': 'Đang xử lý',
    'SpecimenCollected': 'Đã lấy mẫu',
    'Testing': 'Đang xét nghiệm',
    'Completed': 'Hoàn thành',
    'Canceled': 'Đã hủy'
  };
  return labels[status] || status;
};

/**
 * Lấy label hiển thị cho trạng thái thanh toán
 */
export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    'Pending': 'Chờ thanh toán',
    'Paid': 'Đã thanh toán',
    'Failed': 'Thanh toán thất bại'
  };
  return labels[status] || status;
};

/**
 * Lấy màu sắc cho trạng thái đơn hàng
 */
export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    'Booked': 'blue',
    'Accepted': 'cyan',
    'Processing': 'orange',
    'SpecimenCollected': 'purple',
    'Testing': 'geekblue',
    'Completed': 'green',
    'Canceled': 'red'
  };
  return colors[status] || 'default';
};

/**
 * Lấy màu sắc cho trạng thái thanh toán
 */
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    'Pending': 'orange',
    'Paid': 'green',
    'Failed': 'red'
  };
  return colors[status] || 'default';
};

/**
 * Kiểm tra xem có thể thực hiện hành động nào trên đơn hàng không
 */
export const getAvailableActions = (
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus,
  userRole: string
): {
  canEdit: boolean;
  canCancel: boolean;
  canConfirm: boolean;
  canProcess: boolean;
  canComplete: boolean;
  canUpdatePayment: boolean;
  availableOrderTransitions: OrderStatus[];
  availablePaymentTransitions: PaymentStatus[];
} => {
  const availableOrderTransitions = getAvailableOrderStatuses(orderStatus, paymentStatus);
  const availablePaymentTransitions = getAvailablePaymentStatuses(paymentStatus, orderStatus);

  return {
    canEdit: !['Completed', 'Canceled'].includes(orderStatus),
    canCancel: availableOrderTransitions.includes('Canceled'),
    canConfirm: orderStatus === 'Booked' && availableOrderTransitions.includes('Accepted'),
    canProcess: orderStatus === 'Accepted' && availableOrderTransitions.includes('Processing'),
    canComplete: orderStatus === 'Testing' && availableOrderTransitions.includes('Completed'),
    canUpdatePayment: availablePaymentTransitions.length > 0 && userRole !== 'customer',
    availableOrderTransitions,
    availablePaymentTransitions
  };
};

/**
 * Validate trước khi submit form cập nhật trạng thái
 */
export const validateStatusUpdate = (
  currentOrderStatus: OrderStatus,
  currentPaymentStatus: PaymentStatus,
  newOrderStatus?: OrderStatus,
  newPaymentStatus?: PaymentStatus
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Kiểm tra trạng thái đơn hàng
  if (newOrderStatus && newOrderStatus !== currentOrderStatus) {
    const orderValidation = canTransitionOrderStatus(
      currentOrderStatus,
      newOrderStatus,
      currentPaymentStatus,
      newPaymentStatus
    );
    if (!orderValidation.valid) {
      errors.push(orderValidation.message || 'Lỗi chuyển đổi trạng thái đơn hàng');
    }
  }

  // Kiểm tra trạng thái thanh toán
  if (newPaymentStatus && newPaymentStatus !== currentPaymentStatus) {
    const paymentValidation = canTransitionPaymentStatus(
      currentPaymentStatus,
      newPaymentStatus,
      newOrderStatus || currentOrderStatus
    );
    if (!paymentValidation.valid) {
      errors.push(paymentValidation.message || 'Lỗi chuyển đổi trạng thái thanh toán');
    }
  }

  // Kiểm tra cặp trạng thái cuối cùng
  const finalOrderStatus = newOrderStatus || currentOrderStatus;
  const finalPaymentStatus = newPaymentStatus || currentPaymentStatus;
  
  if (!isValidStatusPair(finalOrderStatus, finalPaymentStatus)) {
    errors.push(`Cặp trạng thái "${finalOrderStatus}" - "${finalPaymentStatus}" không hợp lệ`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}; 