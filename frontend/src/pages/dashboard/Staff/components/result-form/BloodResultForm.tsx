import React from 'react';
import { Form, InputNumber, Button, Card, Row, Col } from 'antd';

interface BloodResultFormProps {
  namePrefix: string;
  onSubmit: (values: any) => void;
}

const BloodResultForm: React.FC<BloodResultFormProps> = ({ namePrefix, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Card title="Blood Test Results">
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="Platelets" name={[namePrefix, 'platelets']} rules={[{ required: true, message: 'Please enter platelets count' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Red Blood Cells" name={[namePrefix, 'red_blood_cells']} rules={[{ required: true, message: 'Please enter red blood cells count' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="White Blood Cells" name={[namePrefix, 'white_blood_cells']} rules={[{ required: true, message: 'Please enter white blood cells count' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Hemoglobin Level" name={[namePrefix, 'hemo_level']} rules={[{ required: true, message: 'Please enter hemoglobin level' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="HIV Test Result" name={[namePrefix, 'hiv']}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          {/* <Col span={12}>
            <Form.Item label="HBsAg Test Result" name={[namePrefix, 'HBsAg']}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col> */}
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit Results
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BloodResultForm;
