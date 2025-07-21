import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Select, 
  DatePicker, 
  message, 
  Tooltip,
  Card,
  Space,
  Row,
  Col,
  Input,
  InputNumber,
  Switch,
} from 'antd';
import { 
  EditOutlined, 
  PlusOutlined, 
  SearchOutlined,
  ClearOutlined,
  MailOutlined,
  FileTextOutlined,
  EyeOutlined,
      ShoppingCartOutlined,
    DollarOutlined,
    SyncOutlined,
  } from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';
import StiResultService, { StiResult, CreateStiResultRequest, UpdateStiResultRequest } from '../../../../services/stiResultService';
import StatusUpdateModal from '../../../../components/sti/StatusUpdateModal';
import { 
  OrderStatus, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOrderStatusLabel, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPaymentStatusLabel, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOrderStatusColor, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPaymentStatusColor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableActions
} from '../../../../utils/stiStatusUtils';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
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

interface OrderFilters {
  page: number;
  limit: number;
  order_status?: string;
  is_paid?: boolean;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

interface OrdersManagementProps {
  refreshTrigger: number;
}

const OrdersManagement: React.FC<OrdersManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [results, setResults] = useState<StiResult[]>([]);
  const [availableTests, setAvailableTests] = useState<StiTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] = useState(false);
  
  // Selected items
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<StiOrder | null>(null);
  const [editingResult, setEditingResult] = useState<StiResult | null>(null);
  
  // Forms
  const [orderForm] = Form.useForm();
  const [resultForm] = Form.useForm();
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    sort_by: 'order_date',
    sort_order: 'desc'
  });
  
  // Filter form states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [amountRange, setAmountRange] = useState<[number?, number?]>([undefined, undefined]);

  // Fetch data on mount and refresh
  useEffect(() => {
    fetchOrders();
    fetchAvailableTests();
    fetchAvailablePackages();
  }, [filters, refreshTrigger]);

  // Handle search button click


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get(`${API.STI.GET_ALL_ORDERS_PAGINATED}?${params.toString()}`);
      const resData = (response as any).data;

      if (resData?.success) {
        const mapped = (resData.data?.orders || resData.data?.items || []).map((item: any) => ({
          ...item,
          customer_name: item.customer?.full_name || item.customer_id?.full_name,
          customer_email: item.customer?.email || item.customer_id?.email,
          customer_phone: item.customer?.phone || item.customer_id?.phone
        }));
        setOrders(mapped);
        setTotal(resData.data?.pagination?.total_items || resData.pagination?.total_items || 0);
        setCurrentPage(resData.data?.pagination?.current_page || resData.pagination?.current_page || 1);
      } else {
        message.error(resData?.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
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
    } catch (_error) {
      message.error('Lỗi khi tải kết quả');
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateRange(null);
    setAmountRange([undefined, undefined]);
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'order_date',
      sort_order: 'desc'
    });
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    if (dates) {
      setFilters(prev => ({
        ...prev,
        page: 1,
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => {
        const newFilters = { ...prev, page: 1 };
        delete newFilters.date_from;
        delete newFilters.date_to;
        return newFilters;
      });
    }
  };

  const handleAmountRangeChange = (type: 'min' | 'max', value: number | null) => {
    const newRange = [...amountRange] as [number?, number?];
    newRange[type === 'min' ? 0 : 1] = value || undefined;
    setAmountRange(newRange);
    
    setFilters(prev => ({
      ...prev,
      page: 1,
      min_amount: newRange[0],
      max_amount: newRange[1]
    }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    handleFilterChange('order_status', value === 'all' ? undefined : value);
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    setPaymentStatusFilter(value);
    handleFilterChange('is_paid', value === 'all' ? undefined : value);
  };

  // Order management handlers
  const handleEditOrder = (order: StiOrder) => {
    setEditingOrder(order);
    orderForm.setFieldsValue({
      order_date: order.order_date ? dayjs(order.order_date) : null,
      notes: order.notes,
      sti_package_id: order.sti_package_item?.sti_package_id || null,
      sti_test_items: order.sti_test_items || [],
      total_amount: order.total_amount,
      order_status: order.order_status,
      is_paid: order.is_paid
    });
    setOrderModalVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      const values = await orderForm.validateFields();
      
      if (editingOrder) {
        let calculatedTotal = 0;
        
        if (values.sti_package_id) {
          const selectedPackage = availablePackages.find(p => p._id === values.sti_package_id);
          if (selectedPackage) {
            calculatedTotal += selectedPackage.price;
          }
        }
        
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
          is_paid: values.is_paid === true || values.is_paid === 'true',
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
    
    if (values.sti_package_id) {
      const selectedPackage = availablePackages.find(p => p._id === values.sti_package_id);
      if (selectedPackage) {
        total += selectedPackage.price;
      }
    }
    
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

  // Result management handlers
  const handleCreateResult = (order: StiOrder) => {
    setSelectedOrder(order);
    setEditingResult(null);
    resultForm.resetFields();
    setResultModalVisible(true);
  };

  const handleEditResult = (result: StiResult) => {
    setEditingResult(result);
    setSelectedOrder(null);
    
    resultForm.setFieldsValue({
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

  const handleResultSubmit = async () => {
    try {
      const values = await resultForm.validateFields();
      
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
        } else {
          message.error(response.message || 'Lỗi khi tạo kết quả');
        }
      }
      
      setResultModalVisible(false);
      resultForm.resetFields();
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

  // Handle status update
  const handleStatusUpdate = (order: StiOrder) => {
    setSelectedOrder(order);
    setStatusUpdateModalVisible(true);
  };

  const handleStatusUpdateSubmit = async (orderStatus: OrderStatus, is_paid: boolean|string) => {
    if (!selectedOrder) return;

    try {
      const response = await apiClient.patch(API.STI.UPDATE_ORDER_STATUS(selectedOrder._id), {
        order_status: orderStatus,
        is_paid: is_paid === true || is_paid === 'true'
      });

      if ((response as any).data?.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchOrders(); // Refresh orders list
        setStatusUpdateModalVisible(false);
      } else {
        message.error((response as any).data?.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
      message.error(errorMessage);
    }
  };

  // Utility functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Booked: 'blue',
      Accepted: 'cyan',
      Processing: 'orange',
      SpecimenCollected: 'purple',
      Testing: 'geekblue',
      Completed: 'green',
      Canceled: 'red'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      false: 'orange',
      true: 'green'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      Booked: 'Đã đặt lịch',
      Accepted: 'Đã chấp nhận',
      Processing: 'Đang xử lý',
      SpecimenCollected: 'Đã lấy mẫu',
      Testing: 'Đang xét nghiệm',
      Completed: 'Hoàn thành',
      Canceled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      false: 'Chờ thanh toán',
      true: 'Đã thanh toán'
    };
    return texts[status] || status;
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const { current, pageSize } = pagination;
    
    setFilters(prev => ({
      ...prev,
      page: current,
      limit: pageSize,
      sort_by: sorter.field || 'order_date',
      sort_order: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  const columns = [
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
      width: 180,
      render: (record: StiOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.customer_name || record.customer?.full_name || record.customer_id?.full_name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customer_email || record.customer?.email || record.customer_id?.email || 'N/A'}
          </div>
          {(record.customer_phone || record.customer?.phone) && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.customer_phone || record.customer?.phone}
            </div>
          )}
        </div>
      )
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
      title: 'Ngày xét nghiệm',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 140,
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 140,
      sorter: true,
      render: (amount: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatPrice(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'order_status',
      key: 'order_status',
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'is_paid',
      key: 'is_paid',
      width: 120,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 280,
      render: (_: any, record: StiOrder) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setDetailModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
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
          <Tooltip title="Cập nhật trạng thái">
            <Button
              icon={<SyncOutlined />}
              onClick={() => handleStatusUpdate(record)}
              size="small"
              type="dashed"
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
        </Space>
      )
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
              icon={<MailOutlined  />}
              onClick={() => handleNotifyResult(record._id)}
              size="small"
            >
              Gửi mail
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Advanced Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Trạng thái đơn
            </label>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Option value="all">Tất cả</Option>
              <Option value="Booked">Đã đặt lịch</Option>
              <Option value="Accepted">Đã chấp nhận</Option>
              <Option value="Processing">Đang xử lý</Option>
              <Option value="SpecimenCollected">Đã lấy mẫu</Option>
              <Option value="Testing">Đang xét nghiệm</Option>
              <Option value="Completed">Hoàn thành</Option>
              <Option value="Canceled">Đã hủy</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Trạng thái thanh toán
            </label>
            <Select
              style={{ width: '100%' }}
              value={paymentStatusFilter}
              onChange={handlePaymentStatusFilterChange}
            >
              <Option value="all">Tất cả</Option>
              <Option value="false">Chờ thanh toán</Option>
              <Option value="true">Đã thanh toán</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Khoảng thời gian
            </label>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => handleDateRangeChange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Số tiền tối thiểu
            </label>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
              value={amountRange[0]}
              onChange={(value) => handleAmountRangeChange('min', value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Số tiền tối đa
            </label>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="∞"
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
              value={amountRange[1]}
              onChange={(value) => handleAmountRangeChange('max', value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'grid', alignItems: 'end' }}>
            <Button 
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>

      {/* Results Table */}
      {results.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <h3>Kết quả xét nghiệm</h3>
          <Table
            columns={resultColumns}
            dataSource={results}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đơn hàng"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
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
                <strong>Khách hàng:</strong> {selectedOrder.customer_name || selectedOrder.customer?.full_name || selectedOrder.customer_id?.full_name || 'N/A'}
              </Col>
              <Col span={12}>
                <strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.customer?.email || selectedOrder.customer_id?.email || 'N/A'}
              </Col>
              {(selectedOrder.customer_phone || selectedOrder.customer?.phone || selectedOrder.customer_id?.phone) && (
                <Col span={12}>
                  <strong>Số điện thoại:</strong> {selectedOrder.customer_phone || selectedOrder.customer?.phone || selectedOrder.customer_id?.phone}
                </Col>
              )}
              <Col span={12}>
                <strong>Ngày xét nghiệm:</strong> {dayjs(selectedOrder.order_date).format('DD/MM/YYYY')}
              </Col>
              <Col span={12}>
                <strong>Tổng tiền:</strong> {formatPrice(selectedOrder.total_amount)}
              </Col>
              <Col span={12}>
                <strong>Trạng thái:</strong> 
                <Tag color={getStatusColor(selectedOrder.order_status)} style={{ marginLeft: 8 }}>
                  {getStatusText(selectedOrder.order_status)}
                </Tag>
              </Col>
              <Col span={24}>
                <strong>Ghi chú:</strong> {selectedOrder.notes || 'Không có'}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
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
                name="is_paid"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
              >
                <Select>
                  <Option value="false">Chờ thanh toán</Option>
                  <Option value="true">Đã thanh toán</Option>
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
            <Input.TextArea rows={3} placeholder="Nhập ghi chú cho đơn hàng..." />
          </Form.Item>
        </Form>
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
        onOk={handleResultSubmit}
        onCancel={() => setResultModalVisible(false)}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={resultForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Kết quả"
                name="result_value"
              >
                <Input.TextArea rows={3} placeholder="Nhập kết quả xét nghiệm..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chẩn đoán"
                name="diagnosis"
              >
                <Input.TextArea rows={3} placeholder="Nhập chẩn đoán..." />
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
          </Row>

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Status Update Modal */}
      {selectedOrder && (
        <StatusUpdateModal
          visible={statusUpdateModalVisible}
          onClose={() => setStatusUpdateModalVisible(false)}
          onUpdate={handleStatusUpdateSubmit}
          currentOrderStatus={selectedOrder.order_status as OrderStatus}
          currentPaymentStatus={selectedOrder.is_paid}
          orderId={selectedOrder._id}
          orderCode={selectedOrder.order_code}
          customerName={selectedOrder.customer_name || selectedOrder.customer_id?.full_name}
          userRole={user?.role || 'staff'}
          loading={loading}
        />
      )}
    </div>
  );
};

export default OrdersManagement; 