import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { StiTest, StiTestResponse } from '../../types/sti';

const { Option } = Select;
const { TextArea } = Input;

const StiTestForm: React.FC = () => {
  const [form] = Form.useForm<StiTest>();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTestDetails();
    }
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      const response = await api.get<StiTestResponse>(`/sti/getStiTest/${id}`);
      if (response.data.success) {
        form.setFieldsValue(response.data.data as StiTest);
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      message.error('Không thể tải thông tin xét nghiệm');
    }
  };

  const onFinish = async (values: StiTest) => {
    setLoading(true);
    try {
      const response = id
        ? await api.put<StiTestResponse>(`/sti/updateStiTest/${id}`, values)
        : await api.post<StiTestResponse>('/sti/createStiTest', values);

      if (response.data.success) {
        message.success(id ? 'Cập nhật thành công' : 'Thêm mới thành công');
        navigate('/test-packages');
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      message.error('Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>{id ? 'Chỉnh sửa xét nghiệm' : 'Thêm xét nghiệm mới'}</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isActive: true }}
      >
        <Form.Item
          name="sti_test_name"
          label="Tên xét nghiệm"
          rules={[{ required: true, message: 'Vui lòng nhập tên xét nghiệm' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="sti_test_code"
          label="Mã xét nghiệm"
          rules={[{ required: true, message: 'Vui lòng nhập mã xét nghiệm' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="price"
          label="Giá (VND)"
          rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="duration"
          label="Thời gian"
          rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="category"
          label="Loại"
          rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
        >
          <Select>
            <Option value="viral">Viral</Option>
            <Option value="bacterial">Bacterial</Option>
            <Option value="parasitic">Parasitic</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sti_test_type"
          label="Phương pháp xét nghiệm"
          rules={[{ required: true, message: 'Vui lòng chọn phương pháp' }]}
        >
          <Select>
            <Option value="blood">Xét nghiệm máu</Option>
            <Option value="urine">Xét nghiệm nước tiểu</Option>
            <Option value="swab">Xét nghiệm phết</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Trạng thái"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {id ? 'Cập nhật' : 'Thêm mới'}
            </Button>
            <Button onClick={() => navigate('/test-packages')}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default StiTestForm; 