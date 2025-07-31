import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Typography, Button, Tabs, Space, Spin, Empty } from 'antd';
import type { TabsProps } from 'antd';
import { AppstoreOutlined, ExperimentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { message } from 'antd';
import { StiTest, StiPackage } from '../../../types/sti';

const { Title, Text } = Typography;

interface ApiResponse<T> {
  success: boolean;
  stipackage?: T[];
  stitest?: T[];
}

const STITestPackages: React.FC = () => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const [packages, setPackages] = useState<StiPackage[]>([]);
  const [loading, setLoading] = useState(false);
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
    <div key={test._id} style={{ width: '280px', height: '280px', flexShrink: 0 }}>
      <Card
        style={{ 
          height: '115%',
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
    </div>
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
         
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : tests.length === 0 ? (
            <Empty description="Không có xét nghiệm nào" />
          ) : (
            <div style={{ 
              overflowX: 'auto', 
              paddingBottom: '16px',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
            }}
            className="scrollbar-hide">
              <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content', height: '300px'}}>
                {tests.map(renderTestCard)}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <section className="py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
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
            onClick={() => navigate('/sti-booking/book')}
            style={{ height: '48px', padding: '0 32px', fontSize: '16px' }}
          >
            Đặt lịch xét nghiệm ngay
            <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default STITestPackages; 