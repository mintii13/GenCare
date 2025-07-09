import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Tag, Space, message, Modal, Input, Select, Row, Col, DatePicker, InputNumber, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, SearchOutlined, FilterOutlined, ClearOutlined, ExportOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface STIOrder {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
  };
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
  payment_status?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderFilters {
  page: number;
  limit: number;
  order_status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

const StiOrdersManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<STIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<STIOrder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    sort_by: 'order_date',
    sort_order: 'desc'
  });
  
  // Form states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [amountRange, setAmountRange] = useState<[number?, number?]>([undefined, undefined]);

  // Check authorization
  useEffect(() => {
    if (!user || !['admin', 'staff', 'manager'].includes(user.role)) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        page: 1,
        search: searchTerm.trim() || undefined
      }));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<any>(`${API.STI.GET_ALL_ORDERS_PAGINATED}?${params.toString()}`);
      
      if ((response as any).success) {
        setOrders((response as any).data?.items || []);
        setTotal((response as any).data?.pagination?.total_items || 0);
        setCurrentPage((response as any).data?.pagination?.current_page || 1);
      } else {
        message.error('Không thể tải danh sách đơn hàng');
      }
    } catch (error: any) {
      console.error('Error fetching STI orders:', error);
      message.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
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
    handleFilterChange('payment_status', value === 'all' ? undefined : value);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`${API.STI.UPDATE_ORDER(orderId)}`, {
        status: newStatus
      });
      
        if ((response as any).success) {
        message.success('Cập nhật trạng thái thành công');
        fetchOrders();
        setEditModalVisible(false);
      } else {
        message.error((response as any).message || 'Không thể cập nhật trạng thái');
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      message.error('Có lỗi xảy ra khi cập nhật trạng thái');
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
      Canceled: 'red'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Pending: 'orange',
      Paid: 'green',
      Failed: 'red'
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
      Pending: 'Chờ thanh toán',
      Paid: 'Đã thanh toán',
      Failed: 'Thanh toán thất bại'
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id: string) => (
        <Text code>{id.slice(-8)}</Text>
      )
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (record: STIOrder) => (
        <div>
          <div className="font-medium">{record.customer_id?.full_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{record.customer_id?.email || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Loại xét nghiệm',
      key: 'type',
      width: 140,
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
        <Text strong style={{ color: '#1890ff' }}>
          {formatPrice(amount)}
        </Text>
      )
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string = 'Booked') => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 140,
      render: (status: string = 'Pending') => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: STIOrder) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {['admin', 'staff', 'manager'].includes(user?.role || '') && (
            <Tooltip title="Cập nhật trạng thái">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  setEditModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Quản lý đơn hàng STI</Title>
        <Space>
          <Button icon={<ExportOutlined />}>
            Xuất Excel
          </Button>
        </Space>
      </div>

      {/* Advanced Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <Input
              placeholder="Mã đơn, tên khách hàng, email..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn</label>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="Booked">Đã đặt lịch</Select.Option>
              <Select.Option value="Accepted">Đã chấp nhận</Select.Option>
              <Select.Option value="Processing">Đang xử lý</Select.Option>
              <Select.Option value="SpecimenCollected">Đã lấy mẫu</Select.Option>
              <Select.Option value="Testing">Đang xét nghiệm</Select.Option>
              <Select.Option value="Completed">Hoàn thành</Select.Option>
              <Select.Option value="Canceled">Đã hủy</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
            <Select
              style={{ width: '100%' }}
              value={paymentStatusFilter}
              onChange={handlePaymentStatusFilterChange}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="Pending">Chờ thanh toán</Select.Option>
              <Select.Option value="Paid">Đã thanh toán</Select.Option>
              <Select.Option value="Failed">Thanh toán thất bại</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng thời gian</label>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
                onChange={(dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => handleDateRangeChange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền tối thiểu</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền tối đa</label>
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

          <Col xs={24} sm={12} md={8} lg={6} style={{ display: 'flex', alignItems: 'end' }}>
            <Button 
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              style={{ marginBottom: '0px' }}
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
          scroll={{ x: 1200 }}
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
                <strong>Mã đơn:</strong> {selectedOrder._id}
              </Col>
              <Col span={12}>
                <strong>Khách hàng:</strong> {selectedOrder.customer_id?.full_name}
              </Col>
              <Col span={12}>
                <strong>Email:</strong> {selectedOrder.customer_id?.email}
              </Col>
              <Col span={12}>
                <strong>Ngày xét nghiệm:</strong> {dayjs(selectedOrder.order_date).format('DD/MM/YYYY')}
              </Col>
              <Col span={12}>
                <strong>Tổng tiền:</strong> {formatPrice(selectedOrder.total_amount)}
              </Col>
              <Col span={12}>
                <strong>Trạng thái:</strong> 
                <Tag color={getStatusColor(selectedOrder.status || 'Booked')} style={{ marginLeft: 8 }}>
                  {getStatusText(selectedOrder.status || 'Booked')}
                </Tag>
              </Col>
              <Col span={24}>
                <strong>Ghi chú:</strong> {selectedOrder.notes || 'Không có'}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <p><strong>Đơn hàng:</strong> {selectedOrder._id}</p>
            <p><strong>Khách hàng:</strong> {selectedOrder.customer_id?.full_name}</p>
            <p><strong>Trạng thái hiện tại:</strong> 
              <Tag color={getStatusColor(selectedOrder.status || 'Booked')} style={{ marginLeft: 8 }}>
                {getStatusText(selectedOrder.status || 'Booked')}
              </Tag>
            </p>
            
            <div style={{ marginTop: 16 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái mới:</label>
              <Select
                style={{ width: '100%', marginBottom: 16 }}
                defaultValue={selectedOrder.status || 'Booked'}
                onChange={(value) => {
                  if (selectedOrder) {
                    handleUpdateOrderStatus(selectedOrder._id, value);
                  }
                }}
              >
                <Select.Option value="Booked">Đã đặt lịch</Select.Option>
                <Select.Option value="Accepted">Đã chấp nhận</Select.Option>
                <Select.Option value="Processing">Đang xử lý</Select.Option>
                <Select.Option value="SpecimenCollected">Đã lấy mẫu</Select.Option>
                <Select.Option value="Testing">Đang xét nghiệm</Select.Option>
                <Select.Option value="Completed">Hoàn thành</Select.Option>
                <Select.Option value="Canceled">Đã hủy</Select.Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StiOrdersManagement; 