import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Switch, 
  Row, 
  Col, 
  message, 
  Tooltip,
  Card,
  Statistic,
  Badge,
  Divider,
  Alert
} from 'antd';
import { 
  FileTextOutlined, 
  EditOutlined, 
  PlusOutlined, 
  MailOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import StiResultService, { StiResult, CreateStiResultRequest, UpdateStiResultRequest } from '../../../../services/stiResultService';
import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface StiOrder {
  _id: string;
  order_code: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  customer?: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  order_status: string;
  is_paid: boolean;
  order_date: string;
  notes?: string;
  created_at: string;
}

interface ResultsManagementProps {
  refreshTrigger: number;
}

const ResultsManagement: React.FC<ResultsManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [results, setResults] = useState<StiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [editingResult, setEditingResult] = useState<StiResult | null>(null);
  
  // Modal states
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  
  // Form
  const [form] = Form.useForm();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    fetchCompletedOrders();
    fetchAllResults();
  }, [refreshTrigger]);

  const fetchAllResults = async () => {
    try {
      const response = await StiResultService.getStiResults();
      if (response.success && response.data) {
        // Đảm bảo results luôn là array
        const resultsData = Array.isArray(response.data) ? response.data : [];
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching all results:', error);
      setResults([]); // Reset về array rỗng khi có lỗi
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API.STI.GET_ALL_ORDERS_PAGINATED, {
        params: {
          page: 1,
          limit: 100,
          order_status: 'Completed' // Chỉ lấy đơn hàng đã hoàn thành
        }
      });
      
      const resData = (response as any).data;
      if (resData?.success) {
        const ordersData = resData.data?.orders || resData.data?.items || [];
        const mapped = ordersData.map((item: any) => ({
          ...item,
          // Backend trả về customer info từ aggregation pipeline
          customer_name: item.customer?.full_name || item.customer_id?.full_name || item.customer_name || 'N/A',
          customer_email: item.customer?.email || item.customer_id?.email || item.customer_email || 'N/A',
          customer_phone: item.customer?.phone || item.customer_id?.phone || item.customer_phone || 'N/A'
        }));
        setOrders(mapped);
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchResultsByOrder = async (orderId: string) => {
    try {
      const response = await StiResultService.getStiResults(orderId);
      if (response.success && response.data) {
        // Đảm bảo results luôn là array
        const resultsData = Array.isArray(response.data) ? response.data : [];
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      message.error('Lỗi khi tải kết quả');
      setResults([]); // Reset về array rỗng khi có lỗi
    }
  };

  const handleCreateResult = (order: StiOrder) => {
    setSelectedOrder(order);
    setEditingResult(null);
    form.resetFields();
    setResultModalVisible(true);
  };

  const handleEditResult = (result: StiResult) => {
    setEditingResult(result);
    setSelectedOrder(null);
    
    form.setFieldsValue({
      result_value: result.result_value,
      diagnosis: result.diagnosis,
      is_confirmed: result.is_confirmed,
      is_critical: result.is_critical,
      is_notified: result.is_notified,
      notes: result.notes,
      time_result: result.time_result ? dayjs(result.time_result) : null
    });
    
    setResultModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingResult) {
        const updateData: UpdateStiResultRequest = {
          result_value: values.result_value,
          diagnosis: values.diagnosis,
          is_confirmed: values.is_confirmed,
          is_critical: values.is_critical,
          notes: values.notes,
          time_result: values.time_result ? values.time_result.toDate() : undefined
        };
        
        const response = await StiResultService.updateStiResult(editingResult._id, updateData);
        if (response.success) {
          message.success('Cập nhật kết quả thành công');
          fetchResultsByOrder(editingResult.order_id);
        } else {
          message.error(response.message || 'Lỗi khi cập nhật kết quả');
        }
      } else if (selectedOrder) {
        const createData: CreateStiResultRequest = {
          result_value: values.result_value,
          diagnosis: values.diagnosis,
          is_confirmed: values.is_confirmed,
          is_critical: values.is_critical,
          is_notified: values.is_notified,
          notes: values.notes
        };
        
        const response = await StiResultService.createStiResult(selectedOrder._id, createData);
        if (response.success) {
          message.success('Tạo kết quả thành công');
          fetchResultsByOrder(selectedOrder._id);
          fetchCompletedOrders(); // Refresh orders list
        } else {
          message.error(response.message || 'Lỗi khi tạo kết quả');
        }
      }
      
      setResultModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleNotifyResult = async (resultId: string) => {
    try {
      const response = await StiResultService.notifyResult(resultId);
      if (response.success) {
        message.success('Gửi thông báo thành công');
        const result = results.find(r => r._id === resultId);
        if (result) {
          fetchResultsByOrder(result.order_id);
        }
      } else {
        message.error(response.message || 'Lỗi khi gửi thông báo');
      }
    } catch (error) {
      message.error('Lỗi khi gửi thông báo');
    }
  };

  const handleDeactivateResult = async (resultId: string) => {
    try {
      const response = await StiResultService.updateStiResult(resultId, { is_active: false });
      if (response.success) {
        message.success('Đã vô hiệu hóa kết quả');
        const result = results.find(r => r._id === resultId);
        if (result) {
          fetchResultsByOrder(result.order_id);
        }
      } else {
        message.error(response.message || 'Lỗi khi vô hiệu hóa kết quả');
      }
    } catch (error) {
      message.error('Lỗi khi vô hiệu hóa kết quả');
    }
  };

  const handleSyncSample = async (orderId: string) => {
    try {
      const response = await StiResultService.syncSampleFromOrder(orderId);
      if (response.success) {
        message.success('Đồng bộ sample thành công');
        fetchResultsByOrder(orderId);
      } else {
        message.error(response.message || 'Lỗi khi đồng bộ sample');
      }
    } catch (error) {
      message.error('Lỗi khi đồng bộ sample');
    }
  };

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.order_status === statusFilter;
    
    return statusMatch;
  });

  // Filter results based on status
  const filteredResults = Array.isArray(results) ? results.filter(result => {
    const statusMatch = statusFilter === 'all' || result.is_confirmed === (statusFilter === 'Confirmed');
    
    return statusMatch;
  }) : [];

  // Calculate statistics
  const totalOrders = filteredOrders.length;
  const ordersWithResults = filteredOrders.filter(order => 
    Array.isArray(results) && results.some(result => result.order_id === order._id)
    ).length;
  const criticalResults = filteredResults.filter(result => result.is_critical).length;
  const pendingNotifications = filteredResults.filter(result => 
    result.is_confirmed && !result.is_notified
  ).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 120,
      render: (code: string, record: StiOrder) => (
        <span>{code || (record._id ? record._id.slice(-8) : 'N/A')}</span>
      )
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 220,
      render: (record: StiOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.customer_name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customer_email || 'N/A'}
          </div>
          {record.customer_phone && record.customer_phone !== 'N/A' && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.customer_phone}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Ngày xét nghiệm',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatPrice(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái kết quả',
      key: 'result_status',
      width: 140,
      render: (record: StiOrder) => {
        const orderResults = Array.isArray(results) ? results.filter(r => r.order_id === record._id) : [];
        if (orderResults.length === 0) {
          return <Tag color="orange">Chưa có kết quả</Tag>;
        }
        const hasConfirmed = orderResults.some(r => r.is_confirmed);
        const hasNotified = orderResults.some(r => r.is_notified);
        const hasCritical = orderResults.some(r => r.is_critical);
        
        return (
          <Space direction="vertical" size="small">
            {hasConfirmed ? (
              <Tag color="green">Đã xác nhận</Tag>
            ) : (
              <Tag color="orange">Chưa xác nhận</Tag>
            )}
            {hasCritical && <Tag color="red">Nghiêm trọng</Tag>}
            {hasNotified && <Tag color="blue">Đã thông báo</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 250,
      render: (record: StiOrder) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setOrderDetailModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Tạo kết quả">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreateResult(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Xem kết quả">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => fetchResultsByOrder(record._id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Đồng bộ sample">
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleSyncSample(record._id)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const resultColumns = [
    {
      title: 'Đơn hàng',
      key: 'order',
      width: 120,
      render: (record: StiResult) => {
        const order = orders.find(o => o._id === record.order_id);
        return <span>{order?.order_code || (record.order_id ? record.order_id.slice(-8) : 'N/A')}</span>;
      }
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (record: StiResult) => {
        const order = orders.find(o => o._id === record.order_id);
        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {order?.customer_name || 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {order?.customer_email || 'N/A'}
            </div>
            {order?.customer_phone && order.customer_phone !== 'N/A' && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {order.customer_phone}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Kết quả',
      dataIndex: 'result_value',
      key: 'result_value',
      width: 200,
      render: (text: string) => (
        <div style={{ 
          maxWidth: 200, 
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap' 
        }}>
          {text || 'Chưa có kết quả'}
        </div>
      )
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 200,
      render: (text: string) => (
        <div style={{ 
          maxWidth: 200, 
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap' 
        }}>
          {text || 'Chưa có chẩn đoán'}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      render: (record: StiResult) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_confirmed ? 'green' : 'orange'}>
            {record.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
          </Tag>
          {record.is_critical && <Tag color="red">Nghiêm trọng</Tag>}
          {record.is_notified && <Tag color="blue">Đã thông báo</Tag>}
          {!record.is_active && <Tag color="gray">Đã vô hiệu hóa</Tag>}
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (record: StiResult) => (
        <Space size="small">
          <Tooltip title="Sửa kết quả">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditResult(record)}
              size="small"
            />
          </Tooltip>
          {record.is_confirmed && !record.is_notified && (
            <Tooltip title="Gửi thông báo">
              <Button
                type="primary"
                icon={<MailOutlined />}
                onClick={() => handleNotifyResult(record._id)}
                size="small"
              />
            </Tooltip>
          )}
          {record.is_active && (
            <Tooltip title="Vô hiệu hóa">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeactivateResult(record._id)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Có kết quả"
              value={ordersWithResults}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Kết quả nghiêm trọng"
              value={criticalResults}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ thông báo"
              value={pendingNotifications}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Trạng thái
            </label>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả</Option>
              <Option value="Confirmed">Đã xác nhận</Option>
              <Option value="Unconfirmed">Chưa xác nhận</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ display: 'flex', alignItems: 'end' }}>
            <Button 
              icon={<ClearOutlined />}
              onClick={() => {
                setStatusFilter('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card style={{ marginBottom: 16 }}>
        <h3>Đơn hàng đã hoàn thành</h3>
        <Table
          columns={orderColumns}
          dataSource={filteredOrders}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <h3>Kết quả xét nghiệm</h3>
          <Table
            columns={resultColumns}
            dataSource={results}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1400 }}
            size="small"
          />
        </Card>
      )}

      {/* Order Detail Modal */}
      <Modal
        title="Chi tiết đơn hàng"
        open={orderDetailModalVisible}
        onCancel={() => setOrderDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Mã đơn:</strong> {selectedOrder.order_code || selectedOrder._id}
              </Col>
              <Col span={12}>
                <strong>Khách hàng:</strong> {selectedOrder.customer_name}
              </Col>
              <Col span={12}>
                <strong>Email:</strong> {selectedOrder.customer_email}
              </Col>
              <Col span={12}>
                <strong>Ngày xét nghiệm:</strong> {dayjs(selectedOrder.order_date).format('DD/MM/YYYY')}
              </Col>
              <Col span={12}>
                <strong>Tổng tiền:</strong> {formatPrice(selectedOrder.total_amount)}
              </Col>
              <Col span={12}>
                <strong>Trạng thái:</strong> 
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {selectedOrder.order_status}
                </Tag>
              </Col>
              <Col span={24}>
                <strong>Ghi chú:</strong> {selectedOrder.notes || 'Không có'}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Create/Edit Result Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined />
            {editingResult ? 'Cập nhật kết quả' : 'Tạo kết quả mới'}
          </div>
        }
        open={resultModalVisible}
        onOk={handleSubmit}
        onCancel={() => setResultModalVisible(false)}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          {selectedOrder && (
            <Alert
              message={`Tạo kết quả cho đơn hàng: ${selectedOrder.order_code || selectedOrder._id}`}
              description={`Khách hàng: ${selectedOrder.customer_name} (${selectedOrder.customer_email})`}
              type="info"
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Kết quả xét nghiệm"
                name="result_value"
                rules={[{ required: true, message: 'Vui lòng nhập kết quả' }]}
              >
                <TextArea rows={4} placeholder="Nhập kết quả xét nghiệm chi tiết..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chẩn đoán"
                name="diagnosis"
                rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}
              >
                <TextArea rows={4} placeholder="Nhập chẩn đoán của bác sĩ..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Thời gian có kết quả"
                name="time_result"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Đã xác nhận"
                    name="is_confirmed"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Nghiêm trọng"
                    name="is_critical"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Đã thông báo"
                    name="is_notified"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item
            label="Ghi chú thêm"
            name="notes"
          >
            <TextArea rows={3} placeholder="Nhập ghi chú bổ sung..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ResultsManagement; 