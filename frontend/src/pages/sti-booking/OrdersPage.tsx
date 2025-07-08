import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Tag, Space, message, Modal, Input, Select, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import dayjs from 'dayjs';

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
  const { user } = useAuth();
  const [orders, setOrders] = useState<STIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<STIOrder | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      message.error('Chỉ khách hàng mới có thể xem lịch xét nghiệm');
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, currentPage, pageSize, debouncedSearchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'customer' 
        ? '/sti/my-orders' 
        : '/sti/getAllStiOrders';
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await apiClient.get<any>(`${endpoint}?${params.toString()}`);
      
      if (response.data.success) {
        setOrders(response.data.data?.orders || response.data.orders || []);
        setTotal(response.data.data?.total || response.data.total || 0);
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
      pending: 'orange',
      confirmed: 'green',
      completed: 'blue',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
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
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => (
        <Text code>{id.slice(-8)}</Text>
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
      title: 'Ngày xét nghiệm',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date: string) => (
        <div>
          <CalendarOutlined style={{ marginRight: 8 }} />
          {dayjs(date).format('DD/MM/YYYY')}
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
      render: (status: string = 'pending') => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Lịch xét nghiệm STI đã đặt</Title>
        <Button type="primary" onClick={() => navigate('/test-packages')}>
          Đặt lịch mới
        </Button>
      </div>

      {/* Search and Filter */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={12} lg={8}>
            <Input
              placeholder="Tìm kiếm theo mã đơn, ghi chú..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="pending">Chờ xác nhận</Select.Option>
              <Select.Option value="confirmed">Đã xác nhận</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} lịch xét nghiệm`,
          onChange: (page, size) => {
            setCurrentPage(page);
            if (size !== pageSize) {
              setPageSize(size);
              setCurrentPage(1); // Reset to first page when page size changes
            }
          },
          onShowSizeChange: (current, size) => {
            setPageSize(size);
            setCurrentPage(1);
          }
        }}
        locale={{
          emptyText: 'Bạn chưa đặt lịch xét nghiệm nào'
        }}
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
                  <Tag color={getStatusColor(selectedOrder.status || 'pending')}>
                    {getStatusText(selectedOrder.status || 'pending')}
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
    </div>
  );
};

export default OrdersPage; 