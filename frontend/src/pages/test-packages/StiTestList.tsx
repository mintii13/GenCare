import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StiTest, StiTestResponse } from '../../types/sti';

const { Title, Text } = Typography;

const StiTestList: React.FC = () => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await api.get<StiTestResponse>('/sti/getAllStiTest');
      if (response.data.success && Array.isArray(response.data.data)) {
        setTests(response.data.data as StiTest[]);
      } else {
        setTests([]);
      }
    } catch (error) {
      setTests([]);
      console.error('Error fetching STI tests:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      viral: 'red',
      bacterial: 'blue',
      parasitic: 'green'
    };
    return colors[category] || 'default';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Danh sách xét nghiệm STI</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/test-packages/create')}
          >
            Thêm xét nghiệm mới
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {Array.isArray(tests) && tests.map((test) => (
            <Col xs={24} sm={12} md={8} lg={6} key={test.sti_test_id}>
              <Card
                hoverable
                title={test.sti_test_name}
                extra={
                  <Tag color={test.isActive ? 'success' : 'error'}>
                    {test.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Tag>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">Mã: {test.sti_test_code}</Text>
                  <Text>{test.description}</Text>
                  <Text strong>Giá: {formatPrice(test.price)}</Text>
                  <Text>Thời gian: {test.duration}</Text>
                  <Space>
                    <Tag color={getCategoryColor(test.category)}>
                      {test.category}
                    </Tag>
                    <Tag>{test.sti_test_type}</Tag>
                  </Space>
                  <Button 
                    type="link" 
                    onClick={() => navigate(`/test-packages/${test.sti_test_id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    </div>
  );
};

export default StiTestList; 