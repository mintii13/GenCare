// STI Status Utilities - Ràng buộc logic trạng thái đơn hàng và thanh toán

export type OrderStatus = 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';

export const STATUS_CONSTRAINTS = {
  validOrderTransitions: {
    'Booked': ['Accepted', 'Canceled'],
    'Accepted': ['Processing', 'Canceled'],
    'Processing': ['SpecimenCollected'],
    'SpecimenCollected': ['Testing'],
    'Testing': ['Completed'],
    'Completed': [],
    'Canceled': []
  } as Record<OrderStatus, OrderStatus[]>,

  requiredPaymentByOrder: {
    Booked: [false],
    Accepted: [false],
    Processing: [true],
    SpecimenCollected: [true],
    Testing: [true],
    Completed: [true],
    Canceled: [false],
  } as Record<OrderStatus, boolean[]>,

  allowedOrderByPayment: {
    false: ['Booked', 'Accepted', 'Canceled'],
    true: ['Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled']
  } as Record<'true' | 'false', OrderStatus[]>,

  validStatusPairs: [
    ['Booked', false],
    ['Accepted', false],
    ['Accepted', true],
    ['Processing', true],
    ['SpecimenCollected', true],
    ['Testing', true],
    ['Completed', true],
    ['Canceled', false]
  ] as [OrderStatus, boolean][],

  specialRules: {
    cannotCancelPaidOrder: true,
    mustPayBeforeProcessing: true,
    completedOrderLocked: true,
    failedPaymentMustCancel: false
  },

  validPaymentTransitions: {
    false: [true],
    true: []
  } as Record<'true' | 'false', boolean[]>
};

export const isValidStatusPair = (orderStatus: OrderStatus, paymentStatus: boolean): boolean => {
  return STATUS_CONSTRAINTS.validStatusPairs.some(
    ([order, payment]) => order === orderStatus && payment === paymentStatus
  );
};

export const canTransitionOrderStatus = (
  currentOrderStatus: OrderStatus,
  newOrderStatus: OrderStatus,
  currentPaymentStatus: boolean,
  newPaymentStatus?: boolean
): { valid: boolean; message?: string } => {
  const allowedTransitions = STATUS_CONSTRAINTS.validOrderTransitions[currentOrderStatus];
  if (!allowedTransitions.includes(newOrderStatus)) {
    return {
      valid: false,
      message: `Không thể chuyển từ "${currentOrderStatus}" sang "${newOrderStatus}". Chỉ có thể: ${allowedTransitions.join(', ')}`
    };
  }

  const finalPaymentStatus = newPaymentStatus ?? currentPaymentStatus;
  const requiredPaymentStatuses = STATUS_CONSTRAINTS.requiredPaymentByOrder[newOrderStatus];

  if (!requiredPaymentStatuses.includes(finalPaymentStatus)) {
    const readable = (v: boolean) => v ? 'Đã thanh toán' : 'Chưa thanh toán';
    return {
      valid: false,
      message: `Trạng thái "${newOrderStatus}" yêu cầu thanh toán: ${requiredPaymentStatuses.map(readable).join(' hoặc ')}. Hiện tại: ${readable(finalPaymentStatus)}`
    };
  }

  if (newOrderStatus === 'Canceled' && currentPaymentStatus === true && STATUS_CONSTRAINTS.specialRules.cannotCancelPaidOrder) {
    return {
      valid: false,
      message: 'Không thể hủy đơn hàng đã thanh toán thành công'
    };
  }

  return { valid: true };
};

export const canTransitionPaymentStatus = (
  currentPaymentStatus: boolean,
  newPaymentStatus: boolean,
  orderStatus: OrderStatus
): { valid: boolean; message?: string } => {
  // Không thay đổi gì
  if (currentPaymentStatus === newPaymentStatus) return { valid: true };

  // Đơn hàng đã hoàn thành thì không thay đổi được trạng thái thanh toán
  if (orderStatus === 'Completed' && STATUS_CONSTRAINTS.specialRules.completedOrderLocked) {
    return {
      valid: false,
      message: 'Không thể thay đổi trạng thái thanh toán của đơn hàng đã hoàn thành'
    };
  }

  // Kiểm tra chuyển đổi hợp lệ không
  const allowedTransitions = STATUS_CONSTRAINTS.validPaymentTransitions[
    currentPaymentStatus.toString() as 'true' | 'false'
  ];
  if (!allowedTransitions.includes(newPaymentStatus)) {
    return {
      valid: false,
      message: `Không thể chuyển thanh toán từ "${currentPaymentStatus}" sang "${newPaymentStatus}". Chỉ có thể: ${allowedTransitions.join(', ')}`
    };
  }

  // Kiểm tra trạng thái đơn hàng có hợp lệ với trạng thái thanh toán mới không
  const allowedOrderStatuses = STATUS_CONSTRAINTS.allowedOrderByPayment[
    newPaymentStatus.toString() as 'true' | 'false'
  ];
  if (!allowedOrderStatuses.includes(orderStatus)) {
    return {
      valid: false,
      message: `Trạng thái thanh toán "${newPaymentStatus}" không áp dụng được cho đơn hàng "${orderStatus}".`
    };
  }

  return { valid: true };
};


