import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { testScheduleService } from '@/services/testScheduleService';
import { API } from '@/config/apiEndpoints';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { FaKaaba } from 'react-icons/fa';

interface STIOrder {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
  };
  order_status: string;
  is_paid: boolean;
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  Booked: ['Accepted', 'Canceled'],
  Accepted: ['Processing', 'Canceled'],
  Processing: ['SpecimenCollected'],
  SpecimenCollected: ['Testing'],
  Testing: ['Completed'],
  Completed: [],
  Canceled: [],
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

const TestScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<TestSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<STIOrder | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await testScheduleService.getSchedulesWithOrders();
      const resData = (res as any).data;
      if (resData?.success) {
        const mapped = (resData.result || []).map((sch: any) => ({
          _id: sch.date, // use date as unique key
          order_date: sch.date,
          is_locked: sch.is_locked,
          number_current_orders: sch.number_current_orders,
          orders: (sch.tasks || []).map((t: any) => ({
            _id: t.id,
            customer_id: t.customer_id,
            order_status: t.status,
            is_paid: t.is_paid || false,
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

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => <span>{id.slice(-8)}</span>,
    },
    {
      title: 'Khách hàng',
      render: (record: STIOrder) => (
        <div>
          <div>{record.customer_id?.full_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.customer_id?.email}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'order_status',
      key: 'order_status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'is_paid',
      key: 'is_paid',
      render: (sts: string) => <Tag>{sts}</Tag>,
    },
    {
      title: 'Thao tác',
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
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Số đơn',
      dataIndex: 'number_current_orders',
      key: 'number_current_orders',
    },
    {
      title: 'Khoá',
      dataIndex: 'is_locked',
      key: 'is_locked',
      render: (locked: boolean) => (locked ? <Tag color="red">Đã khoá</Tag> : <Tag color="green">Mở</Tag>),
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Lịch lấy mẫu xét nghiệm</h1>
      <Table
        columns={scheduleColumns}
        dataSource={schedules}
        rowKey="_id"
        loading={loading}
        expandable={{
          expandedRowRender: (record: TestSchedule) => (
            <Table
              columns={orderColumns}
              dataSource={record.orders}
              rowKey="_id"
              pagination={false}
            />
          ),
          rowExpandable: (record: TestSchedule) => record.orders.length > 0,
        }}
      />

      {/* Modal cập nhật trạng thái */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <p>
              <strong>Đơn hàng:</strong> {selectedOrder._id}
            </p>
            <p>
              <strong>Khách hàng:</strong> {selectedOrder.customer_id?.full_name}
            </p>
            <p>
              <strong>Trạng thái hiện tại:</strong>{' '}
              <Tag color={getStatusColor(selectedOrder.order_status)} style={{ marginLeft: 8 }}>
                {getStatusText(selectedOrder.order_status)}
              </Tag>
            </p>
            <div style={{ marginTop: 16 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái mới:</label>
              <select
                className="w-full border rounded px-3 py-2"
                defaultValue={selectedOrder.order_status}
                onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
              >
                <option value={selectedOrder.order_status} disabled>
                  {getStatusText(selectedOrder.order_status)}
                </option>
                {VALID_TRANSITIONS[selectedOrder.order_status].map((st) => (
                  <option key={st} value={st}>
                    {getStatusText(st)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestScheduleManagement; 