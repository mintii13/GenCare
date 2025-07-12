import React from 'react';
import { Modal, Button, Space, Typography, Alert } from 'antd';
import { QuestionCircleOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface STIAssessmentModalProps {
  visible: boolean;
  onClose: () => void;
  onTakeAssessment: () => void;
  onSkipAssessment: () => void;
  loading?: boolean;
}

const STIAssessmentModal: React.FC<STIAssessmentModalProps> = ({
  visible,
  onClose,
  onTakeAssessment,
  onSkipAssessment,
  loading = false
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QuestionCircleOutlined style={{ color: '#1890ff' }} />
          <span>Đánh giá tình trạng STI</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
      maskClosable={false}
    >
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="Đề xuất từ GenCare"
          description="Để có được lời khuyên chính xác nhất về xét nghiệm STI phù hợp, chúng tôi khuyến khích bạn thực hiện bài đánh giá ngắn trước."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Title level={4} style={{ marginBottom: 16 }}>
          Bạn có muốn làm bài đánh giá tình trạng STI không?
        </Title>

        <Paragraph style={{ fontSize: 16, lineHeight: 1.6 }}>
          Bài đánh giá sẽ giúp bạn:
        </Paragraph>

        <div style={{ marginLeft: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              backgroundColor: '#1890ff', 
              borderRadius: '50%', 
              marginTop: 8, 
              marginRight: 12 
            }} />
            <Text style={{ fontSize: 15 }}>
              <strong>Xác định mức độ nguy cơ</strong> dựa trên tình trạng sức khỏe và lối sống của bạn
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              backgroundColor: '#1890ff', 
              borderRadius: '50%', 
              marginTop: 8, 
              marginRight: 12 
            }} />
            <Text style={{ fontSize: 15 }}>
              <strong>Nhận gợi ý gói xét nghiệm</strong> phù hợp với nhu cầu cá nhân
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              backgroundColor: '#1890ff', 
              borderRadius: '50%', 
              marginTop: 8, 
              marginRight: 12 
            }} />
            <Text style={{ fontSize: 15 }}>
              <strong>Tiết kiệm thời gian</strong> tư vấn khi đến trung tâm
            </Text>
          </div>
        </div>

        <Alert
          message="Thời gian: 3-5 phút | Hoàn toàn bảo mật"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            icon={<FileTextOutlined />}
            onClick={onTakeAssessment}
            loading={loading}
            style={{ width: '100%', height: 48 }}
          >
            Làm bài đánh giá (Khuyến khích)
          </Button>
          
          <Button
            type="default"
            size="large"
            icon={<CalendarOutlined />}
            onClick={onSkipAssessment}
            style={{ width: '100%', height: 48 }}
          >
            Bỏ qua và đặt lịch ngay
          </Button>
        </Space>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#f6f6f6', 
          borderRadius: 6 
        }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Thông tin của bạn sẽ được bảo mật tuyệt đối và chỉ được sử dụng cho mục đích tư vấn y tế
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default STIAssessmentModal; 