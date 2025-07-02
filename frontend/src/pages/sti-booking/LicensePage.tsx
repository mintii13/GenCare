import React from 'react';
import { Button, Typography, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const LicensePage: React.FC = () => {
  const [checked, setChecked] = React.useState(false);
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <Title>Điều khoản sử dụng dịch vụ xét nghiệm STI</Title>
      <Paragraph>Vui lòng đọc kỹ các điều khoản trước khi tiếp tục đặt lịch xét nghiệm STI...</Paragraph>
      <Checkbox checked={checked} onChange={e => setChecked(e.target.checked)}>
        Tôi đã đọc và đồng ý với các điều khoản
      </Checkbox>
      <div style={{ marginTop: 24 }}>
        <Button type="primary" disabled={!checked} onClick={() => navigate('/sti-booking/new/select')}>Tiếp tục</Button>
      </div>
    </div>
  );
};
export default LicensePage; 