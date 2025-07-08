import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Typography, Space, Button, Tabs, Collapse, Divider } from 'antd';
import { AppstoreOutlined, ExperimentOutlined } from '@ant-design/icons';
import apiClient from '../../services/apiClient';
import { message } from 'antd';
import { StiTest, StiPackage } from '../../types/sti';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const STITestPage = () => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const [packages, setPackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<StiTest | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<StiPackage | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tests
        const testsResponse = await apiClient.get<any>('/sti/getAllStiTest');
        if (testsResponse.data.success && Array.isArray(testsResponse.data.stitest)) {
          setTests(testsResponse.data.stitest);
        } else {
          setTests([]);
        }

        // Fetch packages
        const packagesResponse = await apiClient.get<any>('/sti/getAllStiPackage');
        if (packagesResponse.data.success && Array.isArray(packagesResponse.data.stipackage)) {
          setPackages(packagesResponse.data.stipackage);
        } else {
          setPackages([]);
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

  const handleSelectTest = (test: any) => {
    setSelectedTest(test);
    setSelectedPackage(null);
  };

  const handleBooking = async () => {
    if (!selectedTest && !selectedPackage) {
      message.error('Vui lòng chọn một xét nghiệm hoặc một gói');
      return;
    }

    const bookingData = selectedTest 
      ? { testId: selectedTest._id }
      : selectedPackage 
        ? { packageId: selectedPackage._id }
        : null;

    if (!bookingData) {
      message.error('Dữ liệu đặt lịch không hợp lệ');
      return;
    }

    try {
      await apiClient.post('/sti/book', bookingData);
      message.success('Đặt lịch thành công');
    } catch (error) {
      message.error('Đặt lịch thất bại');
    }
  };

  const renderTestCard = (test: StiTest) => (
    <Col 
      xs={24} 
      sm={24} 
      md={12} 
      lg={8} 
      xl={6}
      key={test._id}
      style={{ display: 'flex' }}
    >
      <Card
        hoverable
        onClick={() => handleSelectTest(test)}
        title={
          <div style={{ 
            whiteSpace: 'normal', 
            wordBreak: 'break-word',
            lineHeight: '1.4',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ExperimentOutlined style={{ marginRight: 8 }} />
            {test.sti_test_name}
          </div>
        }
        extra={
          <Tag color={test.is_active ? 'success' : 'error'}>
            {test.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
          </Tag>
        }
        style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          border: selectedTest?._id === test._id ? '2px solid #1890ff' : undefined
        }}
        bodyStyle={{ flex: 1 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">Mã: {test.sti_test_code}</Text>
          <Text style={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {test.description}
          </Text>
          <Text strong style={{ color: '#1890ff' }}>
            Giá: {test.price.toLocaleString('vi-VN')} VND
          </Text>
          <Tag color="blue">{test.sti_test_type}</Tag>
          <Tag color="green">{test.category}</Tag>
        </Space>
      </Card>
    </Col>
  );

  const renderPackageCard = (pkg: StiPackage) => (
    <Col 
      xs={24} 
      sm={24} 
      md={12} 
      lg={8}
      key={pkg._id}
      style={{ display: 'flex' }}
    >
      <Card
        hoverable
        onClick={() => {
          setSelectedPackage(pkg);
          setSelectedTest(null);
        }}
        title={
          <div style={{ 
            whiteSpace: 'normal', 
            wordBreak: 'break-word',
            lineHeight: '1.4',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            {pkg.sti_package_name}
          </div>
        }
        extra={
          <Tag color={pkg.is_active ? 'success' : 'error'}>
            {pkg.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
          </Tag>
        }
        style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          border: selectedPackage?._id === pkg._id ? '2px solid #1890ff' : undefined
        }}
        bodyStyle={{ flex: 1 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">Mã: {pkg.sti_package_code}</Text>
          <Text style={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {pkg.description}
          </Text>
          <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
            Giá gói: {pkg.price.toLocaleString('vi-VN')} VND
          </Text>
          {pkg.tests && pkg.tests.length > 0 && (
            <div>
              <Text strong>Bao gồm {pkg.tests.length} xét nghiệm:</Text>
              <div style={{ marginTop: 8 }}>
                {pkg.tests.map(test => (
                  <Tag key={test._id} style={{ margin: 2 }}>
                    {test.sti_test_name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Space>
      </Card>
    </Col>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dịch vụ xét nghiệm STI</Title>
      
      <Tabs defaultActiveKey="packages" size="large">
        <TabPane 
          tab={
            <span>
              <AppstoreOutlined />
              Gói xét nghiệm ({packages.length})
            </span>
          } 
          key="packages"
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Các gói xét nghiệm tổng hợp với giá ưu đãi, phù hợp cho kiểm tra sức khỏe định kỳ
            </Text>
          </div>
          <Row gutter={[16, 16]}>
            {packages.map(renderPackageCard)}
            {packages.length === 0 && !loading && (
              <Col span={24}>
                <Text type="secondary">Không có gói xét nghiệm nào</Text>
              </Col>
            )}
          </Row>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <ExperimentOutlined />
              Xét nghiệm đơn lẻ ({tests.length})
            </span>
          } 
          key="tests"
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Các xét nghiệm riêng lẻ, phù hợp cho nhu cầu kiểm tra cụ thể
            </Text>
          </div>
          <Row gutter={[16, 16]}>
            {tests.map(renderTestCard)}
            {tests.length === 0 && !loading && (
              <Col span={24}>
                <Text type="secondary">Không có xét nghiệm nào</Text>
              </Col>
            )}
          </Row>
        </TabPane>
      </Tabs>

      {(selectedTest || selectedPackage) && (
        <>
          <Divider />
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Space direction="vertical" size="middle">
              <Text strong>
                Đã chọn: {selectedTest ? selectedTest.sti_test_name : selectedPackage?.sti_package_name}
              </Text>
              <Button 
                type="primary" 
                size="large"
                onClick={handleBooking}
                loading={loading}
              >
                Đặt lịch xét nghiệm
              </Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default STITestPage;