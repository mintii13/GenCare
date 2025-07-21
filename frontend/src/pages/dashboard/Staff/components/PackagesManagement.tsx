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
  Popconfirm,
  List
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  ClearOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { STIPackageService, STIPackage, CreateSTIPackageRequest, UpdateSTIPackageRequest, STITest, STITestService } from '../../../../services/stiService';
import { useAuth } from '../../../../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

interface PackagesManagementProps {
  refreshTrigger: number;
}

const PackagesManagement: React.FC<PackagesManagementProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<STIPackage[]>([]);
  const [availableTests, setAvailableTests] = useState<STITest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<STIPackage | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPackages();
    fetchAvailableTests();
  }, [refreshTrigger]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await STIPackageService.getAllPackages({
        search: searchText || undefined,
        is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined
      });
      
      if (response.success && response.data) {
        setPackages(response.data.items as STIPackage[]);
      } else {
        message.error(response.message || 'Lỗi khi tải danh sách gói xét nghiệm');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách gói xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const response = await STITestService.getActiveTests();
      if (response.success && response.data) {
        setAvailableTests(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách xét nghiệm:', error);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (pkg: STIPackage) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      sti_package_name: pkg.sti_package_name,
      sti_package_code: pkg.sti_package_code,
      description: pkg.description,
      price: pkg.price,
      sti_test_ids: pkg.sti_test_ids,
      is_active: pkg.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (packageId: string) => {
    try {
      const response = await STIPackageService.deletePackage(packageId);
      if (response.success) {
        message.success('Xóa gói xét nghiệm thành công');
        fetchPackages();
      } else {
        message.error(response.message || 'Lỗi khi xóa gói xét nghiệm');
      }
    } catch (error) {
      message.error('Lỗi khi xóa gói xét nghiệm');
    }
  };

  const handleToggleStatus = async (packageId: string, currentStatus: boolean) => {
    try {
      const response = await STIPackageService.togglePackageStatus(packageId, !currentStatus);
      if (response.success) {
        message.success(`Đã ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} gói xét nghiệm`);
        fetchPackages();
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
      
      if (editingPackage) {
        const updateData: UpdateSTIPackageRequest = {
          sti_package_name: values.sti_package_name,
          sti_package_code: values.sti_package_code,
          description: values.description,
          price: values.price,
          sti_test_ids: values.sti_test_ids,
          is_active: values.is_active
        };
        
        const response = await STIPackageService.updatePackage(editingPackage._id, updateData);
        if (response.success) {
          message.success('Cập nhật gói xét nghiệm thành công');
          setModalVisible(false);
          fetchPackages();
        } else {
          message.error(response.message || 'Lỗi khi cập nhật gói xét nghiệm');
        }
      } else {
        const createData: CreateSTIPackageRequest = {
          sti_package_name: values.sti_package_name,
          sti_package_code: values.sti_package_code,
          description: values.description,
          price: values.price,
          sti_test_ids: values.sti_test_ids,
          is_active: values.is_active
        };
        
        const response = await STIPackageService.createPackage(createData);
        if (response.success) {
          message.success('Tạo gói xét nghiệm thành công');
          setModalVisible(false);
          fetchPackages();
        } else {
          message.error(response.message || 'Lỗi khi tạo gói xét nghiệm');
        }
      }
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const handleSearch = () => {
    fetchPackages();
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    fetchPackages();
  };

  const getSelectedTestNames = (testIds: string[]) => {
    return availableTests
      .filter(test => testIds.includes(test._id))
      .map(test => test.sti_test_name);
  };

  const columns = [
    {
      title: 'Mã gói',
      dataIndex: 'sti_package_code',
      key: 'sti_package_code',
      width: 120,
    },
    {
      title: 'Tên gói',
      dataIndex: 'sti_package_name',
      key: 'sti_package_name',
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
      title: 'Số xét nghiệm',
      key: 'test_count',
      width: 100,
      render: (_: any, record: STIPackage) => record.sti_test_ids?.length || 0,
    },
    {
      title: 'Danh sách xét nghiệm',
      key: 'tests',
      width: 200,
      render: (_: any, record: STIPackage) => {
        const testNames = getSelectedTestNames(record.sti_test_ids || []);
        return (
          <Tooltip title={testNames.join(', ')}>
            <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {testNames.length > 0 ? testNames.slice(0, 2).join(', ') : 'Không có xét nghiệm'}
              {testNames.length > 2 && ` +${testNames.length - 2} khác`}
            </div>
          </Tooltip>
        );
      },
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
      render: (_: any, record: STIPackage) => (
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
            title="Bạn có chắc chắn muốn xóa gói xét nghiệm này?"
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
          <Col span={8}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã gói"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
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
          <Col span={12}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                Tìm kiếm
              </Button>
              <Button onClick={handleClearFilters}>
                <ClearOutlined />
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Thêm gói xét nghiệm
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={packages}
          rowKey="_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} gói xét nghiệm`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={editingPackage ? 'Chỉnh sửa gói xét nghiệm' : 'Thêm gói xét nghiệm mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText={editingPackage ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sti_package_code"
                label="Mã gói"
                rules={[{ required: true, message: 'Vui lòng nhập mã gói' }]}
              >
                <Input placeholder="VD: PKG001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sti_package_name"
                label="Tên gói"
                rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
              >
                <Input placeholder="VD: Gói xét nghiệm cơ bản" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={3} placeholder="Mô tả chi tiết về gói xét nghiệm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sti_test_ids"
            label="Danh sách xét nghiệm"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một xét nghiệm' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các xét nghiệm trong gói"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableTests.map(test => (
                <Option key={test._id} value={test._id}>
                  {test.sti_test_name} - {test.price.toLocaleString()} VNĐ
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Xét nghiệm đã chọn">
            <Form.Item name="selected_tests_display" noStyle>
              {({ getFieldValue }) => {
                const selectedTestIds = getFieldValue('sti_test_ids') || [];
                const selectedTests = availableTests.filter(test => selectedTestIds.includes(test._id));
                
                return (
                  <List
                    size="small"
                    dataSource={selectedTests}
                    renderItem={(test) => (
                      <List.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{test.sti_test_name}</span>
                          <span style={{ color: '#1890ff' }}>
                            {test.price.toLocaleString()} VNĐ
                          </span>
                        </div>
                      </List.Item>
                    )}
                  />
                );
              }}
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PackagesManagement; 