import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StiTest } from '../../types/sti';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
      const response = await api.get('/sti/getAllStiTest');
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
      const response = await api.get('/sti/getAllStiPackage');
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
      const response = await api.put(`/sti/deleteStiTest/${id}`);
      if (response.data.success) {
        fetchTests();
      }
    } catch (error) {}
  };

  const handleBookSTITest = (test: StiTest) => {
    if (user?.role === 'customer') {
      navigate(`/sti-booking/book?testId=${test._id}`);
    } else {
      navigate('/login');
    }
  };

  const handleBookSTIPackage = (pkg: any) => {
    if (user?.role === 'customer') {
      navigate(`/sti-booking/book?packageId=${pkg._id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {mode === 'package' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2}>Danh sách gói xét nghiệm STI</Title>
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
                    actions={user?.role === 'customer' ? [
                      <Button 
                        type="primary" 
                        onClick={() => handleBookSTIPackage(pkg)}
                        disabled={!pkg.is_active}
                      >
                        Đặt lịch xét nghiệm
                      </Button>
                    ] : undefined}
                  >
                    <div>Mã: {pkg.sti_package_code}</div>
                    <div>Giá: {pkg.price?.toLocaleString('vi-VN')} VND</div>
                    <div>{pkg.description}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
        {mode === 'single' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={2}>Danh sách xét nghiệm STI lẻ</Title>
              <div style={{ display: 'flex', gap: '8px' }}>
                {user?.role === 'customer' && (
                  <Button 
                    type="dashed"
                    onClick={() => navigate('/sti-booking/multiple')}
                  >
                    Chọn nhiều xét nghiệm
                  </Button>
                )}
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
                .filter(test => test.isActive)
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
                        <Tag color={test.isActive ? 'success' : 'error'}>
                          {test.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Tag>
                      }
                      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
                      styles={{ body: { flex: 1 } }}
                      actions={user?.role === 'customer' ? [
                        <Button 
                          type="primary" 
                          onClick={() => handleBookSTITest(test)}
                          disabled={!test.isActive}
                        >
                          Đặt lịch xét nghiệm
                        </Button>
                      ] : undefined}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">Mã: {test.sti_test_code}</Text>
                        <Text style={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {test.description}
                        </Text>
                        <Text strong>Giá: {formatPrice(test.price)}</Text>
                        <Space wrap>
                          <Tag color={getCategoryColor(test.category)}>
                            {test.category}
                          </Tag>
                          <Tag>{test.sti_test_type}</Tag>
                        </Space>
                        {(user?.role === 'staff' || user?.role === 'admin') && (
                          <Space>
                            <Button 
                              type="link"
                              size="small"
                              onClick={() => navigate(`/test-packages/edit/${test._id}`)}
                            >
                              Sửa
                            </Button>
                            <Button 
                              type="link"
                              size="small"
                              danger
                              onClick={() => handleDelete(test._id)}
                            >
                              Xóa
                            </Button>
                          </Space>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
            </Row>
          </>
        )}
      </Space>
    </div>
  );
};

export default StiTestList;