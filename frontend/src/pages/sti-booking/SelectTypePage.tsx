import React from 'react';
import { Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const SelectTypePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <Title>Bạn muốn đặt lịch theo hình thức nào?</Title>
      <Space direction="vertical" size="large">
        <Button type="primary" size="large" onClick={() => navigate('/sti-booking/new/packages')}>Theo gói xét nghiệm</Button>
        <Button type="default" size="large" onClick={() => navigate('/sti-booking/new/tests')}>Theo test lẻ</Button>
      </Space>
    </div>
  );
};
export default SelectTypePage; 