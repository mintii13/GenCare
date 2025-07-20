import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Tag, Typography, Form, Input, message, Space } from 'antd';
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import StiResultService, { StiResult, UpdateStiResultRequest } from '../../../services/stiResultService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ConsultantStiResults: React.FC = () => {
  const [results, setResults] = useState<StiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StiResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await StiResultService.getStiResults();
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (result: StiResult) => {
    setSelectedResult(result);
    form.setFieldsValue({
      diagnosis: result.diagnosis,
      is_confirmed: result.is_confirmed,
      notes: result.notes,
    });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedResult) {
        const updateData: UpdateStiResultRequest = {
          diagnosis: values.diagnosis,
          is_confirmed: true,
          notes: values.notes,
        };
        const response = await StiResultService.updateStiResult(selectedResult._id, updateData);
        if (response.success) {
          message.success('Xác nhận kết quả thành công');
          fetchResults();
        } else {
          message.error(response.message || 'Lỗi khi xác nhận kết quả');
        }
      }
      setModalVisible(false);
      setSelectedResult(null);
    } catch (error) {
      message.error('Vui lòng kiểm tra lại thông tin');
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id: string) => <Text code>{id.slice(-8)}</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Kết quả',
      dataIndex: 'result_value',
      key: 'result_value',
      render: (text: string) => text || 'Chưa có kết quả',
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (text: string) => text || 'Chưa có chẩn đoán',
    },
    {
      title: 'Trạng thái',
      key: 'is_confirmed',
      render: (_: unknown, record: StiResult) => (
        <Tag color={record.is_confirmed ? 'green' : 'orange'}>
          {record.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: StiResult) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          size="small"
        >
          Xem/Xác nhận
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Quản lý kết quả xét nghiệm STI</Title>
      <Table
        columns={columns}
        dataSource={results}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Xác nhận kết quả xét nghiệm"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="Xác nhận"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Chẩn đoán" name="diagnosis">
            <Input.TextArea rows={3} placeholder="Nhập chẩn đoán..." />
          </Form.Item>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConsultantStiResults; 