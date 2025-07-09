import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from '../../services/apiClient';
import { StiTest, StiTestResponse } from '../../types/sti';
import { useAuth } from '../../contexts/AuthContext';

const StiTestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<StiTest | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuth()?.user;

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<StiTestResponse>(`/sti/getStiTest/${id}`);
      if (response.data.success) {
        setTest(response.data.stitest as StiTest);
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      message.error('Không thể tải thông tin xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa xét nghiệm này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await apiClient.put<any>(`/sti/deleteStiTest/${id}`);
          if (response.data.success) {
            message.success('Xóa xét nghiệm thành công');
            navigate('/test-packages');
          }
        } catch (error) {
          console.error('Error deleting test:', error);
          message.error('Có lỗi xảy ra khi xóa xét nghiệm');
        }
      },
    });
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

  const handleBookNow = () => {
    if (test) {
      navigate(`/sti-booking/book?testId=${test._id}`);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!test) {
    return <div>Không tìm thấy thông tin xét nghiệm</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card
          title={test.sti_test_name}
        extra={
          (user?.role === 'consultant' || user?.role === 'staff') && (
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/test-packages/edit/${id}`)}
              >
                Chỉnh sửa
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Xóa
              </Button>
            </Space>
          )
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Mã xét nghiệm">
            {test.sti_test_code}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            {test.description}
          </Descriptions.Item>
          <Descriptions.Item label="Giá">
            {formatPrice(test.price)}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={test.is_active ? 'success' : 'error'}>
              {test.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Loại">
            <Tag color={getCategoryColor(test.category)}>
              {test.category}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Phương pháp xét nghiệm">
            {test.sti_test_type === 'blood' && 'Xét nghiệm máu'}
            {test.sti_test_type === 'urine' && 'Xét nghiệm nước tiểu'}
            {test.sti_test_type === 'swab' && 'Xét nghiệm phết'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default StiTestDetail;