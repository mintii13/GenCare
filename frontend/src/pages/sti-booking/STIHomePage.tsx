import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Typography } from 'antd';

const { Title } = Typography;

const STIHomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <Title>Đặt lịch xét nghiệm STI</Title>
      <Space direction="vertical" size="large">
        <Button type="primary" size="large" onClick={() => navigate('/sti-booking/orders')}>Xem lịch đã đặt</Button>
        <Button type="default" size="large" onClick={() => navigate('/sti-booking/new/license')}>Đặt lịch mới</Button>
      </Space>
    </div>
  );
};
export default STIHomePage; 