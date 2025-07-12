import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, DatePicker, Input, Button, Typography, Space, Tag, message, Steps, Checkbox, Row, Col, Divider, Alert } from 'antd';
import { CalendarOutlined, FileTextOutlined, CheckCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { StiTest } from '../../types/sti';
import dayjs from 'dayjs';
import LicenseModal from '../../components/sti/LicenseModal';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';
import { API } from '../../config/apiEndpoints';

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

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setOrderDate(date);
    if (date) {
      setCurrentStep(1);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async () => {
    if (!orderDate) {
      message.error('Vui lòng chọn ngày tư vấn');
      return;
    }

    setShowLicenseModal(true);
  };

  const handleLicenseAccept = async () => {
    setShowLicenseModal(false);
    setLoading(true);

    try {
      // Tạo STI order thay vì appointment
      const orderData = {
        sti_package_id: null, // Không chọn gói cụ thể
        sti_test_items: [], // Không chọn test cụ thể
        order_date: orderDate!.format('YYYY-MM-DD'),
        notes: `Tư vấn xét nghiệm STI. ${notes.trim()}`
      };

      const response = await apiClient.post<any>(API.STI.CREATE_ORDER, orderData);

      if (response.data.success) {
        message.success('Đặt lịch xét nghiệm thành công!');
        navigate('/sti-booking/orders');
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } catch (error: any) {
      console.error('Error booking STI order:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseCancel = () => {
    setShowLicenseModal(false);
  };

  const steps = [
    {
      title: 'Xem thông tin',
      icon: <ShoppingCartOutlined />,
    },
    {
      title: 'Chọn ngày xét nghiệm',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Xác nhận',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Xem thông tin xét nghiệm STI</Title>

      {/* Thông báo quy trình mới */}
      <Alert
        message="Quy trình đặt lịch xét nghiệm"
        description="Bạn đang xem thông tin tham khảo về các xét nghiệm STI. Để đặt lịch, vui lòng chọn 'Đặt lịch xét nghiệm' bên dưới. Trung tâm sẽ liên hệ xác nhận và tư vấn chọn xét nghiệm phù hợp."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

      {currentStep === 0 && (
        <Card title="Thông tin tham khảo các xét nghiệm STI">
          <Row gutter={[16, 16]}>
            {allTests.map((test) => (
              <Col xs={24} sm={12} md={8} lg={6} key={test._id}>
                <Card
                  size="small"
                  style={{ 
                    border: '1px solid #d9d9d9',
                    backgroundColor: 'white',
                    height: '260px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 } }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {test.sti_test_name}
                    </Text>
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
              <Text strong>Tổng cộng: {allTests.length} xét nghiệm có sẵn</Text>
              <br />
              <Text type="secondary">Trung tâm sẽ tư vấn chọn xét nghiệm phù hợp khi bạn đến</Text>
            </div>
            <Button type="primary" onClick={() => setCurrentStep(1)}>
              Đặt lịch xét nghiệm
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="Đặt lịch xét nghiệm">
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

            <Form.Item label="Ghi chú (tùy chọn)">
              <TextArea
                rows={4}
                placeholder="Nhập thông tin về tình trạng sức khỏe, yêu cầu đặc biệt..."
                maxLength={500}
                value={notes}
                onChange={handleNotesChange}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  Quay lại
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={!orderDate}
                >
                  Đặt lịch xét nghiệm
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* License Modal */}
      <LicenseModal
        visible={showLicenseModal}
        onAccept={handleLicenseAccept}
        onCancel={handleLicenseCancel}
        title="Điều khoản sử dụng dịch vụ xét nghiệm STI"
      />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default MultipleTestBooking; 