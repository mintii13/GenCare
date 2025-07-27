import React from 'react';
import { Form, InputNumber, Select, Card, Row, Col, Button } from 'antd';

const { Option } = Select;

interface UrineResultFormProps {
  namePrefix: string;
  onSubmit?: (values: any) => void;
}

const UrineResultForm: React.FC<UrineResultFormProps> = ({ namePrefix, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit?.(values);
  };

  return (
    <Card title="Urine Test Results">
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name={namePrefix}>
          <div>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="URO" name="uro" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="GLU" name="glu" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="KET" name="ket" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="BIL" name="bil" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="PRO" name="pro" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NIT" name="nit" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="pH" name="ph" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Specific Gravity" name="specific_gravity" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Color" name="color" rules={[{ required: true }]}>
                  <Select placeholder="Select color">
                    <Option value="light yellow">Light Yellow</Option>
                    <Option value="clear">Clear</Option>
                    <Option value="dark yellow to orange">Dark Yellow to Orange</Option>
                    <Option value="dark brown">Dark Brown</Option>
                    <Option value="pink or red">Pink or Red</Option>
                    <Option value="blue or green">Blue or Green</Option>
                    <Option value="black">Black</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Submit Results</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UrineResultForm;
