import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StiTest } from '../../types/sti';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const StiTestList: React.FC = () => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const navigate = useNavigate();
  const user = useAuth()?.user;

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await api.get('/sti/getAllStiTest');
      console.log('API response:', response.data);
      if (response.data.success && Array.isArray(response.data.stitest)) {
        const mapped = response.data.stitest.map((item: any) => ({
          ...item,
          isActive: item.is_active
        }));
        setTests(mapped);
        console.log('Set tests:', mapped);
      } else {
        setTests([]);
        console.log('Set tests: []');
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

  const handleDelete = async (id: string) => {
    try {
      const response = await api.put(`/sti/deleteStiTest/${id}`);
      console.log('API response:', response.data);
      if (response.data.success) {
        fetchTests();
      }
    } catch (error) {
      console.error('Error deleting STI test:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Danh sách xét nghiệm STI</Title>
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/test-packages/create')}
            >
              Thêm xét nghiệm mới
            </Button>
          )}
        </div>

        <Row gutter={[16, 16]}>
          {Array.isArray(tests) && tests
            .filter(test => test.isActive)
            .map((test) => (
              <Col xs={24} sm={12} md={8} lg={6} key={test._id}>
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
                    <Space>
                      <Tag color={getCategoryColor(test.category)}>
                        {test.category}
                      </Tag>
                      <Tag>{test.sti_test_type}</Tag>
                    </Space>
                    {(user?.role === 'staff' || user?.role === 'admin') && (
                      <>
                        <Button 
                          type="link"
                          onClick={() => navigate(`/test-packages/edit/${test._id}`)}
                        >
                          Sửa
                        </Button>
                        <Button 
                          type="link"
                          danger
                          onClick={() => handleDelete(test._id)}
                        >
                          Xóa
                        </Button>
                      </>
                    )}
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