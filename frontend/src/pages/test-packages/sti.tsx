import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Typography, Space } from 'antd';
import api from '../../services/api';

const { Title, Text } = Typography;

const STITestPage = () => {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get('/sti/getAllStiTest');
        if (response.data.success && Array.isArray(response.data.stitest)) {
          setTests(response.data.stitest);
        } else {
          setTests([]);
        }
      } catch (error) {
        setTests([]);
      }
    };
    fetchTests();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Danh sách xét nghiệm STI</Title>
      <Row gutter={[16, 16]}>
        {tests.map((test: any) => (
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
                <Text strong>Giá: {test.price.toLocaleString('vi-VN')} VND</Text>
                <Text>Thời gian: {test.duration}</Text>
                <Tag>{test.sti_test_type}</Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default STITestPage; 