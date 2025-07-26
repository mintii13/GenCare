import React from 'react';
import { Form, Card, Row, Col, InputNumber, Select } from 'antd';

const { Option } = Select;

interface SwabResultFormProps {
  namePrefix: string;
  onSubmit?: (values: any) => void;
}

const SwabResultForm: React.FC<SwabResultFormProps> = ({ namePrefix, onSubmit}) => {
  return (
    <Card title="Swab Test Results" style={{ marginBottom: 24 }}>
      <Form.Item name={namePrefix}>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="PCR HSV"
              name="pcr_hsv"
              rules={[{ required: true, message: 'Please enter PCR HSV result' }]}
            >
              <Select placeholder="Select result">
                <Option value="positive">Positive</Option>
                <Option value="negative">Negative</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="HPV"
              name="hpv"
              rules={[{ required: true, message: 'Please enter HPV result' }]}
            >
              <Select placeholder="Select result">
                <Option value="positive">Positive</Option>
                <Option value="negative">Negative</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="Bacteria" name="bacteria">
              <InputNumber style={{ width: '100%' }} placeholder="Enter bacteria count" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Virus" name="virus">
              <InputNumber style={{ width: '100%' }} placeholder="Enter virus count" />
            </Form.Item>
          </Col>
        </Row>
      </Form.Item>
    </Card>
  );
};

export default SwabResultForm;
