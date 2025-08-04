import React, { useState } from 'react';
import { Modal, Button, Space, Typography, DatePicker, Input, Form } from 'antd';
import { CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface STIAssessmentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string, notes: string) => void;
  loading?: boolean;
  defaultDate?: string;
  defaultNotes?: string;
}

const STIAssessmentModal: React.FC<STIAssessmentModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
  defaultDate,
  defaultNotes = ''
}) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || '');
  const [notes, setNotes] = useState<string>(defaultNotes);

  const handleConfirm = () => {
    if (!selectedDate) {
      return;
    }
    
    onConfirm(selectedDate, notes);
  };

  const handleDateChange = (date: any) => {
    if (date) {
      setSelectedDate(date.format('YYYY-MM-DD'));
    } else {
      setSelectedDate('');
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>Xác nhận lịch hẹn</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={500}
      footer={null}
      maskClosable={false}
    >
      <div style={{ padding: '16px 0' }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Vui lòng xác nhận thông tin lịch hẹn
        </Title>

        <Form form={form} layout="vertical">
          <Form.Item
            label="Ngày hẹn"
            required
            validateStatus={!selectedDate ? 'error' : ''}
            help={!selectedDate ? 'Vui lòng chọn ngày hẹn' : ''}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Chọn ngày hẹn"
              onChange={handleDateChange}
              defaultValue={defaultDate ? dayjs(defaultDate) : undefined}
              disabledDate={(current) => {
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>

          <Form.Item label="Ghi chú (tùy chọn)">
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú cho lịch hẹn..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>

        <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
            loading={loading}
            disabled={!selectedDate}
            style={{ width: '100%', height: 48 }}
          >
            Xác nhận lịch hẹn
          </Button>
          
          <Button
            type="default"
            size="large"
            onClick={onClose}
            style={{ width: '100%', height: 48 }}
          >
            Hủy
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
            Lịch hẹn sẽ được xác nhận sau khi bạn nhấn &quot;Xác nhận lịch hẹn&quot; 
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default STIAssessmentModal; 