export const getAvailableOrderStatuses = (
  currentOrderStatus: OrderStatus,
  currentPaymentStatus: boolean
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

export const getAllValidOrderStatuses = (
  currentPaymentStatus: boolean
): OrderStatus[] => {
  const allOrderStatuses: OrderStatus[] = ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'];

  return allOrderStatuses.filter(orderStatus => {
    return isValidStatusPair(orderStatus, currentPaymentStatus);
  });
};

export const getAvailablePaymentStatuses = (
  currentPaymentStatus: boolean,
  orderStatus: OrderStatus
): boolean[] => {
  const key = currentPaymentStatus.toString() as 'true' | 'false';
  const possibleTransitions = STATUS_CONSTRAINTS.validPaymentTransitions[key];

  return possibleTransitions.filter(newPaymentStatus => {
    const validation = canTransitionPaymentStatus(
      currentPaymentStatus,
      newPaymentStatus,
      orderStatus
    );
    return validation.valid;
  });
};

export const getAllValidPaymentStatuses = (
  orderStatus: OrderStatus
): boolean[] => {
  const allPaymentStatuses: boolean[] = [true, false];

  return allPaymentStatuses.filter(paymentStatus => {
    return isValidStatusPair(orderStatus, paymentStatus);
  });
};

export const getValidStatusPairs = (): Array<{
  orderStatus: OrderStatus;
  paymentStatus: boolean;
  label: string;
  disabled?: boolean;
}> => {
  const readable = (v: boolean) => v ? 'Đã thanh toán' : 'Chưa thanh toán';
  return STATUS_CONSTRAINTS.validStatusPairs.map(([orderStatus, paymentStatus]) => ({
    orderStatus,
    paymentStatus,
    label: `${getOrderStatusLabel(orderStatus)} - ${readable(paymentStatus)}`,
    disabled: false
  }));
};

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

export const getPaymentStatusColor = (status: boolean): string => {
  return status ? 'green' : 'orange';
};

export const getAvailableActions = (
  orderStatus: OrderStatus,
  paymentStatus: boolean,
  userRole: string
): {
  canEdit: boolean;
  canCancel: boolean;
  canConfirm: boolean;
  canProcess: boolean;
  canComplete: boolean;
  canUpdatePayment: boolean;
  availableOrderTransitions: OrderStatus[];
  availablePaymentTransitions: boolean[];
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

export const validateStatusUpdate = (
  currentOrderStatus: OrderStatus,
  currentPaymentStatus: boolean,
  newOrderStatus?: OrderStatus,
  newPaymentStatus?: boolean
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

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

  if (newPaymentStatus !== undefined && newPaymentStatus !== currentPaymentStatus) {
    const paymentValidation = canTransitionPaymentStatus(
      currentPaymentStatus,
      newPaymentStatus,
      newOrderStatus || currentOrderStatus
    );
    if (!paymentValidation.valid) {
      errors.push(paymentValidation.message || 'Lỗi chuyển đổi trạng thái thanh toán');
    }
  }

  const finalOrderStatus = newOrderStatus || currentOrderStatus;
  const finalPaymentStatus = newPaymentStatus ?? currentPaymentStatus;

  if (!isValidStatusPair(finalOrderStatus, finalPaymentStatus)) {
    const readable = (v: boolean) => v ? 'Đã thanh toán' : 'Chưa thanh toán';
    errors.push(`Cặp trạng thái "${finalOrderStatus}" - "${readable(finalPaymentStatus)}" không hợp lệ`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const getPaymentStatusLabel = (status: boolean): string =>
  status ? 'Đã thanh toán' : 'Chưa thanh toán';