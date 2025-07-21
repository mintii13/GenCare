import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  message, 
  Space, 
  Tag, 
  Card,
  Row,
  Col,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { STITestService, STITest, CreateSTITestRequest, UpdateSTITestRequest } from '../../../../services/stiService';
import { useAuth } from '../../../../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

interface TestsManagementProps {
  refreshTrigger: number;
}

const TestsManagement: React.FC<TestsManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<STITest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<STITest | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTests();
  }, [refreshTrigger]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await STITestService.getAllTests({
        search: searchText || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        test_type: typeFilter !== 'all' ? typeFilter : undefined,
        is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined
      });
      
      if (response.success && response.data) {
        setTests(response.data.items as STITest[]);
      } else {
        message.error(response.message || 'Lỗi khi tải danh sách xét nghiệm');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTest(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (test: STITest) => {
    setEditingTest(test);
    form.setFieldsValue({
      sti_test_name: test.sti_test_name,
      sti_test_code: test.sti_test_code,
      description: test.description,
      price: test.price,
      category: test.category,
      sti_test_type: test.sti_test_type,
      is_active: test.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (testId: string) => {
    try {
      const response = await STITestService.deleteTest(testId);
      if (response.success) {
        message.success('Xóa xét nghiệm thành công');
        fetchTests();
      } else {
        message.error(response.message || 'Lỗi khi xóa xét nghiệm');
      }
    } catch (error) {
      message.error('Lỗi khi xóa xét nghiệm');
    }
  };

  const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
    try {
      const response = await STITestService.toggleTestStatus(testId, !currentStatus);
      if (response.success) {
        message.success(`Đã ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} xét nghiệm`);
        fetchTests();
      } else {
        message.error(response.message || 'Lỗi khi thay đổi trạng thái');
      }
    } catch (error) {
      message.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingTest) {
        const updateData: UpdateSTITestRequest = {
          sti_test_name: values.sti_test_name,
          sti_test_code: values.sti_test_code,
          description: values.description,
          price: values.price,
          category: values.category,
          sti_test_type: values.sti_test_type,
          is_active: values.is_active
        };
        
        const response = await STITestService.updateTest(editingTest._id, updateData);
        if (response.success) {
          message.success('Cập nhật xét nghiệm thành công');
          setModalVisible(false);
          fetchTests();
        } else {
          message.error(response.message || 'Lỗi khi cập nhật xét nghiệm');
        }
      } else {
        const createData: CreateSTITestRequest = {
          sti_test_name: values.sti_test_name,
          sti_test_code: values.sti_test_code,
          description: values.description,
          price: values.price,
          category: values.category,
          sti_test_type: values.sti_test_type,
          is_active: values.is_active
        };
        
        const response = await STITestService.createTest(createData);
        if (response.success) {
          message.success('Tạo xét nghiệm thành công');
          setModalVisible(false);
          fetchTests();
        } else {
          message.error(response.message || 'Lỗi khi tạo xét nghiệm');
        }
      }
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleSearch = () => {
    fetchTests();
  };

  const handleClearFilters = () => {
    setSearchText('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    fetchTests();
  };

  const columns = [
    {
      title: 'Mã xét nghiệm',
      dataIndex: 'sti_test_code',
      key: 'sti_test_code',
      width: 120,
    },
    {
      title: 'Tên xét nghiệm',
      dataIndex: 'sti_test_name',
      key: 'sti_test_name',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => price.toLocaleString(),
    },
    {
      title: 'Loại',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const colors = {
          bacterial: 'blue',
          viral: 'red',
          parasitic: 'orange'
        };
        return <Tag color={colors[category as keyof typeof colors]}>{category}</Tag>;
      },
    },
    {
      title: 'Phương pháp',
      dataIndex: 'sti_test_type',
      key: 'sti_test_type',
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_: any, record: STITest) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button 
              type="text" 
              icon={<Switch checked={record.is_active} />}
              onClick={() => handleToggleStatus(record._id, record.is_active)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa xét nghiệm này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Loại"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="bacterial">Vi khuẩn</Option>
              <Option value="viral">Virus</Option>
              <Option value="parasitic">Ký sinh trùng</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Phương pháp"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="máu">Máu</Option>
              <Option value="nước tiểu">Nước tiểu</Option>
              <Option value="dịch ngoáy">Dịch ngoáy</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Vô hiệu</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                Tìm kiếm
              </Button>
              <Button onClick={handleClearFilters}>
                <ClearOutlined />
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Thêm xét nghiệm
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={tests}
          rowKey="_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} xét nghiệm`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingTest ? 'Chỉnh sửa xét nghiệm' : 'Thêm xét nghiệm mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText={editingTest ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sti_test_code"
                label="Mã xét nghiệm"
                rules={[{ required: true, message: 'Vui lòng nhập mã xét nghiệm' }]}
              >
                <Input placeholder="VD: STI001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sti_test_name"
                label="Tên xét nghiệm"
                rules={[{ required: true, message: 'Vui lòng nhập tên xét nghiệm' }]}
              >
                <Input placeholder="VD: Xét nghiệm HIV" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={3} placeholder="Mô tả chi tiết về xét nghiệm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Giá (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Loại"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
              >
                <Select placeholder="Chọn loại">
                  <Option value="bacterial">Vi khuẩn</Option>
                  <Option value="viral">Virus</Option>
                  <Option value="parasitic">Ký sinh trùng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sti_test_type"
                label="Phương pháp"
                rules={[{ required: true, message: 'Vui lòng chọn phương pháp' }]}
              >
                <Select placeholder="Chọn phương pháp">
                  <Option value="máu">Máu</Option>
                  <Option value="nước tiểu">Nước tiểu</Option>
                  <Option value="dịch ngoáy">Dịch ngoáy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TestsManagement; 