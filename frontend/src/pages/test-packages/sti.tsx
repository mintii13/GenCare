import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Typography, Button, Tabs, Modal, Space, Spin, Empty } from 'antd';
import type { TabsProps } from 'antd';
import { AppstoreOutlined, ExperimentOutlined, ArrowRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { message } from 'antd';
import { StiTest, StiPackage } from '../../types/sti';

const { Title, Text } = Typography;

interface ApiResponse<T> {
  success: boolean;
  stipackage?: T[];
  stitest?: T[];
}

const STITestPage = () => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const [packages, setPackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch packages
        const packagesResponse = await apiClient.get<ApiResponse<StiPackage>>('/sti/getAllStiPackage');
        if (packagesResponse.data.success && Array.isArray(packagesResponse.data.stipackage)) {
          setPackages(packagesResponse.data.stipackage);
        } else {
          setPackages([]);
        }

        // Fetch tests
        const testsResponse = await apiClient.get<ApiResponse<StiTest>>('/sti/getAllStiTest');
        if (testsResponse.data.success && Array.isArray(testsResponse.data.stitest)) {
          setTests(testsResponse.data.stitest);
        } else {
          setTests([]);
        }
      } catch (error) {
        console.error('Error fetching STI data:', error);
        setTests([]);
        setPackages([]);
        message.error('Không thể tải dữ liệu xét nghiệm');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssessmentChoice = (doAssessment: boolean) => {
    setShowAssessmentModal(false);
    
    if (doAssessment) {
      // Chuyển đến trang sàng lọc
      navigate('/sti-assessment');
    } else {
      // Chuyển đến trang đặt lịch (consultation mode)
      navigate('/sti-booking/book');
    }
  };

  const renderPackageCard = (pkg: StiPackage) => (
    <Col xs={24} sm={12} md={8} key={pkg._id}>
      <Card
        style={{ 
          height: '100%',
          borderRadius: '8px',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <AppstoreOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
          <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            {pkg.sti_package_name}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            {pkg.sti_package_code}
          </Text>
          <Text style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>
            {pkg.description}
          </Text>
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
              {pkg.price.toLocaleString('vi-VN')} VNĐ
            </Text>
          </div>
          {pkg.tests && pkg.tests.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                Bao gồm {pkg.tests.length} xét nghiệm:
              </Text>
              <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                <Space wrap size={[4, 4]}>
                  {pkg.tests.map(test => (
                    <Tag key={test._id} style={{ fontSize: '11px', margin: '2px' }}>
                      {test.sti_test_name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <Tag color={pkg.is_active ? 'success' : 'error'}>
              {pkg.is_active ? 'Hoạt động' : 'Không hoạt động'}
            </Tag>
          </div>
        </div>
      </Card>
    </Col>
  );

  const renderTestCard = (test: StiTest) => (
    <Col xs={24} sm={12} md={8} key={test._id}>
      <Card
        style={{ 
          height: '100%',
          borderRadius: '8px',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <ExperimentOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
          <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            {test.sti_test_name}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            {test.sti_test_code}
          </Text>
          <Text style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>
            {test.description}
          </Text>
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
              {test.price.toLocaleString('vi-VN')} VNĐ
            </Text>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Space>
              <Tag color="blue">{test.sti_test_type}</Tag>
              <Tag color="green">{test.category}</Tag>
            </Space>
          </div>
          <div>
            <Tag color={test.is_active ? 'success' : 'error'}>
              {test.is_active ? 'Hoạt động' : 'Không hoạt động'}
            </Tag>
          </div>
        </div>
      </Card>
    </Col>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'packages',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 500, padding: '8px 0' }}>
          <AppstoreOutlined style={{ fontSize: '18px' }} />
          Gói xét nghiệm
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Title level={3}>Các gói xét nghiệm STI</Title>
            <Text type="secondary">
              Tham khảo các gói xét nghiệm tổng hợp với giá ưu đãi
            </Text>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : packages.length === 0 ? (
            <Empty description="Không có gói xét nghiệm nào" />
          ) : (
            <Row gutter={[16, 16]}>
              {packages.map(renderPackageCard)}
            </Row>
          )}
        </div>
      )
    },
    {
      key: 'single_tests',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 500, padding: '8px 0' }}>
          <ExperimentOutlined style={{ fontSize: '18px' }} />
          Xét nghiệm đơn lẻ
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Title level={3}>Các xét nghiệm đơn lẻ</Title>
            <Text type="secondary">
              Tham khảo các xét nghiệm riêng lẻ theo nhu cầu cụ thể
            </Text>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : tests.length === 0 ? (
            <Empty description="Không có xét nghiệm nào" />
          ) : (
            <Row gutter={[16, 16]}>
              {tests.map(renderTestCard)}
            </Row>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1}>Dịch vụ Xét nghiệm STI</Title>
        <Text style={{ fontSize: '16px', color: '#666' }}>
          Tham khảo thông tin các gói xét nghiệm và xét nghiệm đơn lẻ để lựa chọn dịch vụ phù hợp.
        </Text>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '32px' }}>
        <Tabs defaultActiveKey="packages" items={tabItems} centered />
      </div>

      {/* Navigation */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={() => setShowAssessmentModal(true)}
          style={{ height: '48px', padding: '0 32px', fontSize: '16px' }}
        >
          Đặt lịch xét nghiệm ngay
          <ArrowRightOutlined />
        </Button>
      </div>

      {/* Assessment Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <QuestionCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
            Bài test sàng lọc STI
          </div>
        }
        open={showAssessmentModal}
        onCancel={() => setShowAssessmentModal(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ color: '#1890ff', marginBottom: '8px' }}>
              Bạn có muốn làm bài test sàng lọc STI không?
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Bài test sàng lọc sẽ giúp bác sĩ tư vấn gói xét nghiệm phù hợp nhất cho bạn (3-5 phút)
            </Text>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '13px', color: '#52c41a' }}>
                ✓ Đánh giá dựa trên hướng dẫn CDC 2021<br/>
                ✓ Tư vấn gói xét nghiệm phù hợp<br/>
                ✓ Thông tin được bảo mật tuyệt đối
              </Text>
            </div>
          </div>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => handleAssessmentChoice(true)}
              style={{ width: '100%', height: '48px' }}
            >
              Có, tôi muốn làm bài test sàng lọc
            </Button>
            <Button 
              size="large" 
              onClick={() => handleAssessmentChoice(false)}
              style={{ width: '100%', height: '48px' }}
            >
              Không, tư vấn trực tiếp với bác sĩ
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default STITestPage;