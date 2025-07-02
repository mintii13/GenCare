import React from 'react';
import { Card, Button, Pagination, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Dummy data
const orders = [
  { id: '1', name: 'Đặt lịch gói A', status: 'pending' },
  { id: '2', name: 'Đặt lịch test lẻ', status: 'confirmed' },
];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 32 }}>
      <Title>Lịch xét nghiệm STI đã đặt</Title>
      {orders.map(order => (
        <Card key={order.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b>{order.name}</b> <span>({order.status})</span>
            </div>
            <Button onClick={() => navigate(`/sti-booking/orders/${order.id}`)}>Xem chi tiết</Button>
          </div>
        </Card>
      ))}
      <Pagination total={2} pageSize={10} style={{ marginTop: 24 }} />
    </div>
  );
};
export default OrdersPage; 