import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, DatePicker, Input, Button, Typography, Space, Tag, message, Steps, Spin, Row, Col, Alert } from 'antd';
import { CalendarOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { StiTest } from '../../types/sti';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface STIPackage {
  _id: string;
  sti_package_name: string;
  sti_package_code: string;
  price: number;
  description: string;
  is_active: boolean;
}

const BookSTIPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTest, setSelectedTest] = useState<StiTest | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<STIPackage | null>(null);
  const [orderDate, setOrderDate] = useState<dayjs.Dayjs | null>(null);
  const [notes, setNotes] = useState('');

  const testId = searchParams.get('testId');
  const packageId = searchParams.get('packageId');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      message.error('Chỉ khách hàng mới có thể đặt lịch xét nghiệm');
      navigate('/login');
      return;
    }

    if (testId) {
      fetchTestDetails();
    } else if (packageId) {
      fetchPackageDetails();
    } else {
      message.error('Không tìm thấy thông tin xét nghiệm');
      navigate('/test-packages');
    }
  }, [testId, packageId, user]);

  const fetchTestDetails = async () => {
    setLoading(true);
    
    try {
      const response = await apiClient.get<any>(API.STI.GET_TEST(testId!));
      if (response.data.success) {
        setSelectedTest(response.data.stitest);
      } else {
        message.error('Không tìm thấy thông tin xét nghiệm');
        navigate('/test-packages');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải thông tin xét nghiệm');
      navigate('/test-packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageDetails = async () => {
    setLoading(true);
    
    try {
      const response = await apiClient.get<any>(API.STI.GET_PACKAGE(packageId!));
      if (response.data.success) {
        setSelectedPackage(response.data.stipackage);
      } else {
        message.error('Không tìm thấy thông tin gói xét nghiệm');
        navigate('/test-packages');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải thông tin gói xét nghiệm');
      navigate('/test-packages');
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

  const disabledDate = (current: dayjs.Dayjs) => {
    // Không cho chọn ngày quá khứ và chủ nhật
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
    if (e.target.value.trim() && currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!orderDate) {
      message.error('Vui lòng chọn ngày xét nghiệm');
      return;
    }

    setLoading(true);

    try {
      const orderData: any = {
        order_date: orderDate.format('YYYY-MM-DD'),
        notes: notes.trim()
      };

      if (packageId) {
        orderData.sti_package_id = packageId;
      } else if (testId) {
        orderData.sti_test_items = [testId];
      }

      const response = await apiClient.post<any>(API.STI.CREATE_ORDER, orderData);

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

  const steps = [
    {
      title: 'Chọn ngày',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Ghi chú',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Xác nhận',
      icon: <CheckCircleOutlined />,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!selectedTest && !selectedPackage) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Alert
          message="Không tìm thấy thông tin"
          description="Không thể tải thông tin xét nghiệm hoặc gói xét nghiệm."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/test-packages')}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Đặt lịch xét nghiệm STI</Title>

      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

      {/* Thông tin xét nghiệm/gói */}
      <Card title="Thông tin xét nghiệm" style={{ marginBottom: '24px' }}>
        {selectedTest && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Tên xét nghiệm: </Text>
              <Text>{selectedTest.sti_test_name}</Text>
            </div>
            <div>
              <Text strong>Mã: </Text>
              <Text>{selectedTest.sti_test_code}</Text>
            </div>
            <div>
              <Text strong>Mô tả: </Text>
              <Text>{selectedTest.description}</Text>
            </div>
            <div>
              <Text strong>Giá: </Text>
              <Text style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                {formatPrice(selectedTest.price)}
              </Text>
            </div>
            <div>
              <Tag color="blue">{selectedTest.category}</Tag>
              <Tag>{selectedTest.sti_test_type}</Tag>
            </div>
          </Space>
        )}

        {selectedPackage && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Tên gói: </Text>
              <Text>{selectedPackage.sti_package_name}</Text>
            </div>
            <div>
              <Text strong>Mã: </Text>
              <Text>{selectedPackage.sti_package_code}</Text>
            </div>
            <div>
              <Text strong>Mô tả: </Text>
              <Text>{selectedPackage.description}</Text>
            </div>
            <div>
              <Text strong>Giá: </Text>
              <Text style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                {formatPrice(selectedPackage.price)}
              </Text>
            </div>
          </Space>
        )}
      </Card>

      {/* Form đặt lịch */}
      <Card title="Thông tin đặt lịch">
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
              placeholder="Nhập ghi chú về tình trạng sức khỏe, yêu cầu đặc biệt..."
              maxLength={500}
              value={notes}
              onChange={handleNotesChange}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/test-packages')}>
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

      {/* Lưu ý */}
      <Card title="Lưu ý quan trọng" style={{ marginTop: '24px' }}>
        <ul>
          <li>Vui lòng đến đúng giờ đã hẹn để đảm bảo chất lượng mẫu xét nghiệm</li>
          <li>Không được ăn uống trước khi xét nghiệm (tùy loại xét nghiệm)</li>
          <li>Mang theo CMND/CCCD để xác minh danh tính</li>
          <li>Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
          <li>Kết quả xét nghiệm sẽ có sau 3-7 ngày làm việc</li>
        </ul>
      </Card>
    </div>
  );
};

export default BookSTIPage; 