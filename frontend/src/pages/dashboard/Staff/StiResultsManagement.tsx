import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Input, Select, Switch, DatePicker, message, Space, Tag, Card, Row, Col, Divider, InputNumber, Tooltip, Descriptions } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  SyncOutlined, 
  MailOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import StiResultService, { StiResult, CreateStiResultRequest, UpdateStiResultRequest } from '../../../services/stiResultService';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface StiTest {
  _id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  category: string;
  sti_test_type: string;
  is_active: boolean;
}

interface StiPackage {
  _id: string;
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
  is_active: boolean;
}

interface StiOrder {
  _id: string;
  order_code: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  order_date: string;
  notes?: string;
  created_at: string;
  sti_package_item?: {
    sti_package_id: string;
    sti_test_ids: string[];
    package_name?: string;
    test_names?: string[];
  };
  sti_test_items?: string[];
  sti_test_details?: StiTest[];
  sti_package_details?: StiPackage[];
}

const StiResultsManagement: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [results, setResults] = useState<StiResult[]>([]);
  const [availableTests, setAvailableTests] = useState<StiTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [editingResult, setEditingResult] = useState<StiResult | null>(null);
  const [editingOrder, setEditingOrder] = useState<StiOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [form] = Form.useForm();
  const [orderForm] = Form.useForm();

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
    fetchAvailableTests();
    fetchAvailablePackages();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API.STI.GET_ALL_ORDERS_PAGINATED, {
        params: {
          page: 1,
          limit: 50
        }
      });
      if (response.status === 200 && response.data) {
        setOrders((response.data as any)?.data?.orders || (response.data as any)?.orders || []);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const response = await apiClient.get(API.STI.GET_ALL_TESTS);
      if (response.status === 200 && (response.data as any)?.success) {
        setAvailableTests((response.data as any)?.stitest || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách test:', error);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      const response = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      if (response.status === 200 && (response.data as any)?.success) {
        setAvailablePackages((response.data as any)?.stipackage || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách gói test:', error);
    }
  };

  const fetchResultsByOrder = async (orderId: string) => {
    try {
      const response = await StiResultService.getStiResults(orderId);
      if (response.success && response.data) {
        setResults(response.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải kết quả');
    }
  };

  const handleCreateResult = async (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    setSelectedOrder(order);
    setEditingResult(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditResult = async (result: StiResult) => {
    setEditingResult(result);
    setSelectedOrder(null);
    
    // Populate form with existing data
    form.setFieldsValue({
      result_value: result.result_value,
      diagnosis: result.diagnosis,
      is_confirmed: result.is_confirmed,
      is_critical: result.is_critical,
      is_notified: result.is_notified,
      notes: result.notes,
      time_result: result.time_result ? dayjs(result.time_result) : null,
      timeReceived: result.sample?.timeReceived ? dayjs(result.sample.timeReceived) : null,
      timeTesting: result.sample?.timeTesting ? dayjs(result.sample.timeTesting) : null,
      sampleQualities: result.sample?.sampleQualities || {}
    });
    
    setModalVisible(true);
  };

  const handleEditOrder = async (order: StiOrder) => {
    setEditingOrder(order);
    
    // Populate form with existing order data
    orderForm.setFieldsValue({
      order_date: order.order_date ? dayjs(order.order_date) : null,
      notes: order.notes,
      sti_package_id: order.sti_package_item?.sti_package_id || null,
      sti_test_items: order.sti_test_items || [],
      total_amount: order.total_amount,
      order_status: order.order_status,
      payment_status: order.payment_status
    });
    
    setOrderModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingResult) {
        // Update existing result
        const updateData: UpdateStiResultRequest = {
          result_value: values.result_value,
          diagnosis: values.diagnosis,
          is_confirmed: values.is_confirmed,
          is_critical: values.is_critical,
          notes: values.notes,
          time_result: values.time_result ? values.time_result.toDate() : undefined,
          sample: {
            sampleQualities: values.sampleQualities,
            timeReceived: values.timeReceived ? values.timeReceived.toDate() : undefined,
            timeTesting: values.timeTesting ? values.timeTesting.toDate() : undefined
          }
        };
        
        const response = await StiResultService.updateStiResult(editingResult._id, updateData);
        if (response.success) {
          message.success('Cập nhật kết quả thành công');
          fetchResultsByOrder(editingResult.order_id);
        } else {
          message.error(response.message || 'Lỗi khi cập nhật kết quả');
        }
      } else if (selectedOrder) {
        // Create new result
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
        } else {
          message.error(response.message || 'Lỗi khi tạo kết quả');
        }
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleOrderSubmit = async () => {
    try {
      const values = await orderForm.validateFields();
      
      if (editingOrder) {
        // Calculate total amount based on selected package and tests
        let calculatedTotal = 0;
        
        // Add package price
        if (values.sti_package_id) {
          const selectedPackage = availablePackages.find(p => p._id === values.sti_package_id);
          if (selectedPackage) {
            calculatedTotal += selectedPackage.price;
          }
        }
        
        // Add individual test prices
        if (values.sti_test_items && values.sti_test_items.length > 0) {
          values.sti_test_items.forEach((testId: string) => {
            const selectedTest = availableTests.find(t => t._id === testId);
            if (selectedTest) {
              calculatedTotal += selectedTest.price;
            }
          });
        }
        
        const updateData = {
          order_date: values.order_date ? values.order_date.toDate() : undefined,
          notes: values.notes,
          sti_package_id: values.sti_package_id || null,
          sti_test_items: values.sti_test_items || [],
          total_amount: calculatedTotal,
          order_status: values.order_status,
          payment_status: values.payment_status
        };
        
        const response = await apiClient.patch(API.STI.UPDATE_ORDER(editingOrder._id), updateData);
        if (response.status === 200) {
          message.success('Cập nhật đơn hàng thành công');
          fetchOrders();
          setOrderModalVisible(false);
          orderForm.resetFields();
        } else {
          message.error('Lỗi khi cập nhật đơn hàng');
        }
      }
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin đơn hàng');
    }
  };

  const calculateTotalAmount = () => {
    const values = orderForm.getFieldsValue();
    let total = 0;
    
    // Add package price
    if (values.sti_package_id) {
      const selectedPackage = availablePackages.find(p => p._id === values.sti_package_id);
      if (selectedPackage) {
        total += selectedPackage.price;
      }
    }
    
    // Add individual test prices
    if (values.sti_test_items && values.sti_test_items.length > 0) {
      values.sti_test_items.forEach((testId: string) => {
        const selectedTest = availableTests.find(t => t._id === testId);
        if (selectedTest) {
          total += selectedTest.price;
        }
      });
    }
    
    orderForm.setFieldsValue({ total_amount: total });
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

  const handleNotifyResult = async (resultId: string) => {
    try {
      const response = await StiResultService.notifyResult(resultId);
      if (response.success) {
        message.success('Gửi thông báo thành công');
        // Refresh results to update notification status
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

  const getOrderStatusColor = (status: string) => {
    const colors = {
      'Booked': 'blue',
      'Accepted': 'cyan',
      'Processing': 'orange',
      'SpecimenCollected': 'purple',
      'Testing': 'gold',
      'Completed': 'green',
      'Canceled': 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'Pending': 'orange',
      'Paid': 'green',
      'Failed': 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const orderColumns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 120,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text: string, record: StiOrder) => text || record.customer_email || 'N/A'
    },
    {
      title: 'Dịch vụ',
      key: 'services',
      width: 200,
      render: (_: any, record: StiOrder) => (
        <div>
          {record.sti_package_item && (
            <Tag color="blue" style={{ marginBottom: 4 }}>
              Gói: {record.sti_package_item.package_name || 'N/A'}
            </Tag>
          )}
          {record.sti_test_items && record.sti_test_items.length > 0 && (
            <div>
              <Tag color="green">Test đơn lẻ: {record.sti_test_items.length}</Tag>
            </div>
          )}
          {!record.sti_package_item && (!record.sti_test_items || record.sti_test_items.length === 0) && (
            <Tag color="orange">Tư vấn chung</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (price: number) => `${price?.toLocaleString()} VNĐ`
    },
    {
      title: 'Trạng thái đơn hàng',
      dataIndex: 'order_status',
      key: 'order_status',
      width: 140,
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 280,
      render: (_: any, record: StiOrder) => (
        <Space size="small">
          <Tooltip title="Sửa đơn hàng">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditOrder(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Tạo kết quả">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreateResult(record._id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Xem kết quả">
            <Button
              icon={<EyeOutlined />}
              onClick={() => fetchResultsByOrder(record._id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Đồng bộ sample">
            <Button
              icon={<SyncOutlined />}
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
      title: 'Kết quả',
      dataIndex: 'result_value',
      key: 'result_value',
      render: (text: string) => text || 'Chưa có kết quả'
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (text: string) => text || 'Chưa có chẩn đoán'
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: StiResult) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_confirmed ? 'green' : 'orange'}>
            {record.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
          </Tag>
          {record.is_critical && <Tag color="red">Nghiêm trọng</Tag>}
          {record.is_notified && <Tag color="blue">Đã thông báo</Tag>}
          {!record.is_active && <Tag color="red">Đã vô hiệu hóa</Tag>}
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: StiResult) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditResult(record)}
            size="small"
          >
            Sửa
          </Button>
          {record.is_confirmed && !record.is_notified && (
            <Button
              type="primary"
              icon={<MailOutlined />}
              onClick={() => handleNotifyResult(record._id)}
              size="small"
            >
              Gửi mail
            </Button>
          )}
          {record.is_active && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeactivateResult(record._id)}
              size="small"
            >
              Vô hiệu hóa
            </Button>
          )}
        </Space>
      )
    }
  ];

  const renderSampleQualitiesForm = () => {
    const sampleQualities = form.getFieldValue('sampleQualities') || {};
    
    return (
      <div>
        <h4>Chất lượng mẫu:</h4>
        {Object.entries(sampleQualities).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>{key}:</span>
            <Select
              value={value}
              style={{ width: 120 }}
              onChange={(newValue) => {
                const newQualities = { ...sampleQualities, [key]: newValue };
                form.setFieldsValue({ sampleQualities: newQualities });
              }}
            >
              <Option value={true}>Đạt</Option>
              <Option value={false}>Không đạt</Option>
              <Option value={null}>Chưa xác định</Option>
            </Select>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Quản lý kết quả STI" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Danh sách đơn hàng</h3>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={fetchOrders}
                loading={loading}
              >
                Làm mới
              </Button>
            </div>
            <Table
              columns={orderColumns}
              dataSource={orders}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </Col>
        </Row>
        
        {results.length > 0 && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={24}>
              <h3>Kết quả xét nghiệm</h3>
              <Table
                columns={resultColumns}
                dataSource={results}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            </Col>
          </Row>
        )}
      </Card>

      {/* Modal for editing order */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCartOutlined />
            Chỉnh sửa đơn hàng
          </div>
        }
        open={orderModalVisible}
        onOk={handleOrderSubmit}
        onCancel={() => setOrderModalVisible(false)}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={orderForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày đặt hàng"
                name="order_date"
                rules={[{ required: true, message: 'Vui lòng chọn ngày đặt hàng' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái đơn hàng"
                name="order_status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Option value="Booked">Đã đặt</Option>
                  <Option value="Accepted">Đã chấp nhận</Option>
                  <Option value="Processing">Đang xử lý</Option>
                  <Option value="SpecimenCollected">Đã lấy mẫu</Option>
                  <Option value="Testing">Đang xét nghiệm</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="Canceled">Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Gói xét nghiệm"
                name="sti_package_id"
              >
                <Select
                  placeholder="Chọn gói xét nghiệm"
                  allowClear
                  onChange={calculateTotalAmount}
                >
                  {availablePackages.map(pkg => (
                    <Option key={pkg._id} value={pkg._id}>
                      {pkg.sti_package_name} - {pkg.price.toLocaleString()} VNĐ
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái thanh toán"
                name="payment_status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
              >
                <Select>
                  <Option value="Pending">Chờ thanh toán</Option>
                  <Option value="Paid">Đã thanh toán</Option>
                  <Option value="Failed">Thanh toán thất bại</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Xét nghiệm đơn lẻ"
            name="sti_test_items"
          >
            <Select
              mode="multiple"
              placeholder="Chọn các xét nghiệm đơn lẻ"
              onChange={calculateTotalAmount}
            >
              {availableTests.map(test => (
                <Option key={test._id} value={test._id}>
                  {test.sti_test_name} - {test.price.toLocaleString()} VNĐ
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tổng tiền"
                name="total_amount"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="VNĐ"
                  readOnly
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Button
                type="dashed"
                onClick={calculateTotalAmount}
                style={{ marginTop: 30 }}
                icon={<DollarOutlined />}
              >
                Tính lại tổng tiền
              </Button>
            </Col>
          </Row>

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <TextArea rows={3} placeholder="Nhập ghi chú cho đơn hàng..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for creating/editing result */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined />
            {editingResult ? 'Cập nhật kết quả' : 'Tạo kết quả mới'}
          </div>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Kết quả"
                name="result_value"
              >
                <TextArea rows={3} placeholder="Nhập kết quả xét nghiệm..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chẩn đoán"
                name="diagnosis"
              >
                <TextArea rows={3} placeholder="Nhập chẩn đoán..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Thời gian nhận kết quả"
                name="time_result"
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Thời gian nhận mẫu"
                name="timeReceived"
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Thời gian xét nghiệm"
                name="timeTesting"
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

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

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <TextArea rows={3} placeholder="Nhập ghi chú..." />
          </Form.Item>

          {editingResult && (
            <Form.Item>
              <Divider>Thông tin mẫu</Divider>
              {renderSampleQualitiesForm()}
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default StiResultsManagement; 