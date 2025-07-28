import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, message, Typography } from 'antd';
import { ExportOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import components from Staff folder since they support role-based access
import OrdersManagement from '../Staff/components/OrdersManagement';
import ScheduleManagement from '../Staff/components/ScheduleManagement';
import ResultsManagement from '../Staff/components/ResultsManagement';
import TestsManagement from '../Staff/components/TestsManagement';
import PackagesManagement from '../Staff/components/PackagesManagement';

const { Title } = Typography;

const STIManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check authorization
  useEffect(() => {
    if (!user || !['admin', 'staff', 'manager'].includes(user.role)) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    message.success('Đã làm mới dữ liệu');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    message.info('Chức năng xuất dữ liệu đang được phát triển');
  };

  const tabItems = [
    {
      key: 'orders',
      label: '📋 Quản lý đơn hàng',
      children: <OrdersManagement refreshTrigger={refreshTrigger} />,
    },
    {
      key: 'schedule',
      label: '📅 Lịch lấy mẫu',
      children: <ScheduleManagement refreshTrigger={refreshTrigger} />,
    },
    {
      key: 'results',
      label: '🧪 Kết quả xét nghiệm',
      children: <ResultsManagement refreshTrigger={refreshTrigger} />,
    },
    {
      key: 'tests',
      label: '🔬 Quản lý xét nghiệm',
      children: <TestsManagement refreshTrigger={refreshTrigger} />,
    },
    {
      key: 'packages',
      label: '📦 Quản lý gói xét nghiệm',
      children: <PackagesManagement refreshTrigger={refreshTrigger} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <Title level={2} style={{ margin: 0 }}>
              🏥 Quản lý STI - Admin
            </Title>
            <Space>
              <Button 
                icon={<SyncOutlined />} 
                onClick={handleRefresh}
              >
                Làm mới
              </Button>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                Xuất dữ liệu
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ minHeight: '600px' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default STIManagement; 