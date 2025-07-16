import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Tag, Space, message, Modal, Input, Select, Row, Col, DatePicker } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
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
  status?: string;
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
      
      // Staff-only filters
      if (isStaffView) {
        if (paymentStatusFilter !== 'all') {
          params.append('payment_status', paymentStatusFilter);
        }
        
        if (sortBy !== 'order_date') {
          params.append('sort_by', sortBy);
        }
      }
      
      const fullUrl = `${endpoint}?${params.toString()}`;
      console.log('📡 Full URL being called:', fullUrl);
      
      const response = await apiClient.get<any>(fullUrl);
      
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config?.url,
        data: response.data
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

  const showOrderDetail = (order: STIOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
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
      dataIndex: 'status',
      key: 'status',
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
            onClick={() => showOrderDetail(record)}
          >
            Chi tiết
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Filter (ngay dưới header, trước bảng) */}
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
        <Button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
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
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
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
                  <Tag color={getStatusColor(selectedOrder.status || 'Booked')}>
                    {getStatusText(selectedOrder.status || 'Booked')}
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
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default OrdersPage; 