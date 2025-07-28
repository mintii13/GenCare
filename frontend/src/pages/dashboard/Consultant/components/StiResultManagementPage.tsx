import React, { useState, useEffect } from 'react';

import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  message, 
  Tooltip,
  Card,
  Space,
  Row,
  Col,
  Input,
  Select,
  AutoComplete, 
} from 'antd';
import { 
  FormOutlined,
  EditOutlined, 
  PlusOutlined, 
  ClearOutlined,
  FileTextOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';
import dayjs from 'dayjs';
import StiResultDisplay from './StiResultDisplay';
import { TestTypes } from '@/services/stiResultService';
import { record } from 'zod';

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
    _id: string;
    sti_result_items: any,
    is_testing_completed: boolean,
    diagnosis: string,
    is_confirmed: boolean,
    medical_notes: string,
  }
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

interface StiOrderExtended extends StiOrder {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}
interface StiResultsManagementProps {
  refreshTrigger: number;
}

const StiResultsManagement: React.FC<StiResultsManagementProps> = ({ refreshTrigger }) => {
  const [orders, setOrders] = useState<StiOrderExtended[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [viewResult, setViewResult] = useState<any>(null);
  const [viewResultModalVisible, setViewResultModalVisible] = useState(false);
  const [noResultModalVisible, setNoResultModalVisible] = useState(false);
  
  
  // Selected items
  const [selectedOrder, setSelectedOrder] = useState<StiOrder | null>(null);


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
  const [search, setSearch] = useState('');
  
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [editResultModalVisible, setEditResultModalVisible] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [editResultForm] = Form.useForm();
  useEffect(() =>{
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
  }, [])
  // Fetch data on mount and refresh
  useEffect(() => {
    if (consultantId) {
      fetchOrders();
    }
  }, [consultantId, filters, refreshTrigger]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!consultantId) throw new Error('Không tìm thấy consultantId');
      const response = await apiClient.get(`${API.STI.GET_ALL_ORDERS_PAGINATED}?consultant_id=${consultantId}&search=${encodeURIComponent(search)}`);
      // const response = await apiClient.get(`${API.STI.GET_ALL_ORDERS_PAGINATED}`)
      const resData = (response as any).data;

      if (resData?.success) {
        const rawList = resData.data?.orders || resData.data?.items || [];
        const mapped = Array.isArray(rawList)
        ? rawList
            .filter((item: any) => item?.sti_result?.is_testing_completed)
            .map((item: any) => ({
              ...item,
              customer_name: item.customer?.full_name || item.customer_id?.full_name,
              customer_email: item.customer?.email || item.customer_id?.email,
              customer_phone: item.customer?.phone || item.customer_id?.phone,
            }))
        : [];
        console.error(1, "==========================")
        setOrders(mapped);
        console.error(2, "==========================")
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

  const handleEditResult = async (order: StiOrder) => {
    try {
      const res = await apiClient.get(API.STI.GET_STI_RESULT(order._id));
      const resultData = (res.data as any).data;

      if ((res.data as any)?.success && resultData) {
        setEditingResult({ ...resultData, orderId: order._id });
        editResultForm.setFieldsValue({
          diagnosis: resultData.diagnosis,
          medical_notes: resultData.medical_notes
        });
        setEditResultModalVisible(true);
      } else {
        message.error('Không tìm thấy kết quả xét nghiệm.');
      }
    } catch (err) {
      message.error('Lỗi khi lấy kết quả xét nghiệm.');
    }
  };

  const handleUpdateResult = async () => {
    try {
      const values = await editResultForm.validateFields();
      await apiClient.patch(API.STI.UPDATE_STI_RESULT_BY_ID(editingResult._id), {
        diagnosis: values.diagnosis,
        medical_notes: values.medical_notes,
      });

      message.success('Cập nhật kết quả thành công');
      setEditResultModalVisible(false);
      fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi cập nhật kết quả';
      message.error(msg);
    }
  };

  const handleConfirmResult = (record: any) => {
    Modal.confirm({
      title: 'Xác nhận kết quả?',
      content: 'Bạn có chắc chắn muốn xác nhận kết quả này không?',
      okText: 'Xác nhận',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await apiClient.patch(API.STI.CONFIRMED_STI_RESULT(record));

          setOrders(prev =>
            prev.map(item =>
              item._id === record._id ? { ...item, is_confirmed: true } : item
            )
          );

          message.success('Đã xác nhận kết quả');
          fetchOrders();
        } catch (error) {
          console.error('Xác nhận thất bại:', error);
          message.error('Xác nhận kết quả thất bại');
        }
      },
    });
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

  const isPatientServices = selectedOrder?.staff?.department === 'Patient Services';
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
      width: 160,
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
      title: 'Kết quả',
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
        console.log("Result id:= =====>", record.sti_result?._id);
        return (
          <Space size="small">
            <Tooltip title="Xem kết quả">
              <Button
                icon={<FileTextOutlined />}
                onClick={() => handleViewResults(record._id)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Sửa kết quả">
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditResult(record)}
                size="small"
                />
            </Tooltip>
            <Tooltip title="Xác nhận kết quả">
              <Button
                icon={<CheckCircleOutlined/>}
                onClick={() => handleConfirmResult(record.sti_result?._id)}
                size="small"
                disabled={(record.sti_result?.diagnosis.trim() == "" || record.sti_result?.medical_notes.trim()  == "" || record.sti_result?.is_confirmed)}
                />
            </Tooltip>
          </Space>
        );
      }
    }
  ];


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

  const diagnosisOptions = [
  { label: 'Chlamydia', value: 'Chlamydia' },
  { label: 'Lậu (Gonorrhea)', value: 'Gonorrhea' },
  { label: 'Giang mai (Syphilis)', value: 'Syphilis' },
  { label: 'Nhiễm nấm', value: 'Fungal Infection' },
  { label: 'Âm tính (Negative)', value: 'Negative' }
];
  return (
    <div>
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
            // showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>
      <Modal
        open={viewResultModalVisible}
        onCancel={() => setViewResultModalVisible(false)}
        footer={null}
        width={1000}
        title="Kết quả xét nghiệm"
      >
        {viewResult ? (
          <StiResultDisplay resultData={viewResult} />
        ) : null}
      </Modal>

      <Modal
        open={editResultModalVisible}
        title="Sửa kết quả xét nghiệm"
        onCancel={() => setEditResultModalVisible(false)}
        onOk={handleUpdateResult}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={editResultForm}>
          <Form.Item
            label="Chẩn đoán"
            name="diagnosis"
            rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}
          >
            <AutoComplete
              options={diagnosisOptions}
              placeholder="Chọn hoặc nhập chẩn đoán"
              filterOption={(inputValue, option) =>
                !!option?.label?.toLowerCase().includes(inputValue.toLowerCase())
              }
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Ghi chú"
            name="medical_notes"
            rules={[
              { max: 500, message: 'Tối đa 500 ký tự' },
              {required: true, message: 'Vui lòng nhập ghi chú'}
            ]}
          >
            <Input.TextArea rows={4} placeholder="Ghi chú kết quả" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default StiResultsManagement;