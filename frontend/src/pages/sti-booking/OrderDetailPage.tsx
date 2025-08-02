import React from 'react';
import { Button, Typography, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = React.useState(false);

  return (
    <div style={{ padding: 32 }}>
      <Title>Chi tiết lịch xét nghiệm STI</Title>
      <div>Thông tin chi tiết (dummy)...</div>
      <div style={{ marginTop: 24 }}>
        <Button danger onClick={() => setShowCancel(true)} style={{ marginRight: 8 }}>Hủy lịch</Button>
        <Button onClick={() => navigate(`/sti-booking/new/license`)}>Sửa lịch</Button>
      </div>
      <Modal open={showCancel} onOk={() => { setShowCancel(false); navigate('/sti-booking/orders'); }} onCancel={() => setShowCancel(false)} okText="Có" cancelText="Không">
        Bạn có chắc chắn muốn hủy lịch này không?
      </Modal>
    </div>
  );
};
export default OrderDetailPage; 