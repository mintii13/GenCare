import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  message, 
  Tooltip, 
  Card, 
  Row, 
  Col,
  Select,
  DatePicker,
  Statistic,
  Badge
} from 'antd';
import { 
  EditOutlined, 
  EyeOutlined, 
  CalendarOutlined, 
  LockOutlined, 
  UnlockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { testScheduleService } from '../../../../services/testScheduleService';
import { useAuth } from '../../../../contexts/AuthContext';
import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';

const { Option } = Select;

interface STIOrder {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  order_status: string;
  payment_status: string;
  total_amount: number;
  notes?: string;
  order_date: string;
  sti_package_item?: any;
  sti_test_items?: string[];
}

interface TestSchedule {
  _id: string;
  order_date: string;
  number_current_orders: number;
  is_locked: boolean;
  orders: STIOrder[];
}

interface ScheduleManagementProps {
  refreshTrigger: number;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  Booked: ['Accepted', 'Canceled'],
  Accepted: ['Processing', 'Canceled'],
  Processing: ['SpecimenCollected'],
  SpecimenCollected: ['Testing'],
  Testing: ['Completed'],
  Completed: [],
  Canceled: [],
};

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<TestSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<STIOrder | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSchedules();
  }, [refreshTrigger]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await testScheduleService.getSchedulesWithOrders();
      const resData = (res as any).data;
      
      if (resData?.success) {
        const mapped = (resData.result || []).map((sch: any) => ({
          _id: sch.date,
          order_date: sch.date,
          is_locked: sch.is_locked,
          number_current_orders: sch.number_current_orders,
          orders: (sch.tasks || []).map((t: any) => ({
            _id: t.id,
            customer_id: t.customer_id,
            order_status: t.status,
            payment_status: t.payment_status || 'Pending',
            total_amount: t.amount,
            notes: t.notes,
            order_date: sch.date,
            sti_package_item: undefined,
            sti_test_items: [],
          })),
        }));
        setSchedules(mapped);
      } else {
        message.error(resData?.message || 'Không thể tải lịch lấy mẫu');
      }
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi tải lịch lấy mẫu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`${API.STI.UPDATE_ORDER(orderId)}`, {
        order_status: newStatus,
      });
      const resData = (response as any).data;
      
      if (resData?.success) {
        message.success('Cập nhật trạng thái thành công');
        fetchSchedules();
        setEditModalVisible(false);
      } else {
        message.error(resData?.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi cập nhật');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Booked: 'blue',
      Accepted: 'cyan',
      Processing: 'orange',
      SpecimenCollected: 'purple',
      Testing: 'geekblue',
      Completed: 'green',
      Canceled: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      Booked: 'Đã đặt lịch',
      Accepted: 'Đã chấp nhận',
      Processing: 'Đang xử lý',
      SpecimenCollected: 'Đã lấy mẫu',
      Testing: 'Đang xét nghiệm',
      Completed: 'Hoàn thành',
      Canceled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'orange',
      Paid: 'green',
      Failed: 'red',
    };
    return colors[status] || 'default';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Filter schedules based on date and status
  const filteredSchedules = schedules.filter(schedule => {
    const dateMatch = !selectedDate || dayjs(schedule.order_date).isSame(selectedDate, 'day');
    const statusMatch = statusFilter === 'all' || 
      schedule.orders.some(order => order.order_status === statusFilter);
    return dateMatch && statusMatch;
  });

  // Calculate statistics
  const totalOrders = schedules.reduce((sum, schedule) => sum + schedule.number_current_orders, 0);
  const completedOrders = schedules.reduce((sum, schedule) => 
    sum + schedule.orders.filter(order => order.order_status === 'Completed').length, 0
  );
  const pendingOrders = schedules.reduce((sum, schedule) => 
    sum + schedule.orders.filter(order => ['Booked', 'Accepted', 'Processing'].includes(order.order_status)).length, 0
  );
  const lockedSchedules = schedules.filter(schedule => schedule.is_locked).length;

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id: string) => <span>{id.slice(-8)}</span>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (record: STIOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer_id?.full_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.customer_id?.email}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'order_status',
      key: 'order_status',
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 140,
      render: (amount: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {formatPrice(amount)}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (record: STIOrder) => (
        <Space>
          <Tooltip title="Cập nhật trạng thái">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setEditModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: 'Ngày lấy mẫu',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 150,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined />
          <span style={{ fontWeight: 500 }}>
            {dayjs(date).format('DD/MM/YYYY')}
          </span>
        </div>
      ),
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'number_current_orders',
      key: 'number_current_orders',
      width: 120,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'Trạng thái lịch',
      dataIndex: 'is_locked',
      key: 'is_locked',
      width: 140,
      render: (locked: boolean) => (
        <Tag 
          color={locked ? 'red' : 'green'} 
          icon={locked ? <LockOutlined /> : <UnlockOutlined />}
        >
          {locked ? 'Đã khóa' : 'Đang mở'}
        </Tag>
      ),
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 200,
      render: (record: TestSchedule) => {
        const completed = record.orders.filter(o => o.order_status === 'Completed').length;
        const total = record.orders.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Hoàn thành: {completed}/{total}</span>
              <span>{percentage}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 8, 
              backgroundColor: '#f0f0f0', 
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${percentage}%`, 
                height: '100%', 
                backgroundColor: percentage === 100 ? '#52c41a' : '#1890ff',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={completedOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lịch đã khóa"
              value={lockedSchedules}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Lọc theo ngày
            </label>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Chọn ngày"
              value={selectedDate}
              onChange={setSelectedDate}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Lọc theo trạng thái
            </label>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="Booked">Đã đặt lịch</Option>
              <Option value="Accepted">Đã chấp nhận</Option>
              <Option value="Processing">Đang xử lý</Option>
              <Option value="SpecimenCollected">Đã lấy mẫu</Option>
              <Option value="Testing">Đang xét nghiệm</Option>
              <Option value="Completed">Hoàn thành</Option>
              <Option value="Canceled">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ display: 'flex', alignItems: 'end' }}>
            <Button 
              onClick={() => {
                setSelectedDate(null);
                setStatusFilter('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Schedule Table */}
      <Card>
        <Table
          columns={scheduleColumns}
          dataSource={filteredSchedules}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: TestSchedule) => (
              <div style={{ padding: '16px 0' }}>
                <h4 style={{ marginBottom: 16 }}>
                  Đơn hàng ngày {dayjs(record.order_date).format('DD/MM/YYYY')}
                </h4>
                <Table
                  columns={orderColumns}
                  dataSource={record.orders}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                />
              </div>
            ),
            rowExpandable: (record: TestSchedule) => record.orders.length > 0,
            expandIcon: ({ expanded, onExpand, record }) => (
              <Tooltip title={expanded ? 'Thu gọn' : 'Mở rộng'}>
                <Button
                  type="text"
                  icon={expanded ? <EyeOutlined /> : <EyeOutlined />}
                  onClick={e => onExpand(record, e)}
                  size="small"
                />
              </Tooltip>
            ),
          }}
        />
      </Card>

      {/* Edit Order Status Modal */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Mã đơn:</strong> {selectedOrder._id.slice(-8)}</p>
                  <p><strong>Khách hàng:</strong> {selectedOrder.customer_id?.full_name}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Email:</strong> {selectedOrder.customer_id?.email}</p>
                  <p><strong>Tổng tiền:</strong> {formatPrice(selectedOrder.total_amount)}</p>
                </Col>
              </Row>
            </Card>

            <div style={{ marginBottom: 16 }}>
              <p><strong>Trạng thái hiện tại:</strong></p>
              <Tag color={getStatusColor(selectedOrder.order_status)} style={{ marginLeft: 8 }}>
                {getStatusText(selectedOrder.order_status)}
              </Tag>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Cập nhật trạng thái:
              </label>
              <Select
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="Chọn trạng thái mới"
                onChange={(value) => {
                  if (selectedOrder) {
                    handleUpdateOrderStatus(selectedOrder._id, value);
                  }
                }}
              >
                {VALID_TRANSITIONS[selectedOrder.order_status].map((status) => (
                  <Option key={status} value={status}>
                    <Tag color={getStatusColor(status)} style={{ marginRight: 8 }}>
                      {getStatusText(status)}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </div>

            {selectedOrder.notes && (
              <div>
                <p><strong>Ghi chú:</strong></p>
                <p style={{ 
                  padding: 12, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 4,
                  margin: 0
                }}>
                  {selectedOrder.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScheduleManagement; 