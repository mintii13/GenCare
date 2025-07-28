import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Select, message, Input, Space, Tag } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { AxiosResponse } from 'axios';
import dayjs from 'dayjs';

// Types
interface StiOrder {
  _id: string;
  order_date: string;
  notes: string;
  order_code: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  total_amount: number;
  order_status: string;
  is_paid: boolean;
  created_at: string;
  sti_package_item?: {
    sti_package_id: string;
    package_name?: string;
  };
  sti_test_items?: string[];
  sti_test_details?: { _id: string; sti_test_name: string }[];
  sti_package_lookup?: { _id: string; sti_package_name: string }[];
}

interface StiTest {
  _id: string;
  sti_test_name: string;
}

interface StiPackage {
  _id: string;
  sti_package_name: string;
}

const ConsultantStiOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [availableTests, setAvailableTests] = useState<StiTest[]>([]);
  const [availablePackages, setAvailablePackages] = useState<StiPackage[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  // Lấy consultantId khi mount
  useEffect(() => {
    const fetchConsultantProfile = async () => {
      try {
        const res = await apiClient.get(API.Consultant.MY_PROFILE);
        const data = (res.data as any).data as { _id?: string };
        if (data && typeof data._id === 'string' && data._id.length === 24) {
          setConsultantId(data._id);
          console.log('Consultant ID lấy từ profile:', data._id);
        } else {
          setConsultantId(null);
          message.error('Không tìm thấy thông tin consultant');
        }
      } catch (err) {
        setConsultantId(null);
        message.error('Không thể lấy thông tin consultant');
      }
    };
    fetchConsultantProfile();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!consultantId) throw new Error('Không tìm thấy consultantId');
      const res: AxiosResponse = await apiClient.get(
        API.STI.GET_ALL_ORDERS_PAGINATED +
        `?consultant_id=${consultantId}&search=${encodeURIComponent(search)}`
      );
      setOrders(res.data?.data?.items || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      setError(error?.response?.data?.message || error?.message || 'Không thể tải danh sách đơn hàng');
      message.error(error?.response?.data?.message || error?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Gọi fetchOrders khi đã có consultantId
  useEffect(() => {
    if (consultantId) {
      fetchOrders();
      fetchAvailableTests();
      fetchAvailablePackages();
    }
  }, [consultantId]);

  const fetchAvailableTests = async () => {
    try {
      const res: AxiosResponse = await apiClient.get(API.STI.GET_ALL_TESTS);
      setAvailableTests(res.data?.stitest || []);
    } catch {}
  };
  const fetchAvailablePackages = async () => {
    try {
      const res: AxiosResponse = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      setAvailablePackages(res.data?.stipackage || []);
    } catch {}
  };

  const handleViewClick = (record: StiOrder) => {
    setSelectedOrder(record);
    setViewModalVisible(true);
  };
  const handleCloseModal = () => {
    setViewModalVisible(false);
    setSelectedOrder(null);
  };  
  const handleUpdateClick = (order: StiOrder) => {
    setSelectedOrder(order);
    setSelectedTests(order.sti_test_items || []);
    setSelectedPackage(order.sti_package_item?.sti_package_id);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!selectedOrder) return;
    const body: Record<string, unknown> = {};
    if (selectedTests.length > 0) body.sti_test_items = selectedTests;
    if (selectedPackage) body.sti_package_item = { sti_package_id: selectedPackage };
    // Nếu trạng thái hiện tại là Booked thì chuyển sang Accepted
    if (selectedOrder.order_status === 'Booked') {
      body.order_status = 'Accepted';
    }
    if (!body.sti_test_items && !body.sti_package_item) {
      message.warning('Chọn ít nhất 1 package hoặc test');
      return;
    }
    try {
      await apiClient.patch(API.STI.UPDATE_ORDER(selectedOrder._id), body);
      message.success('Cập nhật thành công!');
      setModalVisible(false);
      fetchOrders();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || 'Cập nhật thất bại!';
      message.error(errMsg);
    }
  };

  const columns = [
    { title: 'Ngày xét nghiệm', key: 'order_date', render: (_: unknown, r: StiOrder) => r.order_date ? dayjs(r.order_date).format('DD/MM/YYYY') : '—'},
    { title: 'Khách hàng', key: 'customer', render: (_: unknown, r: StiOrder & { customer?: { full_name?: string } }) => r.customer?.full_name },
    { title: 'Tổng tiền', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => v?.toLocaleString() },
    { title: 'Trạng thái', dataIndex: 'order_status', key: 'order_status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : 'blue'}>{v}</Tag> },
    { title: 'Gói xét nghiệm', key: 'package', render: (_: unknown, r: StiOrder & { sti_package_lookup?: { sti_package_name?: string }[] }) =>
      r.sti_package_lookup && r.sti_package_lookup.length > 0
        ? r.sti_package_lookup[0].sti_package_name
        : '-' },
<<<<<<< HEAD
    { title: 'Xét nghiệm lẻ', dataIndex: 'sti_test_details', key: 'tests', render: (_: unknown, r: StiOrder) => (r.sti_test_details?.map(t => t.sti_test_name).join(', ') || '-') },
=======
    { title: 'Test lẻ', dataIndex: 'sti_test_details', key: 'tests', render: (_: unknown, r: StiOrder) => (r.sti_test_details?.map(t => t.sti_test_name).join(', ') || '-') },
>>>>>>> e27dadd9bbb88346272f3cfb2875fc6d5fa6c2ca
    // { title: 'Note', dataIndex: 'notes', key: 'notes', render: (_: unknown, r: StiOrder) => (r.notes || 'Không có ghi chú') },
    {
      title: 'Thông tin chi tiết',
      key: 'view',
      render: (_: unknown, record: StiOrder) => {
        return(
          <>
          <Button icon={<EditOutlined />} onClick={() => handleViewClick(record)}>
            Xem thông tin
          </Button>
          </>
        )
     }
    },
    {
      title: 'Sửa đơn hàng',
      key: 'edit',
      render: (_: unknown, record: StiOrder) => {
        const canEdit = record.order_status === 'Booked' || record.order_status === 'Accepted'; 
        return(
          <>
          <Button icon={<EditOutlined />} onClick={() => handleUpdateClick(record)} disabled={!canEdit}>
            Cập nhật
          </Button>
          </>
        )
    }
    },
  ];

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Đơn hàng STI</h2>
        <div style={{ color: 'red', marginTop: 16 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Đơn hàng STI</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm mã đơn, tên khách..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={fetchOrders}
          enterButton={<SearchOutlined />}
        />
        <Button icon={<PlusOutlined />} onClick={fetchOrders}>Làm mới</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Cập nhật gói xét nghiệm và xét nghiệm lẻ cho đơn hàng"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <label>Chọn gói xét nghiệm:</label>
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn gói xét nghiệm"
            value={selectedPackage}
            onChange={setSelectedPackage}
            allowClear
          >
            {availablePackages.map(pkg => (
              <Select.Option key={pkg._id} value={pkg._id}>{pkg.sti_package_name}</Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label>Chọn xét nghiệm lẻ:</label>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Chọn xét nghiệm lẻ"
            value={selectedTests}
            onChange={setSelectedTests}
            allowClear
          >
            {availableTests.map(test => (
              <Select.Option key={test._id} value={test._id}>{test.sti_test_name}</Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
      <Modal
        title="Thông tin đơn hàng"
        open={viewModalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <p><strong>Ngày đặt hàng:</strong> {selectedOrder?.order_date ? new Date((selectedOrder as StiOrder).order_date).toISOString().slice(0, 10).split('-').reverse().join('/') : 'Không có'}</p>
        <p><strong>Ghi chú:</strong> {(selectedOrder as StiOrder)?.notes || 'Không có'}</p>
      </Modal>
    </div>
  );
};

export default ConsultantStiOrdersPage; 