import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Tag, Space, message, Modal, Input, Select, Row, Col, DatePicker, Form } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeOutlined, CalendarOutlined, SearchOutlined, EditOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';
import STIAssessmentService from '../../services/stiAssessmentService';
import { ResourceTable } from '../../components/common/ResourceTable';

const { Title, Text } = Typography;

interface STIOrder {
  _id: string;
  customer_id: string;
  sti_package_item?: {
    sti_package_id: string;
    sti_test_ids: string[];
  };
  sti_test_items: string[];
  sti_schedule_id: string;
  order_date: string;
  total_amount: number;
  notes?: string;
  order_status?: string;
  createdAt: string;
  updatedAt: string;
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<STIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<STIOrder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [packageMap, setPackageMap] = useState<{ [id: string]: string }>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<STIOrder | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<STIOrder | null>(null);
  
  // Detect if this is staff/admin view based on route
  const isStaffView = location.pathname.includes('/staff/') || location.pathname.includes('/admin/');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Common filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Staff-only filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('order_date');
  
  // Valid sort fields for backend validation
  const validSortFields = ['order_date', 'total_amount', 'order_status', 'createdAt', 'updatedAt'];
  
  // Debounce search term
  useEffect(() => {
    // This useEffect is no longer needed as searchTerm is removed
  }, []);


  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để sử dụng chức năng này!');
      setShowLoginModal(true);
      return;
    }
    
    // Check role based on view type
    if (isStaffView && !['staff', 'admin', 'manager'].includes(user.role)) {
      message.error('Bạn không có quyền truy cập trang quản lý này');
      navigate('/');
      return;
    }
    
    if (!isStaffView && user.role !== 'customer') {
      message.error('Chỉ khách hàng mới có thể xem lịch xét nghiệm cá nhân');
      navigate('/');
      return;
    }
    
    fetchOrders();
    // Lấy danh sách gói xét nghiệm để mapping id -> tên
    STIAssessmentService.getPackageInfo().then(res => {
      if (res.success && Array.isArray(res.data)) {
        const map: { [id: string]: string } = {};
        res.data.forEach(pkg => {
          map[pkg.code] = pkg.name;
        });
        setPackageMap(map);
      }
    });
  }, [user, isStaffView, currentPage, pageSize, statusFilter, minAmount, maxAmount, dateFrom, dateTo, paymentStatusFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 OrdersPage Debug:', {
        userRole: user?.role,
        isStaffView,
        location: location.pathname,
        fullUser: user
      });
      
      // Select endpoint based on view type
      const endpoint = isStaffView 
        ? API.STI.GET_ALL_ORDERS_PAGINATED  // Staff API: /api/sti/orders
        : API.STI.GET_MY_ORDERS;            // Customer API: /api/sti/my-orders
        
      console.log('🌐 API endpoint selected:', endpoint);
      
      // Build query parameters based on view type
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_order: 'desc'
      });
      
      // Common filters
      if (statusFilter !== 'all') {
        params.append('order_status', statusFilter);
      }

      if (minAmount) {
        params.append('min_amount', minAmount);
      }

      if (maxAmount) {
        params.append('max_amount', maxAmount);
      }

      if (dateFrom) {
        params.append('date_from', dateFrom);
      }

      if (dateTo) {
        params.append('date_to', dateTo);
      }
      
      // Staff-only filters with validation
      if (isStaffView) {
        if (paymentStatusFilter !== 'all') {
          params.append('is_paid', paymentStatusFilter === 'true' ? 'true' : paymentStatusFilter === 'false' ? 'false' : '');
        }
        
        // ✅ FIXED: Validate sortBy field before sending to backend
        if (sortBy !== 'order_date' && validSortFields.includes(sortBy)) {
          params.append('sort_by', sortBy);
        }
      }
      
      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log('📡 Full URL being called:', fullUrl);
      console.log('🔧 Sort field being used:', sortBy, 'Valid fields:', validSortFields);
      
      const response = await apiClient.get<any>(fullUrl);
      
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config?.url,
        data: response.data,
        sortingInfo: {
          requestedSortBy: sortBy,
          isValidSortField: validSortFields.includes(sortBy)
        }
      });
      
      if (response.data.success) {
        setOrders(response.data.data?.items || response.data.items || []);
        setTotal(response.data.data?.pagination?.total_items || response.data.pagination?.total_items || 0);
      } else {
        if (response.data.message?.includes('Cannot find any orders')) {
          setOrders([]);
          setTotal(0);
        } else {
          message.error('Không thể tải danh sách lịch xét nghiệm');
        }
      }
    } catch (error: any) {
      console.error('Error fetching STI orders:', error);
      if (error.response?.status === 404) {
        setOrders([]);
        setTotal(0);
      } else {
        message.error('Có lỗi xảy ra khi tải danh sách lịch xét nghiệm');
      }
    } finally {
      setLoading(false);
    }
  };

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
      Canceled: 'red',
      // Fallback cho status cũ
      pending: 'orange',
      confirmed: 'green',
      completed: 'blue',
      cancelled: 'red'
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
      Canceled: 'Đã hủy',
      // Fallback cho status cũ
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  // Hiển thị modal chi tiết
  const showOrderDetail = (order: STIOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // Hiển thị modal edit (không mở modal chi tiết)
  const showModalForEditOrder = (order: STIOrder) => {
    setSelectedOrderForEdit(order);
    setEditModalVisible(true);
  };

  // Hiển thị modal xác nhận hủy đơn
  const showCancelConfirmModal = (order: STIOrder) => {
    setSelectedOrderForCancel(order);
    setCancelModalVisible(true);
  };

  const columns = [
    {
      title: 'Ngày giờ',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date: string) => (
        <div>
          <CalendarOutlined style={{ marginRight: 8 }} />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </div>
      )
    },
    {
      title: 'Loại xét nghiệm',
      key: 'type',
      render: (record: STIOrder) => (
        <div>
          {record.sti_package_item ? (
            <Tag color="blue">Gói xét nghiệm</Tag>
          ) : (
            <Tag color="green">Xét nghiệm lẻ</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatPrice(amount)}
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'order_status',
      key: 'order_status',
      render: (status: string = 'Booked') => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || 'Không có ghi chú'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: STIOrder) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn event bubbling
              showOrderDetail(record);
            }}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            disabled={record.order_status !== 'Booked'}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn event bubbling
              showModalForEditOrder(record);
            }}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<CloseOutlined />}
            disabled={record.order_status !== 'Booked'}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn event bubbling
              showCancelConfirmModal(record);
            }}
          >
            Hủy đơn
          </Button>
        </Space>
      )
    }
  ];

  // Modal chỉnh sửa đơn hàng (đã bỏ trường order_status)
  const EditOrderModal: React.FC<{
    visible: boolean;
    order: STIOrder | null;
    onClose: () => void;
    onSubmit: (values: { order_date: string; notes: string }) => void;
  }> = ({ visible, order, onClose, onSubmit }) => {
    const [form] = Form.useForm();

    useEffect(() => {
      if (order) {
        form.setFieldsValue({
          order_date: order.order_date ? dayjs(order.order_date) : null,
          notes: order.notes || '',
        });
      }
    }, [order, form]);

    const handleSubmit = () => {
      form
        .validateFields()
        .then(values => {
          onSubmit({
            ...values,
            order_date: values.order_date.format('YYYY-MM-DD'),
          });
        })
        .catch(info => {
          console.log('Validate Failed:', info);
        });
    };

    return (
      <Modal
        title="Chỉnh sửa lịch xét nghiệm"
        open={visible}
        onCancel={onClose}
        onOk={handleSubmit}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Ngày xét nghiệm"
            name="order_date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày xét nghiệm' }]}
          >
            <DatePicker 
              picker='date' 
              format="DD/MM/YYYY" 
              style={{ width: '100%' }}
              disabledDate={(current) => {
                // Không cho chọn ngày trong quá khứ
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // Hàm cập nhật đơn hàng (đã bỏ order_status)
  const handleUpdateOrder = async (values: { order_date: string; notes: string }) => {
    if (!selectedOrderForEdit) return;
    
    try {
      setLoading(true);
      
      const updateEndpoint = API.STI.UPDATE_ORDER(selectedOrderForEdit._id);
      
      const response = await apiClient.patch(updateEndpoint, {
        order_date: values.order_date,
        notes: values.notes,
      });
      
      if ((response.data as any).success) {
        toast.success('Cập nhật đơn hàng thành công!');
        setEditModalVisible(false);
        setSelectedOrderForEdit(null);
        fetchOrders(); // Tải lại danh sách
      } else {
        message.error((response.data as any).message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!selectedOrderForCancel) return;
    
    try {
      setLoading(true);
      
      const updateEndpoint = API.STI.UPDATE_ORDER(selectedOrderForCancel._id);
      
      const response = await apiClient.patch(updateEndpoint, {
        order_status: 'Canceled',
      });
      
      if ((response.data as any).success) {
        toast.success('Hủy đơn hàng thành công!');
        setCancelModalVisible(false);
        setSelectedOrderForCancel(null);
        fetchOrders(); // Tải lại danh sách
      } else {
        message.error((response.data as any).message || 'Hủy đơn thất bại');
      }
    } catch (error: any) {
      console.error('Error canceling order:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý từ chối hủy đơn
  const handleRejectCancel = () => {
    setCancelModalVisible(false);
    setSelectedOrderForCancel(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Title level={2} className="text-3xl font-bold">
          {isStaffView ? 'Quản lý lịch xét nghiệm STI' : 'Lịch xét nghiệm STI đã đặt'}
        </Title>
        {!isStaffView && (
          <Button type="primary" onClick={() => navigate('/sti-booking/book')}>
            Đặt lịch mới
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-row items-center gap-4 justify-center mb-6">
        <Select
          placeholder="Tất cả trạng thái"
          style={{ minWidth: 200 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Select.Option value="all">Tất cả trạng thái</Select.Option>
          <Select.Option value="Booked">Đã đặt lịch</Select.Option>
          <Select.Option value="Accepted">Đã chấp nhận</Select.Option>
          <Select.Option value="Processing">Đang xử lý</Select.Option>
          <Select.Option value="SpecimenCollected">Đã lấy mẫu</Select.Option>
          <Select.Option value="Testing">Đang xét nghiệm</Select.Option>
          <Select.Option value="Completed">Hoàn thành</Select.Option>
          <Select.Option value="Canceled">Đã hủy</Select.Option>
        </Select>

        {/* ✅ ADDED: Sort controls for testing */}
        {isStaffView && (
          <Select
            placeholder="Sắp xếp theo"
            style={{ minWidth: 180 }}
            value={sortBy}
            onChange={(value) => {
              console.log('🔧 Sort changed to:', value);
              setSortBy(value);
              setCurrentPage(1);
            }}
          >
            <Select.Option value="order_date">Ngày đặt</Select.Option>
            <Select.Option value="total_amount">Tổng tiền</Select.Option>
            <Select.Option value="order_status">Trạng thái</Select.Option>
            <Select.Option value="createdAt">Ngày tạo</Select.Option>
            <Select.Option value="updatedAt">Ngày cập nhật</Select.Option>
          </Select>
        )}

        <Button
          onClick={() => {
            setStatusFilter('all');
            setSortBy('order_date');
            setCurrentPage(1);
            console.log('🔄 Filters reset');
          }}
        >
          Đặt lại
        </Button>
      </div>

      <ResourceTable
        data={orders}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page: number, pageSize: number) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          },
        }}
        onRowClick={showOrderDetail}
      />

      {/* Modal chi tiết đơn hàng */}
      <Modal
        title="Chi tiết lịch xét nghiệm"
        open={detailModalVisible && !editModalVisible}
        onCancel={() => {
          setSelectedOrder(null);
          setDetailModalVisible(false);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Mã đơn: </Text>
                  <Text code>{selectedOrder._id}</Text>
                </div>
                <div>
                  <Text strong>Loại: </Text>
                  {selectedOrder.sti_package_item ? (
                    <Tag color="blue">Gói xét nghiệm</Tag>
                  ) : (
                    <Tag color="green">Xét nghiệm lẻ</Tag>
                  )}
                </div>
                <div>
                  <Text strong>Ngày xét nghiệm: </Text>
                  <Text>{dayjs(selectedOrder.order_date).format('DD/MM/YYYY')}</Text>
                </div>
                <div>
                  <Text strong>Tổng tiền: </Text>
                  <Text style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatPrice(selectedOrder.total_amount)}
                  </Text>
                </div>
                <div>
                  <Text strong>Trạng thái: </Text>
                  <Tag color={getStatusColor(selectedOrder.order_status || 'Booked')}>
                    {getStatusText(selectedOrder.order_status || 'Booked')}
                  </Tag>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <Text strong>Ghi chú: </Text>
                    <Text>{selectedOrder.notes}</Text>
                  </div>
                )}
                <div>
                  <Text strong>Ngày đặt: </Text>
                  <Text>{dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                </div>
              </Space>
            </Card>
          </div>
        )}
      </Modal>

      {/* Modal chỉnh sửa đơn hàng */}
      <EditOrderModal
        visible={editModalVisible}
        order={selectedOrderForEdit}
        onClose={() => {
          setSelectedOrderForEdit(null);
          setEditModalVisible(false);
        }}
        onSubmit={handleUpdateOrder}
      />

      {/* Modal xác nhận hủy đơn */}
      <Modal
        title="Xác nhận hủy đơn hàng"
        open={cancelModalVisible}
        onOk={handleConfirmCancel}
        onCancel={handleRejectCancel}
        okText="Có, hủy đơn"
        cancelText="Không"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 22, marginRight: 12 }} />
          <Text strong>Bạn có chắc chắn muốn hủy đơn hàng này không?</Text>
        </div>
        <Text type="secondary">
          Sau khi hủy, đơn hàng sẽ không thể được khôi phục lại. Vui lòng xác nhận quyết định của bạn.
        </Text>
        {selectedOrderForCancel && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Text strong>Thông tin đơn hàng:</Text>
            <br />
            <Text>Mã đơn: {selectedOrderForCancel._id}</Text>
            <br />
            <Text>Ngày xét nghiệm: {dayjs(selectedOrderForCancel.order_date).format('DD/MM/YYYY')}</Text>
            <br />
            <Text>Tổng tiền: {formatPrice(selectedOrderForCancel.total_amount)}</Text>
          </div>
        )}
      </Modal>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default OrdersPage;