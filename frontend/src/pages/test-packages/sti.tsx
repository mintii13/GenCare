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
              title={
                <div style={{ 
                  whiteSpace: 'normal', 
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {test.sti_test_name}
                </div>
              }
              extra={
                <Tag color={test.isActive ? 'success' : 'error'}>
                  {test.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </Tag>
              }
              style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">Mã: {test.sti_test_code}</Text>
                <Text style={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {test.description}
                </Text>
                <Text strong>Giá: {test.price.toLocaleString('vi-VN')} VND</Text>
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