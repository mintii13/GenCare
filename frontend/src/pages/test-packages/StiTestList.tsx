import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StiTest } from '../../types/sti';
import { useAuth } from '../../contexts/AuthContext';

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
                  <Card hoverable title={pkg.sti_package_name} onClick={onSelectPackage ? () => onSelectPackage(pkg) : undefined}>
                    <div>Mã: {pkg.sti_package_code}</div>
                    <div>Giá: {pkg.price?.toLocaleString('vi-VN')} VND</div>
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
              <Title level={2}>Danh sách xét nghiệm STI lẻ</Title>
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
                      bodyStyle={{ flex: 1 }}
                      onClick={onSelectTest ? () => onSelectTest(test) : undefined}
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