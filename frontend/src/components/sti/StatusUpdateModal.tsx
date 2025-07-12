import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Alert, Space, Tag, Button, message } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  OrderStatus,
  PaymentStatus,
  getAvailableOrderStatuses,
  getAvailablePaymentStatuses,
  getAllValidOrderStatuses,
  getAllValidPaymentStatuses,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getOrderStatusColor,
  getPaymentStatusColor,
  validateStatusUpdate,
  getAvailableActions,
  isValidStatusPair
} from '../../utils/stiStatusUtils';

interface StatusUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (orderStatus: OrderStatus, paymentStatus: PaymentStatus) => Promise<void>;
  currentOrderStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  orderId: string;
  orderCode?: string;
  customerName?: string;
  userRole: string;
  loading?: boolean;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  visible,
  onClose,
  onUpdate,
  currentOrderStatus,
  currentPaymentStatus,
  orderId,
  orderCode,
  customerName,
  userRole,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus>(currentOrderStatus);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<any>({});

  useEffect(() => {
    if (visible) {
      setSelectedOrderStatus(currentOrderStatus);
      setSelectedPaymentStatus(currentPaymentStatus);
      form.setFieldsValue({
        order_status: currentOrderStatus,
        payment_status: currentPaymentStatus
      });
      
      // Cập nhật available actions
      const actions = getAvailableActions(currentOrderStatus, currentPaymentStatus, userRole);
      setAvailableActions(actions);
    }
  }, [visible, currentOrderStatus, currentPaymentStatus, userRole, form]);

  // Validate khi thay đổi trạng thái
  useEffect(() => {
    const validation = validateStatusUpdate(
      currentOrderStatus,
      currentPaymentStatus,
      selectedOrderStatus,
      selectedPaymentStatus
    );
    setValidationErrors(validation.errors);
  }, [selectedOrderStatus, selectedPaymentStatus, currentOrderStatus, currentPaymentStatus]);

  const handleOrderStatusChange = (value: OrderStatus) => {
    setSelectedOrderStatus(value);
    
    // Tự động điều chỉnh payment status nếu cần
    if (!isValidStatusPair(value, selectedPaymentStatus)) {
      const availablePaymentStatuses = getAvailablePaymentStatuses(selectedPaymentStatus, value);
      if (availablePaymentStatuses.length > 0) {
        setSelectedPaymentStatus(availablePaymentStatuses[0]);
        form.setFieldValue('payment_status', availablePaymentStatuses[0]);
      }
    }
  };

  const handlePaymentStatusChange = (value: PaymentStatus) => {
    setSelectedPaymentStatus(value);
    
    // Tự động điều chỉnh order status nếu cần
    if (!isValidStatusPair(selectedOrderStatus, value)) {
      const availableOrderStatuses = getAvailableOrderStatuses(selectedOrderStatus, value);
      if (availableOrderStatuses.length > 0) {
        setSelectedOrderStatus(availableOrderStatuses[0]);
        form.setFieldValue('order_status', availableOrderStatuses[0]);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const validation = validateStatusUpdate(
        currentOrderStatus,
        currentPaymentStatus,
        selectedOrderStatus,
        selectedPaymentStatus
      );

      if (!validation.valid) {
        message.error('Cặp trạng thái không hợp lệ');
        return;
      }

      await onUpdate(selectedOrderStatus, selectedPaymentStatus);
      message.success('Cập nhật trạng thái thành công');
      onClose();
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const getAvailableOrderOptions = () => {
    // Chỉ hiển thị các trạng thái có thể chuyển đổi từ trạng thái hiện tại
    const available = getAvailableOrderStatuses(currentOrderStatus, selectedPaymentStatus);
    return available.map(status => ({
      value: status,
      label: getOrderStatusLabel(status),
      color: getOrderStatusColor(status)
    }));
  };

  const getAvailablePaymentOptions = () => {
    // Chỉ hiển thị các trạng thái có thể chuyển đổi từ trạng thái hiện tại
    const available = getAvailablePaymentStatuses(currentPaymentStatus, selectedOrderStatus);
    return available.map(status => ({
      value: status,
      label: getPaymentStatusLabel(status),
      color: getPaymentStatusColor(status)
    }));
  };

  const isStatusChanged = selectedOrderStatus !== currentOrderStatus || selectedPaymentStatus !== currentPaymentStatus;
  const hasValidationErrors = validationErrors.length > 0;

  return (
    <Modal
      title="Cập nhật trạng thái đơn hàng"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!isStatusChanged || hasValidationErrors}
          onClick={handleSubmit}
        >
          Cập nhật
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <h4>Thông tin đơn hàng</h4>
        <p><strong>Mã đơn:</strong> {orderCode || orderId}</p>
        {customerName && <p><strong>Khách hàng:</strong> {customerName}</p>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4>Trạng thái hiện tại</h4>
        <Space>
          <Tag color={getOrderStatusColor(currentOrderStatus)}>
            {getOrderStatusLabel(currentOrderStatus)}
          </Tag>
          <Tag color={getPaymentStatusColor(currentPaymentStatus)}>
            {getPaymentStatusLabel(currentPaymentStatus)}
          </Tag>
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Trạng thái đơn hàng"
          name="order_status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái đơn hàng' }]}
        >
          <Select
            value={selectedOrderStatus}
            onChange={handleOrderStatusChange}
            disabled={!availableActions.canEdit}
          >
            {getAvailableOrderOptions().map(option => (
              <Select.Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Trạng thái thanh toán"
          name="payment_status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
        >
          <Select
            value={selectedPaymentStatus}
            onChange={handlePaymentStatusChange}
            disabled={!availableActions.canUpdatePayment}
          >
            {getAvailablePaymentOptions().map(option => (
              <Select.Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      {/* Hiển thị trạng thái mới */}
      {isStatusChanged && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 6 }}>
          <h4 style={{ margin: 0, marginBottom: 8 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            Trạng thái mới
          </h4>
          <Space>
            <Tag color={getOrderStatusColor(selectedOrderStatus)}>
              {getOrderStatusLabel(selectedOrderStatus)}
            </Tag>
            <Tag color={getPaymentStatusColor(selectedPaymentStatus)}>
              {getPaymentStatusLabel(selectedPaymentStatus)}
            </Tag>
          </Space>
        </div>
      )}

      {/* Hiển thị lỗi validation */}
      {hasValidationErrors && (
        <Alert
          message="Cặp trạng thái không hợp lệ"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Hiển thị thông tin về các hành động có thể thực hiện */}
      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: '#52c41a' }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Hành động có thể thực hiện
        </h4>
        <Space wrap>
          {availableActions.canConfirm && (
            <Tag color="blue">Có thể xác nhận</Tag>
          )}
          {availableActions.canProcess && (
            <Tag color="orange">Có thể xử lý</Tag>
          )}
          {availableActions.canComplete && (
            <Tag color="green">Có thể hoàn thành</Tag>
          )}
          {availableActions.canCancel && (
            <Tag color="red">Có thể hủy</Tag>
          )}
          {availableActions.canUpdatePayment && (
            <Tag color="purple">Có thể cập nhật thanh toán</Tag>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default StatusUpdateModal; 