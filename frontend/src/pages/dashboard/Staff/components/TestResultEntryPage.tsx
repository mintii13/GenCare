import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Card,
  Spin,
  message,
  Collapse,
  Typography,
  Layout,
  Space,
  Result,
  Row,
  Col,
  // DatePicker,
  Switch,
  InputNumber,
  Select,
  Modal
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ExperimentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import apiClient from '../../../../services/apiClient';
import { API } from '../../../../config/apiEndpoints';
import { useAuth } from '../../../../contexts/AuthContext';
import { TestTypes } from '../../../../services/stiResultService';

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

interface StiTest {
  _id: string;
  sti_test_name: string;
  sti_test_type: TestTypes;
}

const TestResultEntryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [tests, setTests] = useState<StiTest[]>([]);
  const [existingResult, setExistingResult] = useState<any | null>(null);
  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [formChanged, setFormChanged] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  useEffect(() => {
    if (!orderId) {
      message.error('Không tìm thấy mã đơn hàng.');
      navigate('/staff/sti-management');
      return;
    }
    fetchData(orderId);
  }, [orderId, navigate]);

  
  const fetchData = async (order_id: string) => {
    setLoading(true);
    try {
      // 1. Luôn lấy thông tin đơn hàng
      const orderRes = await apiClient.get(API.STI.GET_ORDER(order_id));
      const orderData = (orderRes.data as any).order;
      if (!(orderRes.data as any).success || !orderData) {
        throw new Error('Không thể tải thông tin đơn hàng.');
      }
      setOrder(orderData);

      // 2. Lấy tất cả các tests trong đơn
      const allTestsRes = await apiClient.get(API.STI.GET_TESTS_FROM_ORDER(order_id));
      console.log("all test res ============>", (allTestsRes.data as any).data);
      const testsData = (allTestsRes.data as any).data || [];
      setTests(testsData);
      
      // Mở tất cả các panel khi có data
      if (testsData.length > 0) {
        setActiveKey(testsData.map((test: StiTest) => test._id));
      }

      // 3. Luôn gọi GET kết quả, sẽ auto-create nếu chưa có
      const resultRes = await apiClient.get(API.STI.GET_STI_RESULT(order_id));
      const resultData = (resultRes.data as any).data;
      if ((resultRes.data as any).success && resultData) {
        setExistingResult(resultData);
        prefillExistingData(resultData, testsData);
      } else {
        // Nếu chưa có result, khởi tạo form values mặc định
        initializeDefaultFormValues(testsData);
      }
    } catch (error: any) {
      console.error('Fetch data error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu.');
      navigate('/staff/sti-management');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteResults = async () => {
    if (!orderId) return;
    
    setCompleting(true);
    try {
      const response = await apiClient.patch(API.STI.COMPLETED_STI_RESULT(orderId));
  
      if ((response.data as any).success) {
        message.success('Đã hoàn thành tất cả kết quả xét nghiệm!');
        setShowCompleteModal(false);
        navigate('/staff/sti-management');
      } else {
        throw new Error((response.data as any).message || 'Không thể hoàn thành kết quả.');
      }
    } catch (error: any) {
      console.error('Complete results error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi hoàn thành kết quả.');
    } finally {
      setCompleting(false);
    }
  };
  
  // Khởi tạo form values mặc định cho các test chưa có kết quả
  const initializeDefaultFormValues = (testsData: StiTest[]) => {
    const formValues: any = {};
    testsData.forEach((test: StiTest) => {
      formValues[test._id] = {};
    });
    form.setFieldsValue(formValues);
  };

  // Pre-fill form với dữ liệu cũ nếu có
  const prefillExistingData = (resultData: any, testsData: StiTest[]) => {
    const formValues: any = {};
  
    testsData.forEach((test: StiTest) => {
      const resultItem = resultData.sti_result_items?.find(
        (item: any) => item.sti_test_id?._id === test._id || item.sti_test_id === test._id
      );
  
      if (resultItem && resultItem.result) {
        const testType = test.sti_test_type; // 'blood', 'urine', 'swab'
        
        // Lấy dữ liệu từ result theo test type
        const testSpecificData = resultItem.result[testType];
        
        if (testSpecificData) {
          formValues[test._id] = testSpecificData;
        } else {
          // Fallback: nếu không có data theo testType, khởi tạo object rỗng
          formValues[test._id] = {};
        }
      } else {
        // Nếu không có resultItem, khởi tạo object rỗng
        formValues[test._id] = {};
      }
    });
  
    console.log('Prefilling form with values:', formValues);
    form.setFieldsValue(formValues);
  };
  
  
  const onFinish = async (values: any) => {
    if (!orderId || !user) return;
    setSubmitting(true);
    
    try {
      console.log('Form values:', values);
      
      // Tạo payload đơn giản - gửi tất cả data form có
      const sti_result_items = tests.map(test => {
        const testResultData = values[test._id] || {};
        
        // Tách ra các field chung và field cụ thể
        const {...specificData } = testResultData;
        const result = {
          sample_type: test.sti_test_type,
          // time_completed: time_completed?.toISOString() || dayjs().toISOString(),
        };

        // Thêm data cụ thể theo loại test
        if (test.sti_test_type === 'blood') {
          (result as any).blood = specificData;
        } else if (test.sti_test_type === 'swab') {
          (result as any).swab = specificData;
        } else if (test.sti_test_type === 'urine') {
          (result as any).urine = specificData;
        }

        return {
          sti_test_id: test._id,
          result
        };
      });

      const payload = { 
        sti_result_items
        // Có thể thêm diagnosis, is_confirmed, medical_notes sau
      };

      console.log('Payload:', payload);

      // Chỉ dùng 1 API duy nhất
      const response = await apiClient.patch(API.STI.SAVE_STI_RESULT(orderId), payload);

      if ((response.data as any).success) {
        message.success('Kết quả đã được lưu thành công!');
        navigate('/staff/sti-management');
      } else {
        throw new Error((response.data as any).message || 'Không thể lưu kết quả.');
      }

    } catch (error: any) {
      console.error('Submit error:', error);
      message.error(error.message || 'Có lỗi xảy ra khi lưu kết quả.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form cho blood test với dropdown options
  // Form cho blood test với tất cả fields từ StiResultItem
  const renderBloodResultForm = (testId: string) => (
    <div>
      {/* Basic Blood Count Fields */}
      <Row gutter={24}>
        <Col span={1}>
        </Col>
        <Col span={4}>
          <Form.Item 
            label="Tiểu cầu (Platelets)" 
            name={[testId, 'platelets']}
            tooltip="Số lượng tiểu cầu trong máu (x10³/μL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="150-450" 
              min={0}
              max={1000}
              addonAfter="x10³/μL"
            />
          </Form.Item>
        </Col>
        <Col span={2}>
        </Col>
        <Col span={4}>
          <Form.Item 
            label="Hồng cầu (RBC)" 
            name={[testId, 'red_blood_cells']}
            tooltip="Số lượng hồng cầu trong máu (x10⁶/μL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="4.5-5.5" 
              min={0}
              max={10}
              step={0.1}
              addonAfter="x10⁶/μL"
            />
          </Form.Item>
        </Col>
        <Col span={2}>
        </Col>
        <Col span={4}>
          <Form.Item 
            label="Bạch cầu (WBC)" 
            name={[testId, 'white_blood_cells']}
            tooltip="Số lượng bạch cầu trong máu (x10³/μL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="4-11" 
              min={0}
              max={50}
              step={0.1}
              addonAfter="x10³/μL"
            />
          </Form.Item>
        </Col>
        <Col span={2}>
        </Col>
        <Col span={4}>
          <Form.Item 
            label="Hemoglobin" 
            name={[testId, 'hemo_level']}
            tooltip="Nồng độ hemoglobin trong máu (g/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="12-16" 
              min={0}
              max={25}
              step={0.1}
              addonAfter="g/dL"
            />
          </Form.Item>
        </Col>
        <Col span={1}>
        </Col>
      </Row>

      {/* STI Blood Tests */}
      <Row gutter={24}>
        <Col span={1}>  
        </Col>
        <Col span={4}>
          <Form.Item label="HIV Test" name={[testId, 'hiv']}>
            <Select 
              placeholder="Chọn kết quả HIV" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="HBsAg Test" name={[testId, 'HBsAg']}>
            <Select 
              placeholder="Chọn kết quả HBsAg" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="Anti-HBs" name={[testId, 'anti_HBs']}>
            <Select 
              placeholder="Chọn kết quả Anti-HBs" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="Anti-HBc" name={[testId, 'anti_HBc']}>
            <Select 
              placeholder="Chọn kết quả Anti-HBc" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={1}>  
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={1}>  
        </Col>
        <Col span={4}>
          <Form.Item label="Anti-HCV" name={[testId, 'anti_HCV']}>
            <Select 
              placeholder="Chọn kết quả Anti-HCV" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="HCV RNA" name={[testId, 'HCV_RNA']}>
            <Select 
              placeholder="Chọn kết quả HCV RNA" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Phát hiện (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Không phát hiện (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="TPHA Syphilis" name={[testId, 'TPHA_syphilis']}>
            <Select 
              placeholder="Chọn kết quả TPHA" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}>  
        </Col>
        <Col span={4}>
          <Form.Item label="VDRL Syphilis" name={[testId, 'VDRL_syphilis']}>
            <Select 
              placeholder="Chọn kết quả VDRL" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={1}>  
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={3}></Col>
        <Col span={5}>
          <Form.Item label="RPR Syphilis" name={[testId, 'RPR_syphilis']}>
            <Select 
              placeholder="Chọn kết quả RPR" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={5}>
          <Form.Item label="Treponema Pallidum IgM" name={[testId, 'treponema_pallidum_IgM']}>
            <Select 
              placeholder="Chọn kết quả IgM" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={5}>
          <Form.Item label="Treponema Pallidum IgG" name={[testId, 'treponema_pallidum_IgG']}>
            <Select 
              placeholder="Chọn kết quả IgG" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  // Form cho swab test với tất cả fields từ StiResultItem
  const renderSwabResultForm = (testId: string) => (
    <div>
      {/* Pathogen Detection Arrays */}
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item
            label="Vi khuẩn (Bacteria)"
            name={[testId, 'bacteria']}
            tooltip="Danh sách vi khuẩn phát hiện được"
          >
            <Select 
              mode="tags"
              placeholder="Nhập tên vi khuẩn" 
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            >
              <Option value="Neisseria gonorrhoeae">Neisseria gonorrhoeae</Option>
              <Option value="Chlamydia trachomatis">Chlamydia trachomatis</Option>
              <Option value="Ureaplasma urealyticum">Ureaplasma urealyticum</Option>
              <Option value="Mycoplasma genitalium">Mycoplasma genitalium</Option>
              <Option value="Streptococcus agalactiae">Streptococcus agalactiae</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Virus"
            name={[testId, 'virus']}
            tooltip="Danh sách virus phát hiện được"
          >
            <Select 
              mode="tags"
              placeholder="Nhập tên virus" 
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            >
              <Option value="HSV-1">HSV-1</Option>
              <Option value="HSV-2">HSV-2</Option>
              <Option value="HPV-16">HPV-16</Option>
              <Option value="HPV-18">HPV-18</Option>
              <Option value="CMV">CMV</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Ký sinh trùng (Parasites)"
            name={[testId, 'parasites']}
            tooltip="Danh sách ký sinh trùng phát hiện được"
          >
            <Select 
              mode="tags"
              placeholder="Nhập tên ký sinh trùng" 
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            >
              <Option value="Trichomonas vaginalis">Trichomonas vaginalis</Option>
              <Option value="Candida albicans">Candida albicans</Option>
              <Option value="Gardnerella vaginalis">Gardnerella vaginalis</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Specific STI Tests */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="PCR HSV"
            name={[testId, 'PCR_HSV']}
            tooltip="Kết quả xét nghiệm PCR Herpes Simplex Virus"
          >
            <Select 
              placeholder="Chọn kết quả PCR HSV" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="HPV"
            name={[testId, 'HPV']}
            tooltip="Kết quả xét nghiệm Human Papillomavirus"
          >
            <Select 
              placeholder="Chọn kết quả HPV" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Trichomonas Tests */}
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item
            label="NAAT Trichomonas"
            name={[testId, 'NAAT_Trichomonas']}
            tooltip="Nucleic Acid Amplification Test cho Trichomonas"
          >
            <Select 
              placeholder="Chọn kết quả NAAT" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Rapid Antigen Trichomonas"
            name={[testId, 'rapidAntigen_Trichomonas']}
            tooltip="Test kháng nguyên nhanh cho Trichomonas"
          >
            <Select 
              placeholder="Chọn kết quả Rapid Antigen" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Culture Trichomonas"
            name={[testId, 'culture_Trichomonas']}
            tooltip="Nuôi cấy cho Trichomonas"
          >
            <Select 
              placeholder="Chọn kết quả Culture" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value={true}>
                <span style={{ color: '#ff4d4f' }}>🔴 Dương tính (+)</span>
              </Option>
              <Option value={false}>
                <span style={{ color: '#52c41a' }}>🟢 Âm tính (-)</span>
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  // Form cho urine test với tất cả fields từ StiResultItem
  const renderUrineResultForm = (testId: string) => (
    <div>
      {/* Physical Properties */}
      <Row gutter={24}>
        <Col span={1}></Col>
        <Col span={6}>
          <Form.Item label="Màu sắc (Color)" name={[testId, 'color']}>
            <Select 
              placeholder="Chọn màu sắc" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="light yellow">🟡 Vàng nhạt (Light Yellow)</Option>
              <Option value="clear">⚪ Trong suốt (Clear)</Option>
              <Option value="dark yellow to orange">🟠 Vàng đậm đến cam</Option>
              <Option value="dark brown">🟤 Nâu đậm (Dark Brown)</Option>
              <Option value="pink or red">🔴 Hồng hoặc đỏ</Option>
              <Option value="blue or green">🔵 Xanh lam hoặc xanh lục</Option>
              <Option value="black">⚫ Đen (Black)</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item label="Độ trong (Clarity)" name={[testId, 'clarity']}>
            <Select 
              placeholder="Chọn độ trong" 
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="clearly">✨ Trong (Clear)</Option>
              <Option value="cloudy">☁️ Đục (Cloudy)</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={5}>
          <Form.Item 
            label="Máu trong nước tiểu (Blood)" 
            name={[testId, 'blood']}
            tooltip="Có phát hiện máu trong nước tiểu không"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Có máu" 
              unCheckedChildren="Không có máu"
              style={{ backgroundColor: form.getFieldValue([testId, 'blood']) ? '#ff4d4f' : undefined }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Chemical Analysis */}
      <Row gutter={24}>
        <Col span={1}></Col>
        <Col span={6}>
          <Form.Item 
            label="URO (Urobilinogen)" 
            name={[testId, 'URO']}
            tooltip="Urobilinogen (mg/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0.1-1.0" 
              min={0}
              max={5}
              step={0.1}
              addonAfter="mg/dL"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="GLU (Glucose)" 
            name={[testId, 'GLU']}
            tooltip="Glucose (mg/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-15" 
              min={0}
              max={1000}
              addonAfter="mg/dL"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="KET (Ketones)" 
            name={[testId, 'KET']}
            tooltip="Ketones (mg/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-10" 
              min={0}
              max={160}
              addonAfter="mg/dL"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={1}></Col>
        <Col span={6}>
          <Form.Item 
            label="BIL (Bilirubin)" 
            name={[testId, 'BIL']}
            tooltip="Bilirubin (mg/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-0.3" 
              min={0}
              max={5}
              step={0.1}
              addonAfter="mg/dL"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="PRO (Protein)" 
            name={[testId, 'PRO']}
            tooltip="Protein (mg/dL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-30" 
              min={0}
              max={2000}
              addonAfter="mg/dL"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="NIT (Nitrite)" 
            name={[testId, 'NIT']}
            tooltip="Nitrite - chỉ số nhiễm khuẩn"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-1" 
              min={0}
              max={3}
              step={0.1}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Physical and Chemical Properties */}
      <Row gutter={24}>
        <Col span={1}></Col>
        <Col span={6}>
          <Form.Item 
            label="pH" 
            name={[testId, 'pH']}
            tooltip="Độ pH của nước tiểu"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              max={14} 
              step={0.1}
              placeholder="4.5-8.0"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="Tỷ trọng (Specific Gravity)" 
            name={[testId, 'specific_gravity']}
            tooltip="Tỷ trọng nước tiểu"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1.000} 
              max={1.050} 
              step={0.001}
              placeholder="1.005-1.030"
            />
          </Form.Item>
        </Col>
        <Col span={2}></Col>
        <Col span={6}>
          <Form.Item 
            label="LEU (Leukocyte)" 
            name={[testId, 'LEU']}
            tooltip="Bạch cầu trong nước tiểu (cells/μL)"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="0-25" 
              min={0}
              max={500}
              addonAfter="cells/μL"
            />
          </Form.Item>
        </Col>
      </Row>

    </div>
  );

  const renderTestForm = (test: StiTest) => {
    switch (test.sti_test_type) {
      case 'blood':
        return renderBloodResultForm(test._id);
      case 'swab':
        return renderSwabResultForm(test._id);
      case 'urine':
        return renderUrineResultForm(test._id);
      default:
        return (
          <Result
            status="warning"
            title="Loại xét nghiệm không hỗ trợ"
            subTitle={`Loại: ${test.sti_test_type}`}
          />
        );
    }
  };

  const getTestStatusIndicator = (testId: string) => {
    // Kiểm tra form values hiện tại
    const currentFormValues = form.getFieldsValue();
    const testFormData = currentFormValues[testId];
    
    // Kiểm tra xem có ít nhất 1 field nào đã được điền không
    const hasAnyData = testFormData && Object.keys(testFormData).some(key => {
      const value = testFormData[key];
      // Kiểm tra value có tồn tại và không phải empty
      if (value === null || value === undefined || value === '') {
        return false;
      }
      // Nếu là array, kiểm tra có phần tử không
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      // Nếu là object, kiểm tra có properties không
      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      return true;
    });
    
    if (hasAnyData) {
      return (
        <span style={{ 
          backgroundColor: '#52c41a', 
          color: 'white', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '11px',
          fontWeight: 'bold',
          marginLeft: '8px'
        }}>
          ✓ Đã nhập
        </span>
      );
    }
    
    return (
      <span style={{ 
        backgroundColor: '#faad14', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '12px', 
        fontSize: '11px',
        fontWeight: 'bold',
        marginLeft: '8px'
      }}>
        ⏳ Chưa nhập
      </span>
    );
  };

  const getTestTypeIcon = (testType: string) => {
    switch (testType) {
      case 'blood':
        return '🩸';
      case 'swab':
        return '🧪';
      case 'urine':
        return '🥛';
      default:
        return '🔬';
    }
  };

  const getTestTypeColor = (testType: string) => {
    switch (testType) {
      case 'blood':
        return '#ff4d4f';
      case 'swab':
        return '#1890ff';
      case 'urine':
        return '#52c41a';
      default:
        return '#722ed1';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <Text type="secondary">Đang tải dữ liệu...</Text>
      </div>
    );
  }

  if (!order) {
    return (
      <Result 
        status="error" 
        title="Tải dữ liệu thất bại" 
        subTitle="Không thể tìm thấy thông tin đơn hàng." 
        extra={
          <Button type="primary" onClick={() => navigate('/staff/sti-management')}>
            Về trang quản lý
          </Button>
        } 
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            <ExperimentOutlined style={{ marginRight: '8px' }} />
            {existingResult ? 'Cập nhật kết quả xét nghiệm' : 'Nhập kết quả xét nghiệm'}
          </Title>
          <Text type="secondary">Đơn hàng: {order?.order_code}</Text>
        </div>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/staff/sti-management')}
          >
            Quay lại
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => form.submit()} 
            loading={submitting} 
            disabled={tests.length === 0}
            size="large"
          >
            Lưu kết quả
          </Button>
          <Button 
            type="primary"
            danger
            icon={<CheckCircleOutlined />} 
            onClick={() => setShowCompleteModal(true)}
            loading={completing}
            disabled={tests.length === 0 || !existingResult}
            size="large"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Hoàn thành kết quả
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Form form={form} onFinish={onFinish} layout="vertical" autoComplete="off" onValuesChange={() => setFormChanged(prev => prev + 1)}>
          <Card 
            title={
              <span style={{ color: '#1890ff', fontSize: '16px' }}>
                📋 Thông tin đơn hàng
              </span>
            } 
            style={{ marginBottom: 24, borderRadius: '8px' }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Text strong>👤 Khách hàng:</Text>
                <br />
                <Text>{order?.customer_name || order?.customer_id?.full_name}</Text>
              </Col>
              <Col span={8}>
                <Text strong>📅 Ngày đặt:</Text>
                <br />
                <Text>{dayjs(order?.order_date).format('DD/MM/YYYY')}</Text>
              </Col>
              <Col span={8}>
                <Text strong>🏥 Trạng thái:</Text>
                <br />
                <Text style={{ color: '#52c41a' }}>Đang xử lý</Text>
              </Col>
            </Row>
          </Card>

          {tests.length > 0 ? (
            <Card 
              title={
                <span style={{ color: '#1890ff', fontSize: '16px' }}>
                  🔬 Chi tiết xét nghiệm ({tests.length} test)
                </span>
              }
              style={{ borderRadius: '8px' }}
              extra={
                <Text type="secondary">
                  {existingResult ? 'Có thể chỉnh sửa tất cả kết quả' : 'Nhập kết quả cho các xét nghiệm'}
                </Text>
              }
            >
              <Collapse 
                activeKey={activeKey}
                onChange={setActiveKey}
                size="large"
                ghost
              >
                {tests.map((test, index) => (
                  <Panel 
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          backgroundColor: getTestTypeColor(test.sti_test_type),
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          minWidth: '60px',
                          textAlign: 'center'
                        }}>
                          {getTestTypeIcon(test.sti_test_type)} {test.sti_test_type}
                        </span>
                        <Title level={5} style={{ margin: 0, color: '#262626', flex: 1 }}>
                          {test.sti_test_name}
                        </Title>
                        {getTestStatusIndicator(test._id)}
                      </div>
                    } 
                    key={test._id}
                    style={{
                      marginBottom: '16px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '6px' }}>
                      {/* Test-specific form */}
                      <div style={{ 
                        backgroundColor: '#f9f9f9', 
                        padding: '24px', 
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8'
                      }}>
                        <Title level={5} style={{ marginBottom: '20px', color: '#1890ff' }}>
                          📊 Chi tiết kết quả xét nghiệm {getTestTypeIcon(test.sti_test_type)}
                        </Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                            Các trường có thể bỏ trống nếu chưa có kết quả. Chỉ nhập những giá trị đã có.
                        </Text>
                        {renderTestForm(test)}
                      </div>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            </Card>
          ) : (
            <Result
              status="info"
              title="Không có xét nghiệm"
              subTitle="Đơn hàng này không có xét nghiệm nào để nhập kết quả."
              extra={
                <Button type="default" onClick={() => navigate('/staff/sti-management')}>
                  Quay lại danh sách
                </Button>
              }
            />
          )}
        </Form>
      </Content>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Xác nhận hoàn thành kết quả</span>
          </div>
        }
        open={showCompleteModal}
        onOk={handleCompleteResults}
        onCancel={() => setShowCompleteModal(false)}
        okText="Xác nhận hoàn thành"
        cancelText="Hủy"
        confirmLoading={completing}
        okButtonProps={{
          danger: false,
          type: 'primary',
          style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
        }}
      >
        <div style={{ padding: '16px 0' }}>
          <Text>
            Bạn có chắc chắn muốn <strong>hoàn thành tất cả kết quả xét nghiệm</strong> cho đơn hàng này không?
          </Text>
          <br /><br />
          <Text type="secondary">
            Sau khi hoàn thành, trạng thái sẽ được cập nhật và không thể hoàn tác.
          </Text>
          <br /><br />
          <div style={{ 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: '6px', 
            padding: '12px' 
          }}>
            <Text strong>Đơn hàng: </Text>
            <Text code>{order?.order_code}</Text>
            <br />
            <Text strong>Khách hàng: </Text>
            <Text>{order?.customer_name || order?.customer_id?.full_name}</Text>
            <br />
            <Text strong>Số lượng xét nghiệm: </Text>
            <Text>{tests.length} test</Text>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default TestResultEntryPage;