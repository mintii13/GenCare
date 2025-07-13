import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { StiTest } from '../../types/sti';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';

const { Title, Text } = Typography;

interface StiTestListProps {
  onSelectTest?: (test: StiTest) => void;
  onSelectPackage?: (pkg: any) => void;
  mode?: 'package' | 'single'; // 'package' = gói, 'single' = lẻ
}

const StiTestList: React.FC<StiTestListProps> = ({ onSelectTest, onSelectPackage, mode = 'package' }) => {
  const [tests, setTests] = useState<StiTest[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = useAuth()?.user;
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchTests();
    fetchPackages();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'customer') {
      toast('Chức năng đặt lịch xét nghiệm chỉ dành cho khách hàng', { icon: 'ℹ️', id: 'role-warning' });
    }
  }, [user]);

  const fetchTests = async () => {
    try {
      const response = await apiClient.get<any>('/sti/getAllStiTest');
      if (response.data.success && Array.isArray(response.data.stitest)) {
        const mapped = response.data.stitest.map((item: any) => ({
          ...item,
          isActive: item.is_active
        }));
        setTests(mapped);
      } else {
        setTests([]);
      }
    } catch (error) {
      setTests([]);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await apiClient.get<any>('/sti/getAllStiPackage');
      if (response.data.success && Array.isArray(response.data.stipackage)) {
        setPackages(response.data.stipackage.filter((item: any) => item.is_active));
      } else {
        setPackages([]);
      }
    } catch (error) {
      setPackages([]);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      viral: 'red',
      bacterial: 'blue',
      parasitic: 'green'
    };
    return colors[category] || 'default';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.put<any>(`/sti/deleteStiTest/${id}`);
      if (response.data.success) {
        fetchTests();
      }
    } catch (error) {}
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {mode === 'package' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2}>Thông tin tham khảo - Gói xét nghiệm STI</Title>
            </div>
            <Row gutter={[16, 16]}>
              {Array.isArray(packages) && packages.map((pkg) => (
                <Col xs={24} sm={24} md={12} lg={8} xl={6} key={pkg._id} style={{ display: 'flex' }}>
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
                        {pkg.sti_package_name}
                      </div>
                    }
                    extra={
                      <Tag color={pkg.is_active ? 'success' : 'error'}>
                        {pkg.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Tag>
                    }
                    style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1 } }}
                  >
                    <div>Mã: {pkg.sti_package_code}</div>
                    <div>Giá tham khảo: {pkg.price?.toLocaleString('vi-VN')} VND</div>
                    <div>{pkg.description}</div>
                    <Tag color={pkg.is_active ? 'success' : 'error'}>
                      {pkg.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
        {mode === 'single' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2}>Thông tin tham khảo - Xét nghiệm STI lẻ</Title>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/test-packages/create')}
                  >
                    Thêm xét nghiệm mới
                  </Button>
                )}
              </div>
            </div>
            <Row gutter={[16, 16]}>
              {Array.isArray(tests) && tests
                .filter(test => test.is_active)
                .map((test) => (
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
                        <Tag color={test.is_active ? 'success' : 'error'}>
                          {test.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Tag>
                      }
                      style={{ 
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      styles={{ body: { flex: 1 } }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Mã: </Text>
                          <Text>{test.sti_test_code}</Text>
                        </div>
                        <div>
                          <Text strong>Giá tham khảo: </Text>
                          <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                            {formatPrice(test.price)}
                          </Text>
                        </div>
                        <div>
                          <Text strong>Mô tả: </Text>
                          <Text>{test.description}</Text>
                        </div>
                        <div>
                          <Tag color={getCategoryColor(test.category)}>
                            {test.category}
                          </Tag>
                          <Tag>{test.sti_test_type}</Tag>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
            </Row>
          </>
        )}
      </Space>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default StiTestList;