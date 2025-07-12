import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, DatePicker, Input, Button, Typography, Space, Tag, message, Steps, Checkbox, Row, Col, Divider } from 'antd';
import { CalendarOutlined, FileTextOutlined, CheckCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { StiTest } from '../../types/sti';
import dayjs from 'dayjs';
import LicenseModal from '../../components/sti/LicenseModal';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SelectedTest {
  test: StiTest;
  checked: boolean;
}

const MultipleTestBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [allTests, setAllTests] = useState<StiTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [orderDate, setOrderDate] = useState<dayjs.Dayjs | null>(null);
  const [notes, setNotes] = useState('');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      toast.error('Vui lòng đăng nhập để sử dụng chức năng này!');
      setShowLoginModal(true);
      return;
    }
    fetchAllTests();
  }, [user]);

  const fetchAllTests = async () => {
    try {
      const response = await apiClient.get<any>('/sti/getAllStiTest');
      if (response.data.success && Array.isArray(response.data.stitest)) {
        const tests = response.data.stitest
          .filter((test: any) => test.is_active)
          .map((test: any) => ({
            ...test,
            isActive: test.is_active
          }));
        setAllTests(tests);
        setSelectedTests(tests.map((test: StiTest) => ({ test, checked: false })));
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải danh sách xét nghiệm');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      viral: 'red',
      bacterial: 'blue',
      parasitic: 'green'
    };
    return colors[category] || 'default';
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    const today = dayjs().startOf('day');
    const isWeekend = current.day() === 0; // 0 = Sunday
    return current && (current < today || isWeekend);
  };

  const handleTestSelection = (testId: string, checked: boolean) => {
    setSelectedTests(prev => 
      prev.map(item => 
        item.test._id === testId 
          ? { ...item, checked }
          : item
      )
    );
  };

  const handleNextStep = () => {
    const checkedTests = selectedTests.filter(item => item.checked);
    if (checkedTests.length === 0) {
      message.error('Vui lòng chọn ít nhất một xét nghiệm');
      return;
    }
    setCurrentStep(1);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setOrderDate(date);
    if (date) {
      setCurrentStep(2);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async () => {
    const checkedTests = selectedTests.filter(item => item.checked);
    
    if (checkedTests.length === 0) {
      message.error('Vui lòng chọn ít nhất một xét nghiệm');
      return;
    }

    if (!orderDate) {
      message.error('Vui lòng chọn ngày xét nghiệm');
      return;
    }

    // Show license modal before submitting
    setShowLicenseModal(true);
  };

  const handleLicenseAccept = async () => {
    setShowLicenseModal(false);
    setLoading(true);

    try {
      const checkedTests = selectedTests.filter(item => item.checked);
      const testIds = checkedTests.map(item => item.test._id);
      
      const orderData = {
        sti_test_items: testIds,
        order_date: orderDate!.format('YYYY-MM-DD'),
        notes: notes.trim()
      };

      const response = await apiClient.post<any>('/sti/book-multiple', {
        testIds: selectedTests,
      });

      if (response.data.success) {
        message.success('Đặt lịch xét nghiệm thành công!');
        navigate('/sti-booking/orders');
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } catch (error: any) {
      console.error('Error creating STI order:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch xét nghiệm';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseCancel = () => {
    setShowLicenseModal(false);
  };

  const getSelectedTestsInfo = () => {
    const selected = selectedTests.filter(item => item.checked);
    const totalPrice = selected.reduce((sum, item) => sum + item.test.price, 0);
    return { selected, totalPrice };
  };

  const { selected: checkedTests, totalPrice } = getSelectedTestsInfo();

  const steps = [
    {
      title: 'Chọn xét nghiệm',
      icon: <ShoppingCartOutlined />,
    },
    {
      title: 'Chọn ngày',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Xác nhận',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Đặt lịch nhiều xét nghiệm STI</Title>

      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

      {currentStep === 0 && (
        <Card title="Chọn xét nghiệm STI">
          <Row gutter={[16, 16]}>
            {selectedTests.map(({ test, checked }) => (
              <Col xs={24} sm={12} md={8} lg={6} key={test._id}>
                <Card
                  size="small"
                  style={{ 
                    border: checked ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    backgroundColor: checked ? '#f6ffed' : 'white',
                    height: '260px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 } }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => handleTestSelection(test._id, e.target.checked)}
                      style={{ fontWeight: 'bold' }}
                    >
                      {test.sti_test_name}
                    </Checkbox>
                  </div>
                  
                  <Space direction="vertical" size="small" style={{ width: '100%', flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Mã: {test.sti_test_code}
                    </Text>
                    <Text style={{ fontSize: '12px', display: 'block' }}>
                      {test.description}
                    </Text>
                    <Text strong style={{ color: '#1890ff' }}>
                      {formatPrice(test.price)}
                    </Text>
                    <div style={{ marginTop: 'auto' }}>
                      <Tag color={getCategoryColor(test.category)}>
                        {test.category}
                      </Tag>
                      <Tag>{test.sti_test_type}</Tag>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Đã chọn: {checkedTests.length} xét nghiệm</Text>
              <br />
              <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                Tổng cộng: {formatPrice(totalPrice)}
              </Text>
            </div>
            <Space>
              <Button onClick={() => navigate('/test-packages')}>
                Quay lại
              </Button>
              <Button type="primary" onClick={handleNextStep}>
                Tiếp tục
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="Chọn ngày xét nghiệm">
          <Form form={form} layout="vertical">
            <Form.Item
              label="Ngày xét nghiệm"
              required
              help="Không thể chọn ngày Chủ nhật và ngày đã qua"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày xét nghiệm"
                disabledDate={disabledDate}
                value={orderDate}
                onChange={handleDateChange}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>
                Quay lại
              </Button>
              <Button 
                type="primary" 
                onClick={() => orderDate && setCurrentStep(2)}
                disabled={!orderDate}
              >
                Tiếp tục
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="Xác nhận thông tin">
          {/* Tóm tắt xét nghiệm đã chọn */}
          <Card title="Xét nghiệm đã chọn" style={{ marginBottom: '16px' }}>
            {checkedTests.map(({ test }) => (
              <div key={test._id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px'
              }}>
                <div>
                  <Text strong>{test.sti_test_name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {test.sti_test_code}
                  </Text>
                </div>
                <Text strong style={{ color: '#1890ff' }}>
                  {formatPrice(test.price)}
                </Text>
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Tổng cộng:</Text>
              <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                {formatPrice(totalPrice)}
              </Text>
            </div>
          </Card>

          <Form form={form} layout="vertical">
            <Form.Item label="Ngày xét nghiệm">
              <Text strong>{orderDate?.format('DD/MM/YYYY')}</Text>
            </Form.Item>

            <Form.Item label="Ghi chú (tùy chọn)">
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú về tình trạng sức khỏe, yêu cầu đặc biệt..."
                maxLength={500}
                value={notes}
                onChange={handleNotesChange}
                showCount
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(1)}>
                Quay lại
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                size="large"
              >
                Đặt lịch xét nghiệm
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Lưu ý */}
      <Card title="Lưu ý quan trọng" style={{ marginTop: '24px' }}>
        <ul>
          <li>Bạn có thể chọn nhiều xét nghiệm trong cùng một lần đặt lịch</li>
          <li>Tất cả xét nghiệm sẽ được thực hiện trong cùng ngày đã chọn</li>
          <li>Vui lòng đến đúng giờ để đảm bảo chất lượng mẫu xét nghiệm</li>
          <li>Mang theo CMND/CCCD để xác minh danh tính</li>
          <li>Kết quả xét nghiệm sẽ có sau 3-7 ngày làm việc</li>
        </ul>
      </Card>

      {/* License Modal */}
      <LicenseModal
        visible={showLicenseModal}
        onAccept={handleLicenseAccept}
        onCancel={handleLicenseCancel}
        title="Điều khoản sử dụng dịch vụ xét nghiệm STI"
      />

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default MultipleTestBooking; 