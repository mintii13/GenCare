import React, { useState, useEffect } from 'react';
import {SpecializationType} from '../../../../../../backend/src/models/Consultant'
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
  Checkbox,
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
import StiResultService, { 
  StiResult, 
  CreateStiResultRequest, 
  UpdateStiResultByStaffRequest,
  UpdateStiResultByConsultantRequest,
  StiResultItem,
  TestTypes 
} from '../../../../services/stiResultService';
import StatusUpdateModal from '../../../../components/sti/StatusUpdateModal';
import { 
  OrderStatus, 
  getOrderStatusLabel, 
  getPaymentStatusLabel, 
  getOrderStatusColor, 
  getPaymentStatusColor,
  getAvailableActions
} from '../../../../utils/stiStatusUtils';
import dayjs from 'dayjs';
import styles from './ResultFormFields.module.css';

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
  consultant_id?: string; // Thêm consultant_id
  staff_id?: string; // Thêm staff_id
  staff?: { // Thêm staff object
    _id: string;
    full_name: string;
  };
<<<<<<< HEAD
  consultant_user?: { // Thêm consultant_user object
    _id: string;
    full_name: string;
  };
  staff_user?: { // Thêm staff_user object
    _id: string;
    full_name: string;
  };
=======
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
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

// Interface cho form items trong result modal
interface StiResultItemForm {
  sti_test_id: string;
  sample_type: TestTypes;
  sample_quality: boolean;
  urine?: Record<string, any>;
  blood?: Record<string, any>;
  swab?: Record<string, any>;
  time_completed: dayjs.Dayjs | null;
  staff_id?: string;
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
  const [viewResult, setViewResult] = useState<any>(null);
  const [viewResultModalVisible, setViewResultModalVisible] = useState(false);
  const [noResultModalVisible, setNoResultModalVisible] = useState(false);
  const [hasResultModalVisible, setHasResultModalVisible] = useState(false);
  const [invalidStatusModalVisible, setInvalidStatusModalVisible] = useState(false);
  const [cannotEditModalVisible, setCannotEditModalVisible] = useState(false);
<<<<<<< HEAD
  const [cannotEditAtTestingStatus, setCannotEditAtTestingStatus] = useState(false);
  
=======
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
  
  // Selected items
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<StiOrder | null>(null);
  const [editingResult, setEditingResult] = useState<StiResult | null>(null);
  const [stiTests, setStiTests] = useState<StiTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<StiTest | null>(null);
  const [form] = Form.useForm();

  // Forms
  const [orderForm] = Form.useForm();
  const [resultForm] = Form.useForm();
  
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
  
  // Result form states
  const [selectedTestType, setSelectedTestType] = useState<TestTypes>();
  const [resultFormItems, setResultFormItems] = useState<StiResultItemForm[]>([]);
  const [nonUpdatedTests, setNonUpdatedTests] = useState<StiTest[]>([]);

