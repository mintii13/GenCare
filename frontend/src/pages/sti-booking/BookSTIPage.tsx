import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, DatePicker, Input, Button, Typography, Space, Tag, message, Steps, Spin, Row, Col, Alert } from 'antd';
import { CalendarOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { StiTest } from '../../types/sti';
import dayjs from 'dayjs';
import LicenseModal from '../../components/sti/LicenseModal';
import STIAssessmentModal from '../../components/sti/STIAssessmentModal';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';

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
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const testId = searchParams.get('testId');
  const packageId = searchParams.get('packageId');

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      toast.error('Vui lòng đăng nhập để sử dụng chức năng này!');
      setShowLoginModal(true);
      return;
    }

    if (testId) {
      fetchTestDetails();
    } else if (packageId) {
      fetchPackageDetails();
    }
    // Không cần testId hoặc packageId cho consultation mode
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
      message.error('Vui lòng chọn ngày tư vấn');
      return;
    }

    // Hiển thị modal đánh giá STI trước khi đặt lịch
    setShowAssessmentModal(true);
  };

  const handleLicenseAccept = async () => {
    setShowLicenseModal(false);
    setLoading(true);

    try {
      if (!orderDate) {
        message.error('Vui lòng chọn ngày xét nghiệm');
        return;
      }

      // Tạo STI order thay vì appointment
      const orderData = {
        sti_package_id: selectedPackage?._id || null,
        sti_test_items: selectedTest ? [selectedTest._id] : [],
        order_date: orderDate.format('YYYY-MM-DD'),
        notes: isConsultationMode 
          ? `Tư vấn xét nghiệm STI. ${notes.trim()}` 
          : notes.trim() || undefined
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

  const handleTakeAssessment = () => {
    setShowAssessmentModal(false);
    // Chuyển đến trang đánh giá STI
    navigate('/sti-assessment');
  };

  const handleSkipAssessment = () => {
    setShowAssessmentModal(false);
    // Tiếp tục flow đặt lịch bình thường
    setShowLicenseModal(true);
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

  // Cho phép consultation mode (không cần test hoặc package cụ thể)
  const isConsultationMode = !testId && !packageId;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        {isConsultationMode ? 'Đặt lịch tư vấn xét nghiệm STI' : 'Đặt lịch xét nghiệm STI'}
      </Title>

      {/* Thông báo quy trình mới */}
      <Alert
        message={isConsultationMode ? "Quy trình đặt lịch tư vấn" : "Quy trình đặt lịch xét nghiệm"}
        description={
          isConsultationMode 
            ? "Bạn sẽ được tư vấn và hướng dẫn chọn gói xét nghiệm phù hợp. Trung tâm sẽ liên hệ xác nhận lịch hẹn với bạn."
            : "Bạn đang xem thông tin về gói/xét nghiệm STI. Chọn ngày xét nghiệm và hoàn tất đặt lịch. Trung tâm sẽ liên hệ xác nhận lịch hẹn với bạn."
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

      {/* Thông tin xét nghiệm/gói (chỉ để tham khảo) */}
      {!isConsultationMode && (
        <Card title="Thông tin tham khảo" style={{ marginBottom: '24px' }}>
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
                <Text strong>Giá tham khảo: </Text>
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
                <Text strong>Giá tham khảo: </Text>
                <Text style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                  {formatPrice(selectedPackage.price)}
                </Text>
              </div>
            </Space>
          )}
        </Card>
      )}

      {/* Form đặt lịch tư vấn */}
      <Card title={isConsultationMode ? "Đặt lịch tư vấn" : "Đặt lịch xét nghiệm"}>
        <Form form={form} layout="vertical">
                      <Form.Item
              label={isConsultationMode ? "Ngày tư vấn" : "Ngày xét nghiệm"}
              required
              help="Không thể chọn ngày Chủ nhật và ngày đã qua"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={isConsultationMode ? "Chọn ngày tư vấn" : "Chọn ngày xét nghiệm"}
                disabledDate={disabledDate}
                value={orderDate}
                onChange={handleDateChange}
              />
            </Form.Item>

          <Form.Item label="Ghi chú (tùy chọn)">
                          <TextArea
                rows={4}
                placeholder={
                  isConsultationMode 
                    ? "Nhập thông tin về tình trạng sức khỏe, mong muốn tư vấn..." 
                    : "Nhập thông tin về tình trạng sức khỏe, yêu cầu đặc biệt..."
                }
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
                {isConsultationMode ? 'Đặt lịch tư vấn' : 'Đặt lịch xét nghiệm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Lưu ý */}
      <Card title="Lưu ý quan trọng" style={{ marginTop: '24px' }}>
        <ul>
          {isConsultationMode ? (
            <>
              <li>Buổi tư vấn sẽ diễn ra khoảng 30-45 phút</li>
              <li>Bác sĩ sẽ tư vấn gói xét nghiệm phù hợp với tình trạng của bạn</li>
              <li>Vui lòng đến đúng giờ đã hẹn</li>
              <li>Mang theo CMND/CCCD để xác minh danh tính</li>
              <li>Chuẩn bị các thông tin về tình trạng sức khỏe hiện tại</li>
              <li>Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
            </>
          ) : (
            <>
              <li>Buổi xét nghiệm sẽ diễn ra theo lịch đã đặt</li>
              <li>Vui lòng đến đúng giờ đã hẹn</li>
              <li>Mang theo CMND/CCCD để xác minh danh tính</li>
              <li>Chuẩn bị các thông tin về tình trạng sức khỏe hiện tại</li>
              <li>Tuân thủ hướng dẫn của nhân viên y tế</li>
              <li>Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
            </>
          )}
        </ul>
      </Card>

      {/* STI Assessment Modal */}
      <STIAssessmentModal
        visible={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onTakeAssessment={handleTakeAssessment}
        onSkipAssessment={handleSkipAssessment}
        loading={loading}
      />

      {/* License Modal */}
      <LicenseModal
        visible={showLicenseModal}
        onAccept={handleLicenseAccept}
        onCancel={handleLicenseCancel}
        title={
          isConsultationMode 
            ? "Điều khoản sử dụng dịch vụ tư vấn STI" 
            : "Điều khoản sử dụng dịch vụ xét nghiệm STI"
        }
      />
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default BookSTIPage; 