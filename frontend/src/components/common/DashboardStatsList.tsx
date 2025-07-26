import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Alert, Button } from 'antd';
import { 
  ReloadOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DashboardStatsService from '../../services/dashboardStatsService';

// Types for different statistics
interface StatItem {
  id: string;
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
  error?: string;
}

interface DashboardStatsListProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

// Define statistics configuration for each role
const STATS_CONFIG = {
  admin: [
    { 
      id: 'total_users', 
      title: 'Tổng người dùng', 
      prefix: <UserOutlined />,
      endpoint: '/users/statistics/overview',
      dataPath: 'total_users'
    },
    { 
      id: 'today_appointments', 
      title: 'Lịch hẹn hôm nay', 
      prefix: <CalendarOutlined />,
      endpoint: '/appointments/statistics',
      dataPath: 'today_appointments'
    },
    { 
      id: 'total_revenue', 
      title: 'Tổng doanh thu', 
      prefix: <DollarOutlined />,
      suffix: ' VND',
      endpoint: '/sti/getTotalRevenue',
      dataPath: 'total_revenue'
    },
    { 
      id: 'active_users', 
      title: 'Người dùng hoạt động', 
      prefix: <CheckCircleOutlined />,
      endpoint: '/users/statistics/overview',
      dataPath: 'active_users'
    },
    { 
      id: 'pending_orders', 
      title: 'Đơn hàng chờ xử lý', 
      prefix: <ClockCircleOutlined />,
      endpoint: '/sti/orders',
      dataPath: 'total_items',
      filter: { status: 'pending' }
    },
    { 
      id: 'total_blogs', 
      title: 'Tổng bài viết', 
      prefix: <FileTextOutlined />,
      endpoint: '/blogs',
      dataPath: 'total_items'
    }
  ],
  staff: [
    { 
      id: 'total_orders', 
      title: 'Tổng đơn hàng STI', 
      prefix: <MedicineBoxOutlined />,
      endpoint: '/sti/orders',
      dataPath: 'total_items'
    },
    { 
      id: 'completed_orders', 
      title: 'Đơn hàng hoàn thành', 
      prefix: <CheckCircleOutlined />,
      endpoint: '/sti/orders',
      dataPath: 'total_items',
      filter: { status: 'completed' }
    },
    { 
      id: 'pending_orders', 
      title: 'Đơn hàng đang xử lý', 
      prefix: <ClockCircleOutlined />,
      endpoint: '/sti/orders',
      dataPath: 'total_items',
      filter: { status: 'pending' }
    },
    { 
      id: 'critical_results', 
      title: 'Kết quả nghiêm trọng', 
      prefix: <ExclamationCircleOutlined />,
      endpoint: '/sti/orders',
      dataPath: 'critical_results'
    },
    { 
      id: 'today_appointments', 
      title: 'Lịch hẹn hôm nay', 
      prefix: <CalendarOutlined />,
      endpoint: '/appointments/statistics',
      dataPath: 'today_appointments'
    },
    { 
      id: 'total_users', 
      title: 'Tổng người dùng', 
      prefix: <UserOutlined />,
      endpoint: '/users/statistics/overview',
      dataPath: 'total_users'
    }
  ],
  consultant: [
    { 
      id: 'total_appointments', 
      title: 'Tổng lịch hẹn', 
      prefix: <CalendarOutlined />,
      endpoint: '/consultants/my-performance',
      dataPath: 'appointment_stats.total_appointments'
    },
    { 
      id: 'pending_appointments', 
      title: 'Chờ xác nhận', 
      prefix: <ClockCircleOutlined />,
      endpoint: '/appointments',
      dataPath: 'total_items',
      filter: { status: 'pending' }
    },
    { 
      id: 'confirmed_appointments', 
      title: 'Đã xác nhận', 
      prefix: <CheckCircleOutlined />,
      endpoint: '/appointments',
      dataPath: 'total_items',
      filter: { status: 'confirmed' }
    },
    { 
      id: 'today_appointments', 
      title: 'Hôm nay', 
      prefix: <CalendarOutlined />,
      endpoint: '/appointments',
      dataPath: 'total_items',
      filter: { 
        appointment_date: new Date().toISOString().split('T')[0]
      }
    },
    { 
      id: 'average_rating', 
      title: 'Đánh giá trung bình', 
      prefix: <StarOutlined />,
      suffix: '/5',
      endpoint: '/consultants/my-performance',
      dataPath: 'feedback_stats.average_rating'
    },
    { 
      id: 'total_feedbacks', 
      title: 'Tổng phản hồi', 
      prefix: <BarChartOutlined />,
      endpoint: '/consultants/my-performance',
      dataPath: 'feedback_stats.total_feedbacks'
    }
  ]
};

const DashboardStatsList: React.FC<DashboardStatsListProps> = ({ 
  refreshTrigger, 
  onRefresh 
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get value from nested object path
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Fetch statistics data using the dedicated service
  const fetchStats = async () => {
    if (!user?.role) return;

    const config = STATS_CONFIG[user.role as keyof typeof STATS_CONFIG];
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      // Use the dedicated service to get all statistics
      const allStatsData = await DashboardStatsService.getDashboardStatistics(
        user.role, 
        user.userId
      );

      console.log('Dashboard stats data:', allStatsData);

      // Map configuration to actual data
      const statsResults = config.map((statConfig) => {
        let value: any = 0;
        
        try {
          // Extract value based on data path and service data
          switch (user.role) {
            case 'admin':
              if (statConfig.dataPath.includes('total_users') || statConfig.dataPath.includes('active_users')) {
                value = getNestedValue(allStatsData.users, statConfig.dataPath);
              } else if (statConfig.dataPath.includes('appointments')) {
                value = getNestedValue(allStatsData.appointments, statConfig.dataPath);
              } else if (statConfig.dataPath.includes('revenue')) {
                value = getNestedValue(allStatsData.revenue, statConfig.dataPath);
              }
              break;
            
            case 'staff':
              if (statConfig.dataPath.includes('total_users') || statConfig.dataPath.includes('active_users')) {
                value = getNestedValue(allStatsData.users, statConfig.dataPath);
              } else if (statConfig.dataPath.includes('appointments')) {
                value = getNestedValue(allStatsData.appointments, statConfig.dataPath);
              } else if (statConfig.dataPath.includes('total_orders')) {
                value = getNestedValue(allStatsData.sti, statConfig.dataPath);
              }
              break;
            
            case 'consultant':
              if (statConfig.dataPath.includes('appointment_stats')) {
                value = getNestedValue(allStatsData.performance, statConfig.dataPath);
              } else if (statConfig.dataPath.includes('feedback_stats')) {
                value = getNestedValue(allStatsData.performance, statConfig.dataPath);
              } else if (statConfig.dataPath === 'total_items') {
                // For appointment counts
                value = getNestedValue(allStatsData.todayAppointments, statConfig.dataPath);
              }
              break;
          }

          // Format value
          if (typeof value === 'number' && statConfig.id.includes('revenue')) {
            value = new Intl.NumberFormat('vi-VN').format(value);
          } else if (typeof value === 'number' && statConfig.id.includes('rating')) {
            value = value.toFixed(1);
          }

          return {
            id: statConfig.id,
            title: statConfig.title,
            value: value || 0,
            prefix: statConfig.prefix,
            suffix: statConfig.suffix,
            loading: false,
            error: undefined
          };
        } catch (error) {
          console.error(`Error processing ${statConfig.id}:`, error);
          return {
            id: statConfig.id,
            title: statConfig.title,
            value: '--',
            prefix: statConfig.prefix,
            suffix: statConfig.suffix,
            loading: false,
            error: 'Lỗi xử lý dữ liệu'
          };
        }
      });

      setStats(statsResults);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Không thể tải thống kê dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.role, refreshTrigger]);

  const handleRefresh = () => {
    fetchStats();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!user?.role || !STATS_CONFIG[user.role as keyof typeof STATS_CONFIG]) {
    return null;
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải thống kê"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={handleRefresh}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="dashboard-stats-list">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Thống kê tổng quan
        </h3>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
          size="small"
        >
          Làm mới
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {stats.map((stat) => (
              <Col xs={24} sm={12} lg={8} key={stat.id}>
                <Card 
                  size="small" 
                  className="h-full"
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    loading={stat.loading}
                    valueStyle={{ 
                      fontSize: '20px',
                      color: stat.error ? '#ff4d4f' : undefined
                    }}
                  />
                  {stat.error && (
                    <div className="text-xs text-red-500 mt-1">
                      {stat.error}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!loading && stats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu thống kê
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStatsList; 