  // Fetch data on mount and refresh
  useEffect(() => {
    fetchOrders();
    fetchAvailableTests();
    fetchAvailablePackages();
    fetchNonUpdatedTests();
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

  const fetchAvailableTests = async (orderId?: string) => {
    try {
      if (!orderId) {
        console.error('orderId is missing for fetchAvailableTests');
        return;
      }
      console.log('Fetching tests for orderId:', orderId);
      const url = API.STI.GET_TESTS_FROM_ORDER(orderId);
      const response = await apiClient.get(url);
      if (response.status === 200 && (response.data as any)?.success) {
        const data = (response.data as any)?.data || [];
        setAvailableTests(data);
        console.log('availableTests:', data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách test:', error);
      message.error('Lỗi khi tải danh sách test:');
    }
  };

  const fetchNonUpdatedTests = async (orderId?: string) => {
    try {
      if (!orderId) {
        console.error('orderId is missing for fetch non-updated tests');
        return;
      }
      const url = API.STI.GET_NONUPDATED_TESTS_FROM_ORDER(orderId);
      const response = await apiClient.get(url);
      const data = (response.data as any)
      if (response.status === 200 && data.success) {
        setAvailableTests(data.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách test:', error);
      message.error('Lỗi khi tải danh sách test:');
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
    handleFilterChange('is_paid', value === 'all' ? undefined : value === 'true');
  };

  // Order management handlers
  const handleEditOrder = (order: StiOrder) => {
    if (order.order_status === 'Completed' || order.order_status === 'Canceled') {
      setCannotEditModalVisible(true);
      return;
    }
<<<<<<< HEAD
    if (order.order_status === 'Testing') {
      setCannotEditAtTestingStatus(true);
      return;
    }
=======
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
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
<<<<<<< HEAD
          'Processing', 'SpecimenCollected'
=======
          'Processing', 'SpecimenCollected', 'Testing'
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
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

  // Result management handlers - Updated to match service types
  const handleCreateResult = async (order: StiOrder) => {
    try {
      const response = await apiClient.get(API.STI.GET_STI_RESULT(order._id));
      const resData: any = response && response.data ? response.data : {};
      if (resData.success && resData.data) {
        setHasResultModalVisible(true);
        return;
      }
    } catch (error) {
      // Nếu lỗi 404 hoặc không có result thì cho phép tạo mới
    }
    setSelectedOrder(order);
    setEditingResult(null);
    resultForm.resetFields();
    setResultFormItems([]);
    setSelectedTest(null);
    setSelectedTestType(undefined);
    fetchAvailableTests(order._id);
    setResultModalVisible(true);
  };

  const handleEditResult = async (order: StiOrder) => {
    try {
      const response = await apiClient.get(API.STI.GET_STI_RESULT(order._id));
      const resData: any = response?.data ?? {};
  
      if (!resData.success || !resData.data) {
        message.error('Đơn này chưa có kết quả để cập nhật!');
        return;
      }
  
      setSelectedOrder(order);
      setEditingResult(resData.data); // ✅ Gán kết quả thật
      resultForm.resetFields();
      setResultFormItems([]); // Bạn có thể thêm mapping lại resultFormItems nếu cần
      setSelectedTest(null);
      setSelectedTestType(undefined);
      fetchNonUpdatedTests(order._id);
      setResultModalVisible(true);
    } catch {
      message.error('Không thể lấy dữ liệu kết quả!');
    }
  };


  // Reset state khi đóng modal result
  const handleResultModalClose = () => {
    setResultModalVisible(false);
    setSelectedOrder(null);
    setEditingResult(null);
    setResultFormItems([]);
    setSelectedTest(null);
    setSelectedTestType(undefined);
  };

  const handleTestChange = (testId: string) => {
    const selectedTest = availableTests.find(test => test._id === testId);
    
    if (selectedTest) {
      form.resetFields();
      setSelectedTestType(undefined); // Unmount form fields

      setTimeout(() => {
        setSelectedTestType(selectedTest.sti_test_type); // Remount đúng loại mới
        setResultFormItems([{
          sti_test_id: testId,
          sample_type: selectedTest.sti_test_type,
          sample_quality: true,
          time_completed: dayjs(),
          staff_id: user?.id
        }]);
      }, 0);
    } else {
      setSelectedTestType(undefined);
      setResultFormItems([]);
    }
  };

  const handleResultSubmit = async () => {
    try {
      const values = resultForm.getFieldsValue();
      // Build payload từ form values thay vì resultFormItems
      const normalizeBloodBooleans = (blood: any = {}) => ({
        ...blood,
        hiv: blood.hiv ?? false,
        HBsAg: blood.HBsAg ?? false,
        anti_HBs: blood.anti_HBs ?? false,
        anti_HBc: blood.anti_HBc ?? false,
        anti_HCV: blood.anti_HCV ?? false,
        HCV_RNA: blood.HCV_RNA ?? false,
        TPHA_syphilis: blood.TPHA_syphilis ?? false,
        VDRL_syphilis: blood.VDRL_syphilis ?? false,
        RPR_syphilis: blood.RPR_syphilis ?? false,
        treponema_pallidum_IgM: blood.treponema_pallidum_IgM ?? false,
        treponema_pallidum_IgG: blood.treponema_pallidum_IgG ?? false,
      });
      const normalizeUrineBooleans = (urine: any = {}) => ({
        ...urine,
        blood: urine.blood ?? false,
      });
      const normalizeSwabBooleans = (swab: any = {}) => ({
        ...swab,
        PCR_HSV: swab.PCR_HSV ?? false,
        HPV: swab.HPV ?? false,
        NAAT_Trichomonas: swab.NAAT_Trichomonas ?? false,
        rapidAntigen_Trichomonas: swab.rapidAntigen_Trichomonas ?? false,
        culture_Trichomonas: swab.culture_Trichomonas ?? false,
      });
      const stiResultItems: StiResultItem[] = [
        {
          sti_test_id: values.sti_test_id,
          result: {
            sample_type: selectedTestType || 'blood',     //để blood đỡ
            sample_quality: values.sample_quality,
            ...(selectedTestType === 'urine' && values.urine ? { urine: normalizeUrineBooleans(values.urine) } : {}),
      ...(selectedTestType === 'blood' && values.blood ? { blood: normalizeBloodBooleans(values.blood) } : {}),
      ...(selectedTestType === 'swab' && values.swab ? { swab: normalizeSwabBooleans(values.swab) } : {}),
            time_completed: values.time_completed?.toISOString() || new Date().toISOString(),
            staff_id: user?.id
          }
        }
      ];
  
      let response;
  
      if (editingResult) {
        // 🔄 Update kết quả bởi staff
        const updateData: UpdateStiResultByStaffRequest = {
          sti_order_id: editingResult.sti_order_id,
          sti_result_items: stiResultItems
        };
  
        response = await StiResultService.updateStiResultByStaff(editingResult.sti_order_id, updateData);
      } else if (selectedOrder) {
        // 🆕 Tạo mới kết quả
        const createData: CreateStiResultRequest = {
          sti_order_id: selectedOrder._id,
          sti_result_items: stiResultItems
        };
  
        response = await StiResultService.createStiResult(selectedOrder._id, createData);
      }
  
      if (response?.success) {
        message.success(editingResult ? 'Cập nhật kết quả thành công' : 'Tạo kết quả thành công');
        fetchResultsByOrder(editingResult?.sti_order_id || selectedOrder!._id);
        setResultModalVisible(false);
        resultForm.resetFields();
        setResultFormItems([]);
      } else {
        message.error(response?.message || 'Đã có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
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

  const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'green' : 'orange';
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
      render: (isPaid: boolean) => (
        <Tag color={getPaymentStatusColor(isPaid)}>
          {getPaymentStatusText(isPaid)}
        </Tag>
      )
    },
    {
      title: 'Consultant',
      key: 'consultant',
      width: 160,
<<<<<<< HEAD
      render: (record: StiOrder & { consultant_user?: { full_name?: string } }) => (
        <span>
          {record.consultant_user?.full_name || 'Chưa có'}
        </span>
=======
      render: (record: StiOrder) => (
        <span>{
          record.consultant_id
            ? (typeof record.consultant_id === 'object'
                ? record.consultant_id.full_name
                : consultantList.find(c => c.consultant_id === record.consultant_id)?.full_name || 'Chưa có')
            : 'Chưa có'
        }</span>
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
      )
    },
    {
      title: 'Staff',
      key: 'staff',
      width: 160,
<<<<<<< HEAD
      render: (record: StiOrder & { staff_user?: { full_name?: string } }) => (
        <span>
          {record.staff_user?.full_name || 'Chưa có'}
        </span>
=======
      render: (record: StiOrder) => (
        <span>{
          record.staff_id && record.staff && record.staff.full_name
            ? record.staff.full_name
            : 'Chưa có'
        }</span>
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 280,
      render: (_: any, record: StiOrder) => {
        const hasResult = !!orderResults[record._id];
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
                onClick={() => {
                  if (record.order_status !== 'Testing') {
                    setInvalidStatusModalVisible(true);
                  } else {
                    handleCreateResult(record);
                  }
                }}
                size="small"
                disabled={hasResult}
              />
            </Tooltip>
            <Tooltip title="Cập nhật kết quả">
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  const result = orderResults[record._id];
                  if (result) handleEditResult(record);
                  else message.warning('Đơn này chưa có kết quả để cập nhật!');
                }}
                size="small"
                disabled={!hasResult}
              />
            </Tooltip>
            <Tooltip title="Xem kết quả">
              <Button
                icon={<FileTextOutlined />}
                onClick={() => handleViewResults(record._id)}
                size="small"
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // const resultColumns = [
  //   {
  //     title: 'Test',
  //     dataIndex: 'sti_result_items',
  //     key: 'test_info',
  //     render: (items: StiResultItem[]) => (
  //       <div>
  //         {items.map((item, index) => (
  //           <div key={index}>
  //             <Tag color="blue">Test ID: {item.sti_test_id}</Tag>
  //             <div>Loại mẫu: {item.result.sample_type}</div>
  //             <div>Chất lượng: {item.result.sample_quality ? 'Tốt' : 'Kém'}</div>
  //           </div>
  //         ))}
  //       </div>
  //     )
  //   },
  //   {
  //     title: 'Chẩn đoán',
  //     dataIndex: 'diagnosis',
  //     key: 'diagnosis',
  //     render: (text: string) => text || 'Chưa có chẩn đoán'
  //   },
  //   {
  //     title: 'Trạng thái',
  //     key: 'status',
  //     render: (_: any, record: StiResult) => (
  //       <Space direction="vertical" size="small">
  //         <Tag color={record.is_confirmed ? 'green' : 'orange'}>
  //           {record.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
  //         </Tag>
  //         {record.is_critical && <Tag color="red">Nghiêm trọng</Tag>}
  //       </Space>
  //     )
  //   },
  //   {
  //     title: 'Hành động',
  //     key: 'actions',
  //     render: (_: any, record: StiResult) => (
  //       <Space>
  //         <Button
  //           icon={<EditOutlined />}
  //           onClick={() => handleEditResult(record)}
  //           size="small"
  //         >
  //           Sửa
  //         </Button>
  //       </Space>
  //     )
  //   }
  // ];

  const renderUrineFields = () => (
    <div className={styles.groupBox}>
      <h4 className={styles.groupTitle}>Thông tin nước tiểu</h4>
      <Row gutter={8} className={styles.formRow}>
        <Col span={12}>
          <span className={styles.label}>Color</span>
          <Form.Item name={['urine', 'color']} noStyle>
            <Select style={{ width: '100%' }} size="small" options={[
              { value: 'light yellow', label: 'Light Yellow' },
              { value: 'clear', label: 'Clear' },
              { value: 'dark yellow to orange', label: 'Dark Yellow to Orange' },
              { value: 'dark brown', label: 'Dark Brown' },
              { value: 'pink or red', label: 'Pink or Red' },
              { value: 'blue or green', label: 'Blue or Green' },
              { value: 'black', label: 'Black' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <span className={styles.label}>Clarity</span>
          <Form.Item name={['urine', 'clarity']} noStyle>
            <Select style={{ width: '100%' }} size="small" options={[
              { value: 'clearly', label: 'Clearly' },
              { value: 'cloudy', label: 'Cloudy' },
            ]} />
          </Form.Item>
        </Col>
      </Row>
      {/* Gom 3 trường số 1 hàng */}
      {(['URO', 'GLU', 'KET', 'BIL', 'PRO', 'NIT', 'pH', 'specific_gravity', 'LEU'] as string[]).reduce<string[][]>((rows, key, idx, arr) => {
        if (idx % 3 === 0) rows.push(arr.slice(idx, idx + 3));
        return rows;
      }, []).map((group, i) => (
        <Row gutter={8} className={styles.formRow} key={i}>
          {group.map(key => (
            <Col span={8} key={key}>
              <span className={styles.label}>{key}</span>
              <Form.Item name={['urine', key]} noStyle>
                <InputNumber style={{ width: '100%' }} size="small" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      ))}
      <Row gutter={8} className={styles.formRow}>
        <Col span={12}>
          <Form.Item name={['urine', 'blood']} valuePropName="checked" noStyle>
            <Checkbox>Blood in urine</Checkbox>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderBloodFields = () => (
    <div className={styles.groupBox}>
      <h4 className={styles.groupTitle}>Thông tin máu</h4>
      {/* Gom 2 trường số 1 hàng */}
      {(['platelets', 'red_blood_cells', 'white_blood_cells', 'hemo_level'] as string[]).reduce<string[][]>((rows, key, idx, arr) => {
        if (idx % 2 === 0) rows.push(arr.slice(idx, idx + 2));
        return rows;
      }, []).map((group, i) => (
        <Row gutter={8} className={styles.formRow} key={i}>
          {group.map(key => (
            <Col span={12} key={key}>
              <span className={styles.label}>{key}</span>
              <Form.Item name={['blood', key]} noStyle>
                <InputNumber style={{ width: '100%' }} size="small" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      ))}
      {/* Gom 3 checkbox 1 hàng */}
      {([
        'hiv', 'HBsAg', 'anti_HBs', 'anti_HBc', 'anti_HCV',
        'HCV_RNA', 'TPHA_syphilis', 'VDRL_syphilis', 'RPR_syphilis',
        'treponema_pallidum_IgM', 'treponema_pallidum_IgG'
      ] as string[]).reduce<string[][]>((rows, key, idx, arr) => {
        if (idx % 3 === 0) rows.push(arr.slice(idx, idx + 3));
        return rows;
      }, []).map((group, i, arr) => {
        const isLast = i === arr.length - 1 && group.length === 2;
        return (
          <Row gutter={8} className={styles.formRow} key={i + 'cb'}>
            {group.map(key => (
              <Col span={isLast ? 12 : 8} key={key}>
                <Form.Item name={['blood', key]} valuePropName="checked" noStyle>
                  <Checkbox>{key}</Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
        );
      })}
    </div>
  );

  const renderSwabFields = () => (
    <div className={styles.groupBox}>
      <h4 className={styles.groupTitle}>Thông tin dịch phết</h4>
      {/* Gom 3 tags 1 hàng */}
      {(['bacteria', 'virus', 'parasites'] as string[]).reduce<string[][]>((rows, key, idx, arr) => {
        if (idx % 3 === 0) rows.push(arr.slice(idx, idx + 3));
        return rows;
      }, []).map((group, i) => (
        <Row gutter={8} className={styles.formRow} key={i + 'tags'}>
          {group.map(key => (
            <Col span={8} key={key}>
              <span className={styles.label}>{key}</span>
              <Form.Item name={['swab', key]} noStyle>
                <Select mode="tags" style={{ width: '100%' }} placeholder={`Enter ${key}`} size="small" />
              </Form.Item>
            </Col>
          ))}
        </Row>
      ))}
      {/* Gom 3 checkbox 1 hàng */}
      {([
        'PCR_HSV', 'HPV', 'NAAT_Trichomonas',
        'rapidAntigen_Trichomonas', 'culture_Trichomonas'
      ] as string[]).reduce<string[][]>((rows, key, idx, arr) => {
        if (idx % 3 === 0) rows.push(arr.slice(idx, idx + 3));
        return rows;
      }, []).map((group, i) => (
        <Row gutter={8} className={styles.formRow} key={i + 'cb'}>
          {group.map(key => (
            <Col span={8} key={key}>
              <Form.Item name={['swab', key]} valuePropName="checked" noStyle>
                <Checkbox>{key}</Checkbox>
              </Form.Item>
            </Col>
          ))}
        </Row>
      ))}
    </div>
  );

  const sampleQuality = Form.useWatch('sample_quality', resultForm);

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
    // eslint-disable-next-line
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

      {/* Results Table */}
      {/* {results.length > 0 && (
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
      )} */}

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
            <strong>Khách hàng:</strong> {editingOrder.customer_name || editingOrder.customer?.full_name || editingOrder.customer_id?.full_name || 'N/A'}
          </div>
        )}
        <Form form={orderForm} layout="vertical">
<<<<<<< HEAD
          {editingOrder && ['Booked', 'Accepted', 'Processing', 'SpecimenCollected'].includes(editingOrder.order_status) ? (
=======
          {editingOrder && ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing'].includes(editingOrder.order_status) ? (
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
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
                <Form.Item
                label="Trạng thái thanh toán"
                name="is_paid"
                rules={[{ required: true, message: 'Chọn trạng thái' }]}
                >
                  <Select>
                    <Option value={false}>Chờ thanh toán</Option>
                    <Option value={true}>Đã thanh toán</Option>
                  </Select>
                </Form.Item>
              )}
<<<<<<< HEAD
              {['Processing', 'SpecimenCollected'].includes(editingOrder.order_status) && (
=======
              {['Processing', 'SpecimenCollected', 'Testing'].includes(editingOrder.order_status) && (
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
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
        onCancel={handleResultModalClose}
        width={520}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={resultForm} layout="vertical">
          {/* Các trường form giống create, không đổi UI khi update */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Chọn xét nghiệm"
                name="sti_test_id"
                rules={[{ required: true, message: 'Vui lòng chọn một xét nghiệm' }]}
              >
                <Select
                  placeholder="Chọn xét nghiệm"
                  onChange={handleTestChange}
                  options={availableTests.map(test => ({
                    label: test.sti_test_name,
                    value: test._id
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chất lượng mẫu"
                name="sample_quality"
                valuePropName="checked"
              >
                <Switch checkedChildren="Tốt" unCheckedChildren="Hỏng" />
              </Form.Item>
            </Col>
          </Row>
          {/* Fields động hiển thị dựa trên test được chọn */}
          {selectedTestType && sampleQuality && (
            <div style={{ marginTop: 16 }}>
              {selectedTestType === 'urine' && renderUrineFields()}
              {selectedTestType === 'blood' && renderBloodFields()}
              {selectedTestType === 'swab' && renderSwabFields()}
            </div>
          )}
          {/* ... các trường khác nếu có ... */}
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
        open={hasResultModalVisible}
        onCancel={() => setHasResultModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Đơn này đã có kết quả xét nghiệm. Không thể tạo mới!</p>
      </Modal>
      <Modal
        open={invalidStatusModalVisible}
        onCancel={() => setInvalidStatusModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Chỉ có thể tạo kết quả khi đơn hàng ở trạng thái Đang xét nghiệm (Testing).</p>
      </Modal>
      <Modal
<<<<<<< HEAD
        open={cannotEditAtTestingStatus}
        onCancel={() => setCannotEditAtTestingStatus(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Không thể chỉnh sửa đơn hàng đang xét nghiệm</p>
      </Modal>

      <Modal
=======
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
        open={cannotEditModalVisible}
        onCancel={() => setCannotEditModalVisible(false)}
        footer={null}
        title="Thông báo"
      >
        <p>Không thể chỉnh sửa đơn hàng đã hoàn thành hoặc đã hủy.</p>
      </Modal>
<<<<<<< HEAD
      
=======
>>>>>>> 82cfa34b15d9b196d38c652611d43eed0e91b71d
    </div>
  );
};

export default OrdersManagement; 