import React, { useState, useEffect } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import {SpecializationType} from '../../../../../../backend/src/models/Consultant';

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
} from 'antd';
import { 
  FormOutlined,
  EditOutlined, 
  PlusOutlined, 
  ClearOutlined,
  FileTextOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';
import StiResultService, { 
  StiResult, 
  TestTypes 
} from '../../../../services/stiResultService';
import StatusUpdateModal from '../../../../components/sti/StatusUpdateModal';
import { 
  OrderStatus, 
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
  sti_test_type: TestTypes; // Sử dụng TestTypes từ service
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

export interface StiOrder {
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
  consultant_id?: string; // Thêm consultant_id
  staff_id?: string; // Thêm staff_id
  staff?: { // Thêm staff object
    _id: string;
    full_name: string;
    department: string;
  };
  consultant_user?: { // Thêm consultant_user object
    _id: string;
    full_name: string;
  };
  staff_user?: { // Thêm staff_user object
    _id: string;
    full_name: string;
  };
  sti_result?:{
    sti_result_items: any,
    is_testing_completed: boolean,
    diagnosis: string,
    is_confirmed: boolean,
    medical_notes: string,
  };
  sti_package_lookup?: any
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

export interface StaffInfo {
    _id: string;
    user_id: string;
    manager_id?: string;
    department: string;
    hire_date: string; // hoặc Date nếu bạn parse rồi
}

interface OrdersManagementProps {
  refreshTrigger: number;
}

const OrdersManagement: React.FC<OrdersManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [availableTests, setAvailableTests] = useState<StiTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] = useState(false);
  const [viewResult, setViewResult] = useState<any>(null);
  const [viewResultModalVisible, setViewResultModalVisible] = useState(false);
  const [noResultModalVisible, setNoResultModalVisible] = useState(false);
  const [invalidStatusModalVisible, setInvalidStatusModalVisible] = useState(false);
  const [cannotEditModalVisible, setCannotEditModalVisible] = useState(false);
  const [cannotEditAtTestingStatus, setCannotEditAtTestingStatus] = useState(false);
  
  
  // Selected items
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<StiOrder | null>(null);
  const [form] = Form.useForm();

  // Forms
  const [orderForm] = Form.useForm();
  const paymentMethod = Form.useWatch('paymentMethod', orderForm); // theo dõi real-time
  const [payment, setPayment] = useState<{ status: string } | null>(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);

  useEffect(() => {
    apiClient.get(API.Staff.GET_STAFF_BY_USER_ID)
      .then(res => {
        setStaffInfo((res.data as any).data);
        console.log('Staff info:', (res.data as any).data);
      })
      .catch(err => {
        console.error('Failed to fetch staff info:', err);
      });
  }, []);
  // Fetch data on mount and refresh
  useEffect(() => {
    fetchOrders();
    fetchAvailableTests();
    fetchAvailablePackages();
  }, [filters, refreshTrigger]);

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
        const mapped = (resData.data?.orders || resData.data?.items || []).filter((item: any) => item).map((item: any) => ({
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

  const fetchOrderResult = async (orderId: string) => {
    if (orderResults[orderId] !== undefined) return; // Đã có cache
  
    try {
      const response = await apiClient.get(API.STI.GET_STI_RESULT(orderId));
      if (response.data && (response.data as any).success && (response.data as any).data) {
        setOrderResults(prev => ({ ...prev, [orderId]: (response.data as any).data }));
      } else {
        setOrderResults(prev => ({ ...prev, [orderId]: null }));
      }
    } catch (error) {
      setOrderResults(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const response = await apiClient.get(API.STI.GET_ALL_TESTS);
      if (response.status === 200 && (response.data as any)?.success) {
        setAvailableTests((response.data as any)?.stitests || (response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách test:', error);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      const response = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      if (response.status === 200 && (response.data as any)?.success) {
        setAvailablePackages((response.data as any)?.stipackage || (response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách gói test:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      [key]: value,
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
    handleFilterChange('is_paid', value === 'all' ? undefined : value === 'true');
  };

  // Order management handlers
  const handleEditOrder = (order: StiOrder) => {
    console.log('Opening edit modal for order:', {
      id: order._id,
      status: order.order_status,
      isPaid: order.is_paid,
      code: order.order_code
    });
    
    if (order.order_status === 'Completed' || order.order_status === 'Canceled') {
      setCannotEditModalVisible(true);
      return;
    }
    if (order.order_status === 'Testing') {
      setCannotEditAtTestingStatus(true);
      return;
    }
    
    setEditingOrder(order);
    if (order.order_status === 'Booked') fetchConsultants();
    
    orderForm.setFieldsValue({
      order_date: order.order_date ? dayjs(order.order_date) : null,
      notes: order.notes,
      sti_package_id: order.sti_package_item?.sti_package_id || null,
      sti_test_items: order.sti_test_items || [],
      total_amount: order.total_amount,
      order_status: order.order_status,
      is_paid: order.is_paid,
      consultant_id: order.consultant_id || null,
    });
    
    setOrderModalVisible(true);
  };

  const handleOrderSubmit = async () => {
    try {
      const values = await orderForm.validateFields();
      if (editingOrder) {
        const updateData: any = {};
        if (editingOrder.order_status === 'Accepted') {
          updateData.is_paid = values.is_paid;
        } else if (editingOrder.order_status === 'Booked') {
          updateData.consultant_id = values.consultant_id;
        } else if ([
          'Processing', 'SpecimenCollected'
        ].includes(editingOrder.order_status)) {
          updateData.order_status = values.order_status;
        }
        // Nếu cần, có thể bổ sung các trường khác cho các trạng thái khác
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


  // Result management handlers - Updated to navigate
  const handleCreateOrEditResult = (order: StiOrder) => {
    if (order.order_status !== 'Testing') {
      setInvalidStatusModalVisible(true);
      return;
    }
    // Navigate to the new result page, which will handle both create and edit
    navigate(`/staff/orders/${order._id}/result`);
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
        fetchOrders();
        setStatusUpdateModalVisible(false);
      } else {
        message.error((response as any).data?.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
      message.error(errorMessage);
    }
  };
  

  const handleViewResults = async (orderId: string) => {
    try {
      const response = await apiClient.get(API.STI.GET_STI_RESULT(orderId));
      const resData: any = response && response.data ? response.data : {};
      if (resData.success && resData.data) {
        setViewResult(resData.data);
        setViewResultModalVisible(true);
      } else {
        setNoResultModalVisible(true);
      }
    } catch (error) {
      setNoResultModalVisible(true);
    }
  };

  const handlePaymentSubmit = async (paymentMethod: 'MoMo' | 'Cash') => {
    if (!editingOrder) return;

    try {
      const res = await apiClient.post(API.Payment.CREATE_PAYMENT(editingOrder._id), {
        paymentMethod: paymentMethod
      });

      const paymentData = (res.data as any).data;
      setPayment({ status: 'Completed' });

      if (paymentMethod === 'MoMo' && paymentData?.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      } else {
        message.success('Tạo thanh toán thành công');

        // Cập nhật lại editingOrder với trạng thái thanh toán
        setEditingOrder(prev => prev ? {
          ...prev,
          is_paid: paymentData.is_paid,
          paymentMethod: paymentData.paymentMethod,
        } : prev);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi tạo thanh toán';
      message.error(errorMessage);
    }
  };


  const renderModalFooter = () => {
    if (!editingOrder) return null;
    if (['Booked', 'Processing', 'SpecimenCollected'].includes(editingOrder.order_status)) {
      return [
        <Button key="back" onClick={() => setOrderModalVisible(false)}>Hủy</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOrderSubmit}>Lưu</Button>,
      ];
    }
    return [<Button key="back" onClick={() => setOrderModalVisible(false)}>Đóng</Button>];
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
      Booked: '#00BFFF',         // Dodger Blue
      Accepted: '#1E90FF',       // Deep Sky Blue
      Processing: '#FFA500',     // Orange
      SpecimenCollected: '#800080', // Purple
      Testing: '#FF1493',        // Deep Pink
      Completed: '#32CD32',      // Lime Green
      Canceled: '#DC143C'        // Crimson Red
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'violet' : 'orange';
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

  const getPaymentStatusText = (isPaid: boolean) => {
    return isPaid ? 'Đã thanh toán' : 'Chờ thanh toán';
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

  const isPatientServices = staffInfo?.department == 'Patient Services';
  // const isPatientServices = true
  console.log("patient service: ======", isPatientServices)

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 120,
      render: (code: string, record: StiOrder) => (
        <span>{code || record._id.slice(-8)}</span>
      )
    },
    ...(isPatientServices ? [{
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
    }] : []),
    {
      title: 'Dịch vụ',
      key: 'services',
      width: 200,
      render: (_: any, record: StiOrder) => (
        <div>
          { ((record.order_status == 'Booked') 
            ? (<Tag color="gray">Chưa có xét nghiệm</Tag>)
            : ((record.sti_package_item?.sti_package_id && Array.isArray(record.sti_test_items) && record.sti_test_items.length > 0) 
              ? (<><Tag color="purple">Gói xét nghiệm</Tag><br/><Tag color="yellow">Xét nghiệm lẻ</Tag></>)
              : ((!record.sti_test_items || record.sti_test_items.length === 0) && record.sti_package_item
                ? (<Tag color="purple">Gói xét nghiệm</Tag>)
                : (<Tag color="yellow">Xét nghiệm lẻ</Tag>) 
                )
              )
            )
          }
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
    ...(isPatientServices ? [{
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
    }] : []),
    {
      title: 'Trạng thái đơn hàng',
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
      width: 150,
      render: (isPaid: boolean) => (
        <Tag color={getPaymentStatusColor(isPaid)}>
          {getPaymentStatusText(isPaid)}
        </Tag>
      )
    },
    {
      title: 'Chuyên gia',
      key: 'consultant',
      width: 160,
      render: (record: StiOrder & { consultant_user?: { full_name?: string } }) => (
        <span>
          {record.consultant_user?.full_name || 'Chưa có'}
        </span>
      )
    },
    {
      title: 'Nhân viên',
      key: 'staff',
      width: 160,
      render: (record: StiOrder & { staff_user?: { full_name?: string } }) => (
        <span>
          {record.staff_user?.full_name || 'Chưa có'}
        </span>
      )
    },
    {
      title: 'Trạng thái kết quả',
      key: 'is_testing_completed',
      width: 160,
      render: (record: StiOrder) => (
        <span>
          {(record.sti_result?.is_testing_completed == true) ? 'Đã cập nhật' : 'Đang cập nhật'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 110,
      render: (_: any, record: StiOrder) => {
        console.log(record.staff?.department);
        const isTestingCompleted = record.sti_result?.is_testing_completed == true;
        console.log("sti result: ======================>", record.sti_result)
        const canManageResult = record.order_status === 'Testing';
        console.log("ORDER RESULTS: =================>", orderResults[record._id]);
        return (
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
            {isPatientServices &&
                (<Tooltip title="Sửa đơn hàng">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEditOrder(record)}
                    size="small"
                    disabled={((record.consultant_id ?? null) !== null && record.order_status === 'Booked')}
                    />
                </Tooltip>)
            }
            {!isPatientServices && (
              <>
              <Tooltip title="Cập nhật kết quả">
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={() => handleCreateOrEditResult(record)}
                size="small"
                disabled={!canManageResult || isTestingCompleted}
              />
            </Tooltip>
            {/* <Tooltip title="Xem kết quả">
              <Button
                icon={<FileTextOutlined />}
                onClick={() => handleViewResults(record._id)}
                size="small"
                disabled={!canManageResult || (orderResults[record._id]?.sti_result_items?.length ?? 0) === 0 }
              />
            </Tooltip> */}
              </>
            )}
          </Space>
        );
      }
    }
  ];

  const validTransitions: Record<string, string[]> = {
    Booked: ['Accepted', 'Canceled'],
    Accepted: ['Processing', 'Canceled'],
    Processing: ['SpecimenCollected'],
    SpecimenCollected: ['Testing'],
    Testing: ['Completed'],
    Completed: [],
    Canceled: [],
  };

  const [consultantList, setConsultantList] = useState<any[]>([]);
  const fetchConsultants = async () => {
    try {
      const consultantRes = await apiClient.get(API.Consultant.DROPDOWN_LIST_SPECIALIZATION(SpecializationType.SexualHealth));
      const data: any = consultantRes.data ? consultantRes.data : {};
      setConsultantList(data.data || []);
    } catch {}
  };

  const [orderResults, setOrderResults] = useState<{ [orderId: string]: any }>({});

  // Fetch result for each order when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        if (order && order._id && orderResults[order._id] === undefined) {
          apiClient.get(API.STI.GET_STI_RESULT(order._id))
            .then(res => {
              if (res.data && (res.data as any).success && (res.data as any).data) {
                setOrderResults(prev => ({ ...prev, [order._id]: (res.data as any).data }));
              } else {
                setOrderResults(prev => ({ ...prev, [order._id]: null }));
              }
            })
            .catch(() => setOrderResults(prev => ({ ...prev, [order._id]: null })));
        }
      });
    }
  }, [orders]);

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
        {editingOrder && (
          <div style={{ marginBottom: 16 }}>
            <strong>Mã đơn:</strong> {editingOrder.order_code || editingOrder._id} <br />
            <strong>Khách hàng:</strong> {editingOrder.customer_name || editingOrder.customer?.full_name || editingOrder.customer_id?.full_name || 'N/A'} <br/>
            <strong>Số tiền cần trả:</strong>{' '}
            {editingOrder.total_amount != null
              ? editingOrder.total_amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
              : 'N/A'}
          </div>
        )}
        <Form form={orderForm} layout="vertical">
          {editingOrder && ['Booked', 'Accepted', 'Processing', 'SpecimenCollected'].includes(editingOrder.order_status) ? (
            <>
              {editingOrder.order_status === 'Booked' && (
                <Form.Item
                  label="Consultant"
                  name="consultant_id"
                  rules={[{ required: true, message: 'Chọn consultant' }]}
                >
                  <Select placeholder="Chọn consultant">
                    <Option value="">-- Chọn consultant --</Option>
                    {consultantList.map(c => (
                      <Option key={c.consultant_id} value={c.consultant_id}>{c.full_name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              {editingOrder.order_status === 'Accepted' && (
              <>
                <Form.Item
                  label="Loại thanh toán"
                  name="paymentMethod"
                  rules={[{ required: true, message: 'Chọn loại thanh toán' }]}
                >
                  <Select 
                    placeholder="Chọn loại thanh toán"
                    disabled={paymentLoading}
                  >
                    <Option value="Cash">Thanh toán bằng tiền mặt</Option>
                    <Option value="MoMo">Thanh toán bằng MoMo</Option>
                  </Select>
                </Form.Item>

                {/* Debug info - có thể xóa sau khi fix xong */}
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '12px',
                  padding: '8px',
                  background: '#f9f9f9',
                  borderRadius: '4px'
                }}>
                  Debug: Order ID = {editingOrder._id} | Status = {editingOrder.order_status} | Paid = {editingOrder.is_paid ? 'Yes' : 'No'}
                </div>

                {payment?.status !== 'Completed' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                  {paymentMethod === 'MoMo' && (
                    <Button
                      type="primary"
                      loading={paymentLoading}
                      onClick={() => handlePaymentSubmit('MoMo')}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? 'Đang xử lý...' : 'Thanh toán qua MoMo'}
                    </Button>
                  )}
                  
                  {paymentMethod === 'Cash' && (
                    <Button
                      type="primary"
                      loading={paymentLoading}
                      onClick={() => handlePaymentSubmit('Cash')}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? 'Đang xử lý...' : 'Thanh toán tiền mặt'}
                    </Button>
                  )}
                </div>
                )}
                

              </>
              )}
              {['Processing', 'SpecimenCollected'].includes(editingOrder.order_status) && (
                <Form.Item
                  label="Trạng thái đơn hàng"
                  name="order_status"
                  rules={[{ required: true, message: 'Chọn trạng thái' }]}
                >
                  <Select>
                    <Option value={editingOrder.order_status}>{getStatusText(editingOrder.order_status)}</Option>
                    {validTransitions[editingOrder.order_status]?.map(status => (
                      status !== editingOrder.order_status && (
                        <Option key={status} value={status}>{getStatusText(status)}</Option>
                      )
                    ))}
                  </Select>
                </Form.Item>
              )}
            </>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>
              Không thể chỉnh sửa đơn hàng ở trạng thái này.
            </div>
          )}
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
      <Modal
        open={viewResultModalVisible}
        onCancel={() => setViewResultModalVisible(false)}
        footer={null}
        width={600}
        title="Kết quả xét nghiệm"
      >
        {viewResult ? (
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(viewResult, null, 2)}</pre>
        ) : null}
      </Modal>
      <Modal
        open={noResultModalVisible}
        onCancel={() => setNoResultModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Chưa có kết quả xét nghiệm cho đơn này.</p>
      </Modal>
      <Modal
        open={invalidStatusModalVisible}
        onCancel={() => setInvalidStatusModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Chỉ có thể tạo/cập nhật kết quả khi đơn hàng ở trạng thái Đang xét nghiệm (Testing).</p>
      </Modal>
      <Modal
        open={cannotEditAtTestingStatus}
        onCancel={() => setCannotEditAtTestingStatus(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Không thể chỉnh sửa đơn hàng đang xét nghiệm</p>
      </Modal>

      <Modal
        open={cannotEditModalVisible}
        onCancel={() => setCannotEditModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Không thể chỉnh sửa đơn hàng đã hoàn thành hoặc đã hủy.</p>
      </Modal>
    </div>
  );
};

export default OrdersManagement;