import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, DatePicker, Input, Button, Typography, Space, Tag, message, Steps, Spin, Row, Col, Alert } from 'antd';
import { CalendarOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { STIOrderService, CreateSTIOrderRequest } from '../../services/stiOrderService';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderDate, setOrderDate] = useState<dayjs.Dayjs | null>(null);
  const [notes, setNotes] = useState('');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<STIPackage | null>(null);
  const [packageLoading, setPackageLoading] = useState(false);
  const [hasCompletedScreening, setHasCompletedScreening] = useState(false);

  // Get query parameters
  const packageId = searchParams.get('packageId');
  const recommendedPackage = searchParams.get('recommendedPackage');

  // Fetch package info if packageId is provided (only ObjectId supported)
  useEffect(() => {
    const fetchPackageInfo = async () => {
      const packageToFetch = packageId || recommendedPackage;
      
      console.log('🔍 Debug package fetching:');
      console.log('  - packageId from URL:', packageId);
      console.log('  - recommendedPackage from URL:', recommendedPackage);
      console.log('  - packageToFetch:', packageToFetch);
      
      if (packageToFetch) {
        // Only support ObjectId format
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(packageToFetch);
        
        if (!isObjectId) {
          console.log('  - packageToFetch is not a valid ObjectId, skipping fetch');
          return;
        }
        
        setPackageLoading(true);
        try {
          const apiUrl = API.STI.GET_PACKAGE(packageToFetch);
          console.log('  - calling API:', apiUrl);
          
          const response = await apiClient.get(apiUrl);
          const data = response.data as any;
          console.log('  - API response:', data);
          
          if (data.success) {
            setSelectedPackage(data.stipackage);
            console.log('✅ Package loaded:', data.stipackage);
          } else {
            console.error('❌ Failed to load package:', data.message);
            toast.error('Không thể tải thông tin gói xét nghiệm');
          }
        } catch (error) {
          console.error('Error fetching package info:', error);
          toast.error('Lỗi khi tải thông tin gói xét nghiệm');
        } finally {
          setPackageLoading(false);
        }
      } else {
        console.log('  - No package to fetch');
      }
    };

    fetchPackageInfo();
  }, [packageId, recommendedPackage]);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      setShowLoginModal(true);
      return;
    }
    
    // Check if consultant is pre-selected from URL (like in BookAppointment)
    const consultantId = searchParams.get('consultant');
    if (consultantId) {
      console.log('📋 Pre-selected consultant from URL:', consultantId);
      // You can add logic here to handle consultant selection if needed
    }
  }, [user, searchParams]);

  useEffect(() => {
    setHasCompletedScreening(localStorage.getItem('sti_screening_completed') === 'true');
  }, []);

  // Auto-fill notes from STI screening results
  useEffect(() => {
    const screeningNotes = localStorage.getItem('sti_screening_consultation_notes');
    if (screeningNotes) {
      setNotes(screeningNotes);
      form.setFieldsValue({ notes: screeningNotes });
      toast.success('Đã tự động thêm kết quả sàng lọc STI vào ghi chú');
      localStorage.removeItem('sti_screening_consultation_notes');
      // Auto advance to step 2 if notes are filled
      if (orderDate) {
        setCurrentStep(2);
      }
    }
  }, [orderDate, form]);

  const disabledDate = (current: dayjs.Dayjs) => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const isWeekend = current.day() === 0;
    return current && (current <= tomorrow || isWeekend);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setOrderDate(date);
    if (date) setCurrentStep(1);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (e.target.value.trim() && currentStep === 1) setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!orderDate) {
      toast.error('Vui lòng chọn ngày tư vấn');
      return;
    }
    
    // Nếu đã có selectedPackage (từ STI Assessment hoặc URL params), bỏ qua assessment modal và license modal
    if (selectedPackage) {
      setShowLicenseModal(false);
      setLoading(true);
      await createOrder();
    } else {
      // Nếu chưa có package, hiện assessment modal
      setShowAssessmentModal(true);
    }
  };

  const createOrder = async () => {
    if (notes.length > 2000) {
      toast.error('Ghi chú không được vượt quá 2000 ký tự');
      return;
    }
    try {
      if (!orderDate) {
        toast.error('Vui lòng chọn ngày tư vấn');
        return;
      }
     
      // Tạo order data với validation
      const orderData: CreateSTIOrderRequest = {
        order_date: orderDate.format('YYYY-MM-DD'),
        notes: notes.trim() || undefined
      };
     
      // Nếu có selectedPackage, thêm thông tin package
      if (selectedPackage) {
        orderData.sti_package_id = selectedPackage._id;
      }
     
      console.log('Creating STI order with data:', orderData);
      
      // Sử dụng STIOrderService thay vì gọi API trực tiếp
      const response = await STIOrderService.createOrder(orderData);
      
      if (response.success) {
        const successMessage = selectedPackage 
          ? `Đặt lịch xét nghiệm ${selectedPackage.sti_package_name} thành công!`
          : 'Đặt lịch tư vấn thành công!';
        toast.success(successMessage);
        navigate('/sti-booking/orders');
      } else {
        // Kiểm tra nếu có pending order trong message
        if (response.message && response.message.includes('pending')) {
          toast('Không thể đặt lịch', { 
            icon: '⚠️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }
          });
        } else {
          toast.error(response.message || 'Có lỗi xảy ra khi đặt lịch');
        }
      }
    } catch (error: any) {
      console.error('Error booking STI order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đặt lịch';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseAccept = async () => {
    setShowLicenseModal(false);
    setLoading(true);
    await createOrder();
  };

  const handleLicenseCancel = () => setShowLicenseModal(false);
  const handleTakeAssessment = () => { setShowAssessmentModal(false); navigate('/sti-assessment'); };
  const handleSkipAssessment = () => { setShowAssessmentModal(false); setShowLicenseModal(true); };

  const steps = [
    { title: 'Chọn ngày', icon: <CalendarOutlined /> },
    { title: 'Ghi chú', icon: <FileTextOutlined /> },
    { title: 'Xác nhận', icon: <CheckCircleOutlined /> },
  ];

  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        maxWidth: '900px', 
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px 32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  if (packageLoading) {
    return (
      <div style={{ 
        padding: '24px', 
        maxWidth: '900px', 
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '64px 32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
            Đang tải thông tin gói xét nghiệm...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '900px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <Title 
          level={2}
          style={{
            textAlign: 'center',
            color: '#1f1f1f',
            marginBottom: '24px',
            fontSize: '28px',
            fontWeight: 700
          }}
        >
          {selectedPackage ? `Đặt lịch xét nghiệm: ${selectedPackage.sti_package_name}` : 'Đặt lịch tư vấn xét nghiệm STI'}
        </Title>
      
        {selectedPackage && (
          <Card 
            style={{ 
              marginBottom: '24px', 
              backgroundColor: '#f6ffed', 
              borderColor: '#b7eb8f',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={16} md={18}>
                <div>
                  <Title 
                    level={4} 
                    style={{ 
                      margin: '0 0 8px 0', 
                      color: '#389e0d',
                      fontWeight: 600,
                      lineHeight: 1.2
                    }}
                  >
                    {selectedPackage.sti_package_name}
                  </Title>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '14px',
                      lineHeight: 1.5,
                      display: 'block',
                      marginBottom: '4px'
                    }}
                  >
                    {selectedPackage.description}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8} md={6}>
                <div 
                  style={{ 
                    textAlign: 'right',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(56, 158, 13, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 158, 13, 0.2)'
                  }}
                >
                  <Text 
                    style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      display: 'block',
                      marginBottom: '2px'
                    }}
                  >
                    Giá gói
                  </Text>
                  <Text 
                    strong 
                    style={{ 
                      fontSize: '20px', 
                      color: '#389e0d',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      display: 'block'
                    }}
                  >
                    {selectedPackage.price?.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </div>
              </Col>
            </Row>
            
            {recommendedPackage && (
              <Alert
                message="Gói xét nghiệm được đề xuất"
                description="Gói xét nghiệm này được đề xuất dựa trên kết quả đánh giá STI của bạn"
                type="info"
                showIcon
                style={{ 
                  marginTop: '16px',
                  borderRadius: '8px'
                }}
              />
            )}
          </Card>
        )}
        
        <Alert
          message="Quy trình đặt lịch tư vấn"
          description={selectedPackage 
            ? "Bạn sẽ được tư vấn và thực hiện xét nghiệm theo gói đã chọn. Trung tâm sẽ liên hệ xác nhận lịch hẹn với bạn."
            : "Bạn sẽ được tư vấn và hướng dẫn chọn gói xét nghiệm phù hợp. Trung tâm sẽ liên hệ xác nhận lịch hẹn với bạn."
          }
          type="info"
          showIcon
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            border: '1px solid #1890ff20',
            backgroundColor: '#f0f9ff'
          }}
        />
        
        <Card 
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Steps 
            current={currentStep} 
            items={steps} 
            style={{ 
              padding: '8px 0'
            }} 
          />
        </Card>
        
        <Card 
          title={selectedPackage ? "Đặt lịch xét nghiệm" : "Đặt lịch tư vấn"}
          style={{
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          headStyle={{
            borderBottom: '1px solid #f0f0f0',
            fontSize: '18px',
            fontWeight: 600
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Ngày tư vấn" required help="Không thể chọn ngày Chủ nhật và ngày đã qua">
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày tư vấn"
                disabledDate={disabledDate}
                value={orderDate}
                onChange={handleDateChange}
              />
            </Form.Item>
            <Form.Item label="Ghi chú (tùy chọn)">
              <TextArea
                rows={4}
                placeholder={selectedPackage 
                  ? "Nhập thông tin về tình trạng sức khỏe, yêu cầu đặc biệt..."
                  : "Nhập thông tin về tình trạng sức khỏe, mong muốn tư vấn..."
                }
                maxLength={2000}
                value={notes}
                onChange={handleNotesChange}
                showCount
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => navigate('/test-packages')}>Quay lại</Button>
                <Button type="primary" loading={loading} onClick={handleSubmit} disabled={!orderDate}>
                  {selectedPackage ? 'Đặt lịch xét nghiệm' : 'Đặt lịch tư vấn'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
        
        <Card 
          title="Lưu ý quan trọng" 
          style={{ 
            marginTop: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          headStyle={{
            borderBottom: '1px solid #f0f0f0',
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          <ul>
            <li>Buổi tư vấn sẽ diễn ra khoảng 30-45 phút</li>
            <li>Bác sĩ sẽ tư vấn gói xét nghiệm phù hợp với tình trạng của bạn</li>
            <li>Vui lòng đến đúng giờ đã hẹn</li>
            <li>Mang theo CMND/CCCD để xác minh danh tính</li>
            <li>Chuẩn bị các thông tin về tình trạng sức khỏe hiện tại</li>
            <li>Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
          </ul>
        </Card>
        
        <STIAssessmentModal
          visible={showAssessmentModal}
          onClose={() => setShowAssessmentModal(false)}
          onTakeAssessment={handleTakeAssessment}
          onSkipAssessment={handleSkipAssessment}
          loading={loading}
        />
        
        <LicenseModal
          visible={showLicenseModal}
          onAccept={handleLicenseAccept}
          onCancel={handleLicenseCancel}
          title="Điều khoản sử dụng dịch vụ tư vấn STI"
        />
        
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    </div>
  );
};

export default BookSTIPage; 