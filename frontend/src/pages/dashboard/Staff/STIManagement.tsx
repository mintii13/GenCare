import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, message, Typography } from 'antd';
import { ExportOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import components for each tab
import OrdersManagement from './components/OrdersManagement';
import ScheduleManagement from './components/ScheduleManagement';
import ResultsManagement from './components/ResultsManagement';
import TestsManagement from './components/TestsManagement';
import PackagesManagement from './components/PackagesManagement';

const { Title } = Typography;
const { TabPane } = Tabs;

const STIManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check authorization
  useEffect(() => {
    if (!user || !['admin', 'staff'].includes(user.role)) {
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
    // {
    //   key: 'schedule',
    //   label: '📅 Lịch lấy mẫu',
    //   children: <ScheduleManagement refreshTrigger={refreshTrigger} />,
    // },
    // {
    //   key: 'results',
    //   label: '🧪 Kết quả xét nghiệm',
    //   children: <ResultsManagement refreshTrigger={refreshTrigger} />,
    // },
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
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <Title level={2} style={{ margin: 0 }}>
            🏥 Quản lý STI
          </Title>
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            {user?.role === 'admin' && (
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                Xuất dữ liệu
              </Button>
            )}
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
  );
};

export default STIManagement; 