import React from 'react';
import { Card, Row, Col, Table, Tag, Divider, Typography, Space, Badge, Alert } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface StiResultDisplayProps {
  resultData: any;
}

const StiResultDisplay: React.FC<StiResultDisplayProps> = ({ resultData }) => {
  if (!resultData) {
    return (
      <Alert
        message="Không có dữ liệu kết quả"
        description="Dữ liệu kết quả xét nghiệm không khả dụng"
        type="warning"
        showIcon
      />
    );
  }

  // Định nghĩa các test fields theo sti_test_code
  type TestField = {
    name: string;       // key dùng trong Form
    label: string;      // nhãn hiển thị (VD: "HIV")
    tooltip?: string;   // mô tả ngắn nếu cần (VD: "Xét nghiệm HIV")
  };

  const TEST_FIELDS_BY_CODE: Record<string, TestField[]> = {
    'STI-VIR-BLD-HIV-COMBO': [
      { name: 'hiv', label: 'HIV Test', tooltip: 'Test HIV' },
    ],
    'STI-VIR-BLD-HBV': [
      { name: 'anti_HBs', label: 'Anti-HBs', tooltip: 'Test kháng thể bề mặt Viêm gan B' },
      { name: 'anti_HBc', label: 'Anti-HBc', tooltip: 'Test kháng thể lõi Viêm gan B' },
    ],
    'STI-VIR-BLD-HCV': [
      { name: 'anti_HCV', label: 'Anti-HCV', tooltip: 'Test kháng thể Viêm gan C' },
      { name: 'HCV_RNA', label: 'HCV RNA', tooltip: 'Test virus Viêm gan C' },
    ],
    'STI-BAC-BLD-SYPHILIS': [
      { name: 'TPHA_syphilis', label: 'TPHA Syphilis', tooltip: 'Test đặc hiệu TPHA, xác định bệnh giang mai' },
      { name: 'treponema_pallidum_IgM', label: 'Treponema Pallidum IgM', tooltip: 'Test kháng thể Treponema Pallidum IgM trong Giang mai' },
      { name: 'treponema_pallidum_IgG', label: 'Treponema Pallidum IgG', tooltip: 'Test kháng thể Treponema Pallidum IgG trong Giang mai' },
    ],
    'STI-BAC-BLD-RPR': [
      { name: 'RPR_syphilis', label: 'RPR Syphilis', tooltip: 'Test RPR để sàng lọc giang mai' },
    ],
    // Swab tests
    'STI-VIR-SWB-HSV': [
      { name: 'PCR_HSV', label: 'PCR HSV', tooltip: 'Test PCR phát hiện virus Herpes Simplex' },
    ],
    'STI-VIR-SWB-HPV': [
      { name: 'HPV', label: 'HPV', tooltip: 'Human Papillomavirus' }
    ],
    'STI-PAR-SWB-TRI': [
      { name: 'NAAT_Trichomonas', label: 'NAAT Trichomonas', tooltip: 'Nucleic Acid Amplification Test cho Trichomonas' },
      { name: 'rapidAntigen_Trichomonas', label: 'Rapid Antigen Trichomonas', tooltip: 'Test kháng nguyên nhanh cho Trichomonas' },
      { name: 'culture_Trichomonas', label: 'Culture Trichomonas', tooltip: 'Nuôi cấy cho Trichomonas' },
    ],
  };

  const getResultStatus = (value: any) => {
    if (value === null || value === undefined) {
      return { text: 'Chưa có kết quả', color: 'default', icon: null };
    }
    if (value === true) {
      return { text: 'Dương tính', color: 'error', icon: <ExclamationCircleOutlined /> };
    }
    if (value === false) {
      return { text: 'Âm tính', color: 'success', icon: <CheckCircleOutlined /> };
    }
    return { text: value.toString(), color: 'processing', icon: null };
  };

  const getNormalRange = (testName: string) => {
    const ranges: Record<string, string> = {
      // Blood tests
      'platelets': '150-400 (×10³/μL)',
      'red_blood_cells': '3.9-5.8 (×10⁶/μL)',
      'white_blood_cells': '4-10 (×10³/μL)',
      'hemo_level': '12-16 g/dL',
      'hiv': 'Âm tính',
      'anti_HBs': 'Âm tính',
      'anti_HBc': 'Âm tính',
      'anti_HCV': 'Âm tính',
      'HCV_RNA': 'Âm tính',
      'TPHA_syphilis': 'Âm tính',
      'RPR_syphilis': 'Âm tính',
      'treponema_pallidum_IgM': 'Âm tính',
      'treponema_pallidum_IgG': 'Âm tính',
      // Urine tests
      'URO': '0.2-1.0 mg/dL',
      'GLU': '> 0.8 mmol/l',
      'KET': '0-5 mg/dL',
      'BIL': '0.4-0.8 mg/dL', 
      'PRO': '7.5-10 mg/dL',
      'NIT': '0.05-0.1 mg/dL',
      'pH': '6.0-7.5',
      'specific_gravity': '1.005-1.025',
      'LEU': '10-25 cells/μL',
      'color': 'Vàng nhạt',
      'clarity': 'Trong',
      //Swab tests
      'PCR_HSV': 'Âm tính',
      'HPV': 'Âm tính',
      'NAAT_Trichomonas': 'Âm tính',
      'rapidAntigen_Trichomonas': 'Âm tính',
      'culture_Trichomonas': 'Âm tính',
      'bacteria': 'Không',
      'virus': 'Không',
      'parasites': 'Không'
    };
    return ranges[testName] || '';
  };

  const isAbnormal = (testName: string, value: any) => {
    const abnormalChecks: Record<string, boolean> = {
      // Blood tests
      'platelets': typeof value === 'number' && (value < 150 || value > 400),
      'red_blood_cells': typeof value === 'number' && (value < 4.2 || value > 5.4),
      'white_blood_cells': typeof value === 'number' && (value < 4.5 || value > 11.0),
      'hemo_level': typeof value === 'number' && (value < 12 || value > 16),
      // Urine tests
      'URO': typeof value === 'number' && (value < 0.2 || value > 1.0),
      'GLU': typeof value === 'number' && value > 0,
      'KET': typeof value === 'number' && value > 0,
      'BIL': typeof value === 'number' && value > 0,
      'PRO': typeof value === 'number' && value > 30,
      'NIT': typeof value === 'number' && value > 0,
      'pH': typeof value === 'number' && (value < 4.6 || value > 8.0),
      'specific_gravity': typeof value === 'number' && (value < 1.003 || value > 1.030),
      'LEU': typeof value === 'number' && value > 0,
      'blood': value === true,
      'color': value !== 'light yellow' && value !== 'clear',
      'clarity': value === 'cloudy'
    };
    return abnormalChecks[testName] || false;
  };

  const formatTestName = (key: string) => {
    const names: Record<string, string> = {
      // Blood tests
      'platelets': 'Tiểu cầu',
      'red_blood_cells': 'Hồng cầu',
      'white_blood_cells': 'Bạch cầu',
      'hemo_level': 'Hemoglobin',
      'anti_HBs': 'Anti-HBs (Kháng thể bề mặt Hepatitis B)',
      'anti_HBc': 'Anti-HBc (Kháng thể lõi Hepatitis B)',
      'hiv': 'HIV',
      'anti_HCV': 'Anti-HCV (Kháng thể Hepatitis C)',
      'HCV_RNA': 'HCV RNA',
      'TPHA_syphilis': 'TPHA (Giang mai)',
      'RPR_syphilis': 'RPR (Giang mai)',
      'treponema_pallidum_IgM': 'Treponema pallidum IgM',
      'treponema_pallidum_IgG': 'Treponema pallidum IgG',
      // Urine tests
      'color': 'Màu sắc',
      'clarity': 'Độ trong',
      'URO': 'Urobilinogen',
      'GLU': 'Glucose',
      'KET': 'Ketone',
      'BIL': 'Bilirubin',
      'PRO': 'Protein',
      'NIT': 'Nitrite',
      'pH': 'pH',
      'blood': 'Máu ẩn',
      'specific_gravity': 'Tỷ trọng',
      'LEU': 'Leukocyte',
      // Swab tests
      'PCR_HSV': 'PCR HSV',
      'HPV': 'HPV',
      'NAAT_Trichomonas': 'NAAT Trichomonas',
      'rapidAntigen_Trichomonas': 'Rapid Antigen Trichomonas',
      'culture_Trichomonas': 'Culture Trichomonas',
      'bacteria': 'Vi khuẩn',
      'virus': 'Virus',
      'parasites': 'Ký sinh trùng'
    };
    return names[key] || key;
  };

  const formatUrineColor = (color: string) => {
    const colorNames: Record<string, string> = {
      'light yellow': 'Vàng nhạt',
      'clear': 'Trong suốt',
      'dark yellow to orange': 'Vàng đậm đến cam',
      'dark brown': 'Nâu đậm', 
      'pink or red': 'Hồng hoặc đỏ',
      'blue or green': 'Xanh lam hoặc xanh lá',
      'black': 'Đen'
    };
    return colorNames[color] || color;
  };

  const formatUrineClarity = (clarity: string) => {
    const clarityNames: Record<string, string> = {
      'clearly': 'Trong',
      'cloudy': 'Đục'
    };
    return clarityNames[clarity] || clarity;
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'Chưa có kết quả';
    if (typeof value === 'boolean') return value ? 'Dương tính' : 'Âm tính';
    
    // Special formatting for urine tests
    if (key === 'color') return formatUrineColor(value);
    if (key === 'clarity') return formatUrineClarity(value);
    
    if (typeof value === 'number') {
      const units: Record<string, string> = {
        // Blood tests
        'platelets': '×10³/μL',
        'red_blood_cells': '×10⁶/μL', 
        'white_blood_cells': '×10³/μL',
        'hemo_level': 'g/dL',
        // Urine tests
        'URO': 'mg/dL',
        'GLU': 'mg/dL',
        'KET': 'mg/dL',
        'BIL': 'mg/dL',
        'PRO': 'mg/dL',
        'NIT': 'mg/dL',
        'LEU': 'mg/dL',
        'specific_gravity': ''
      };
      
      // For urine tests, show "Âm tính" for 0 values in certain tests
      if (['GLU', 'KET', 'BIL', 'NIT', 'LEU'].includes(key) && value === 0) {
        return 'Âm tính';
      }
      if (key === 'blood' && value === 0) {
        return 'Âm tính';
      }
      if (key === 'PRO' && value === 0) {
        return 'Âm tính';
      }
      
      return `${value} ${units[key] || ''}`;
    }
    
    // Handle arrays (for swab tests)
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Không phát hiện';
    }
    
    return value.toString();
  };

  const createTestTable = (testData: any, title: string, testCode?: string, testCategory?: string) => {
    const tests: any[] = [];
    
    // Lấy các fields được phép hiển thị dựa trên test code
    const allowedFields = testCode ? TEST_FIELDS_BY_CODE[testCode]?.map(field => field.name) || [] : [];
    
    // Luôn cho phép các basic fields cho blood test
    const basicBloodFields = ['platelets', 'red_blood_cells', 'white_blood_cells', 'hemo_level'];
    
    // Luôn cho phép tất cả fields cho urine test
    const urineFields = ['color', 'clarity', 'URO', 'GLU', 'KET', 'BIL', 'PRO', 'NIT', 'pH', 'blood', 'specific_gravity', 'LEU'];
    
    // Fields cho swab test dựa trên category
    const commonSwabFields = testCategory === 'viral' ? ['virus'] : testCategory === 'parasitic' ? ['parasites'] : ['bacteria'];
    
    Object.keys(testData).forEach(key => {
      if (testData[key] !== undefined) {
        const value = testData[key];
        
        // Kiểm tra xem field này có được phép hiển thị không
        let shouldShow = false;
        
        if (title.includes('máu')) {
          // Cho blood test: luôn hiển thị basic fields + fields theo test code
          shouldShow = basicBloodFields.includes(key) || allowedFields.includes(key);
        } else if (title.includes('nước tiểu')) {
          // Cho urine test: hiển thị tất cả
          shouldShow = urineFields.includes(key);
        } else if (title.includes('swab')) {
          // Cho swab test: hiển thị common fields + fields theo test code
          shouldShow = commonSwabFields.includes(key) || allowedFields.includes(key);
        }
        
        if (!shouldShow) return;
        
        const isNumeric = typeof value === 'number';
        const isBoolean = typeof value === 'boolean';
        const isArray = Array.isArray(value);
        const resultStatus = getResultStatus(value);
        
        tests.push({
          key,
          test: formatTestName(key),
          result: formatValue(key, value),
          normalRange: getNormalRange(key),
          status: (() => {
            if (isAbnormal(key, value)) return 'abnormal';
            if (isBoolean && value === true) return 'positive';
            if (isBoolean && value === false) return 'negative';
            if (isNumeric || key === 'color' || key === 'clarity') return 'normal';
            if (isArray && value.length > 0) return 'positive';
            if (isArray && value.length === 0) return 'negative';
            return 'pending';
          })(),
          rawValue: value
        });
      }
    });

    // Nếu không có test nào để hiển thị, không render table
    if (tests.length === 0) {
      return null;
    }

    const columns = [
      {
        title: 'Xét nghiệm',
        dataIndex: 'test',
        key: 'test',
        width: '30%',
        render: (text: string) => <Text strong>{text}</Text>
      },
      {
        title: 'Kết quả',
        dataIndex: 'result',
        key: 'result',
        width: '25%',
        render: (text: string, record: any) => {
          let color = 'default';
          let icon = null;
          
          if (record.status === 'abnormal') {
            color = 'warning';
            icon = <ExclamationCircleOutlined />;
          } else if (record.status === 'positive') {
            color = 'error';
            icon = <ExclamationCircleOutlined />;
          } else if (record.status === 'negative') {
            color = 'success';
            icon = <CheckCircleOutlined />;
          } else if (record.status === 'normal') {
            color = 'success';
            icon = <CheckCircleOutlined />;
          }

          return (
            <Tag color={color} icon={icon}>
              {text}
            </Tag>
          );
        }
      },
      {
        title: 'Giá trị tham chiếu',
        dataIndex: 'normalRange',
        key: 'normalRange',
        width: '25%',
        render: (text: string) => <Text type="secondary">{text}</Text>
      }
    ];

    return (
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
          <FileTextOutlined /> {title}
          {testCode && (
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
              ({testCode})
            </Text>
          )}
        </Title>
        <Table
          columns={columns}
          dataSource={tests}
          pagination={false}
          size="small"
          bordered
          rowClassName={(record) => {
            if (record.status === 'abnormal' || record.status === 'positive') {
              return 'abnormal-result';
            }
            return '';
          }}
        />
      </div>
    );
  };

  const renderResultItems = () => {
    if (!resultData.sti_result_items || resultData.sti_result_items.length === 0) {
      return (
        <Alert
          message="Không có kết quả xét nghiệm"
          type="info"
          showIcon
        />
      );
    }

    return resultData.sti_result_items.map((item: any, index: number) => {
      const result = item.result;
      const testInfo = item.sti_test_id;
      
      // Lấy test code và category từ testInfo
      const testCode = testInfo?.sti_test_code || '';
      const testCategory = testInfo?.category || '';
      
      return (
        <Card key={index} style={{ marginBottom: 16 }}>
          {/* Test Information Header */}
          <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {testInfo?.sti_test_name || 'Xét nghiệm STI'}
                </Title>
              </Col>
              <Col span={12}>
                <Text strong>Mã xét nghiệm: </Text>
                <Text code>{testCode || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Loại mẫu: </Text>
                <Tag color="blue">
                  {result?.sample_type === 'blood' ? 'Máu' : 
                   result?.sample_type === 'urine' ? 'Nước tiểu' : 'Swab'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Thời gian hoàn thành: </Text>
                <Text>{result?.time_completed ? dayjs(result.time_completed).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Danh mục: </Text>
                <Tag>{testCategory || 'N/A'}</Tag>
              </Col>
            </Row>
          </div>

          {/* Test Results */}
          {result?.blood && Object.keys(result.blood).some(key => result.blood[key] !== null && result.blood[key] !== undefined) && (
            createTestTable(result.blood, 'Xét nghiệm máu', testCode, testCategory)
          )}

          {result?.urine && Object.keys(result.urine).some(key => result.urine[key] !== null && result.urine[key] !== undefined) && (
            createTestTable(result.urine, 'Xét nghiệm nước tiểu', testCode, testCategory)
          )}

          {result?.swab && Object.keys(result.swab).some(key => 
            result.swab[key] !== null && result.swab[key] !== undefined && 
            (typeof result.swab[key] !== 'object' || (Array.isArray(result.swab[key]) && result.swab[key].length > 0))
          ) && (
            createTestTable(result.swab, 'Xét nghiệm swab', testCode, testCategory)
          )}

          {/* Test Description */}
          {testInfo?.description && (
            <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <Text strong>Mô tả xét nghiệm: </Text>
              <Text>{testInfo.description}</Text>
            </div>
          )}
        </Card>
      );
    });
  };

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <style>
        {`
          .abnormal-result {
            background-color: #fff2f0 !important;
          }
          .abnormal-result:hover {
            background-color: #ffebe6 !important;
          }
        `}
      </style>
      
      {/* Header Information */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={3} style={{ textAlign: 'center', color: '#1890ff', marginBottom: 16 }}>
          KẾT QUẢ XÉT NGHIỆM STI
        </Title>
        
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text strong>Mã kết quả: </Text>
            <Text code>{resultData._id}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Mã đơn hàng: </Text>
            <Text code>{resultData.sti_order_id}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Ngày tạo: </Text>
            <Text>{dayjs(resultData.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Cập nhật lần cuối: </Text>
            <Text>{dayjs(resultData.updatedAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Trạng thái: </Text>
            <Tag color={resultData.is_testing_completed ? 'success' : 'processing'}>
              {resultData.is_testing_completed ? 'Hoàn thành' : 'Đang xử lý'}
            </Tag>
          </Col>
          <Col span={12}>
            <Text strong>Xác nhận: </Text>
            <Tag color={resultData.is_confirmed ? 'success' : 'default'}>
              {resultData.is_confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
            </Tag>
          </Col>
          {resultData.is_critical && (
            <Col span={24}>
              <Alert
                message="KẾT QUẢ QUAN TRỌNG"
                description="Kết quả này cần được chú ý đặc biệt"
                type="error"
                showIcon
                style={{ marginTop: 8 }}
              />
            </Col>
          )}
        </Row>
      </Card>

      {/* Test Results */}
      {renderResultItems()}

      {/* Diagnosis and Notes */}
      {(resultData.diagnosis || resultData.medical_notes) && (
        <Card title="Chẩn đoán và Ghi chú y khoa" style={{ marginTop: 16 }}>
          {resultData.diagnosis && (
            <div style={{ marginBottom: 12 }}>
              <Text strong>Chẩn đoán: </Text>
              <Text>{resultData.diagnosis}</Text>
            </div>
          )}
          {resultData.medical_notes && (
            <div>
              <Text strong>Ghi chú y khoa: </Text>
              <Text>{resultData.medical_notes}</Text>
            </div>
          )}
        </Card>
      )}

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: 24, 
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        color: '#666'
      }}>
        <Text type="secondary">
          * Kết quả này chỉ có giá trị khi được bác sĩ xác nhận
        </Text>
      </div>
    </div>
  );
};

export default StiResultDisplay;