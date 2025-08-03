import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Modal, Select, message, Input, Space, Tag } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import { PlusOutlined, EditOutlined, SearchOutlined, EyeFilled } from '@ant-design/icons';
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
  sti_test_ids?: string[]; // Danh sách test IDs được populate từ StiPackageTest
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

  // Computed filtered tests - sử dụng useMemo để tối ưu performance
  const filteredTests = useMemo(() => {
    if (!selectedPackage || !availablePackages.length || !availableTests.length) {
      return availableTests;
    }

    const selectedPkg = availablePackages.find(p => p._id === selectedPackage);
    if (!selectedPkg) {
      return availableTests;
    }

    // Lấy danh sách test IDs trong package đã chọn
    const packageTestIds = selectedPkg.sti_test_ids || [];
    
    // Lọc ra những test không có trong package
    const filtered = availableTests.filter(test => 
      !packageTestIds.some(packageTestId => 
        packageTestId.toString() === test._id.toString()
      )
    );

    console.log('Selected package:', selectedPkg.sti_package_name);
    console.log('Package test IDs:', packageTestIds);
    console.log('Available tests:', availableTests.length);
    console.log('Filtered tests:', filtered.length);

    return filtered;
  }, [selectedPackage, availablePackages, availableTests]);

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

  // Reset selected tests khi thay đổi package
  useEffect(() => {
    if (selectedPackage) {
      // Khi chọn package mới, xóa các test đã chọn trước đó để tránh xung đột
      setSelectedTests([]);
    }
  }, [selectedPackage]);

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
      const tests = res.data?.stitest || [];
      setAvailableTests(tests);
      console.log('Loaded tests:', tests.length);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      const res: AxiosResponse = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      const packages = res.data?.stipackage || [];
      
      // Fetch test IDs cho từng package
      const packagesWithTests = await Promise.all(
        packages.map(async (pkg: StiPackage) => {
          try {
            // Fetch danh sách tests cho package này
            // Bạn cần cung cấp endpoint chính xác ở đây
            const packageTestsRes = await apiClient.get(API.STI.GET_PACKAGE_TESTS(pkg._id));
            console.log('package test rês ====================>', packageTestsRes)
            
            // Xử lý response để lấy test IDs
            let testIds: string[] = [];
            const responseData = packageTestsRes.data as any;
            
            if (responseData.data && Array.isArray(responseData.data)) {
              testIds = responseData.data.map((item: any) => item.sti_test_id || item._id);
            } else if (responseData.tests && Array.isArray(responseData.tests)) {
              testIds = responseData.tests.map((item: any) => item.sti_test_id || item._id);
            } else if (Array.isArray(responseData)) {
              testIds = responseData.map((item: any) => item.sti_test_id || item._id);
            }
            
            return {
              ...pkg,
              sti_test_ids: testIds
            };
          } catch (error) {
            console.error(`Error fetching tests for package ${pkg._id}:`, error);
            return {
              ...pkg,
              sti_test_ids: []
            };
          }
        })
      );
      
      setAvailablePackages(packagesWithTests);
      console.log('Loaded packages with tests:', packagesWithTests.length);
      console.log('Package with tests structure:', packagesWithTests[0]);
      console.log('First package test IDs:', packagesWithTests[0]?.sti_test_ids);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
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

  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setSelectedTests([]);
    setSelectedPackage(undefined);
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
    { title: 'Xét nghiệm lẻ', dataIndex: 'sti_test_details', key: 'tests', render: (_: unknown, r: StiOrder) => (r.sti_test_details?.map(t => t.sti_test_name).join(', ') || '-') },
    {
      title: 'Thông tin chi tiết',
      key: 'view',
      render: (_: unknown, record: StiOrder) => {
        return(
          <>
          <Button icon={<EyeFilled />} onClick={() => handleViewClick(record)}>
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
      <h1 style={{ marginBottom: 16, fontSize: '30px'}}>Đơn hàng STI</h1>
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
        onCancel={handleModalCancel}
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
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
            {selectedPackage ? `Hiển thị ${filteredTests.length} xét nghiệm (đã loại bỏ các xét nghiệm trong gói đã chọn)` : `Hiển thị tất cả ${availableTests.length} xét nghiệm`}
          </p>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Chọn xét nghiệm lẻ"
            value={selectedTests}
            onChange={setSelectedTests}
            allowClear
            disabled={filteredTests.length === 0}
          >
            {filteredTests.map(test => (
              <Select.Option key={test._id} value={test._id}>
                {test.sti_test_name}
              </Select.Option>
            ))}
          </Select>
          {filteredTests.length === 0 && selectedPackage && (
            <p style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '4px' }}>
              Gói xét nghiệm đã chọn bao gồm tất cả các xét nghiệm có sẵn
            </p>
          )}
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