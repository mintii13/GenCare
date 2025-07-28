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
      'platelets': '150-450 (×10³/μL)',
      'red_blood_cells': '4.2-5.4 (×10⁶/μL)',
      'white_blood_cells': '4.5-11.0 (×10³/μL)',
      'hemo_level': '12-16 g/dL'
    };
    return ranges[testName] || '';
  };

  const isAbnormal = (testName: string, value: number) => {
    const abnormalRanges: Record<string, boolean> = {
      'platelets': value < 150 || value > 450,
      'red_blood_cells': value < 4.2 || value > 5.4,
      'white_blood_cells': value < 4.5 || value > 11.0,
      'hemo_level': value < 12 || value > 16
    };
    return abnormalRanges[testName] || false;
  };

  const formatTestName = (key: string) => {
    const names: Record<string, string> = {
      'platelets': 'Tiểu cầu',
      'red_blood_cells': 'Hồng cầu',
      'white_blood_cells': 'Bạch cầu',
      'hemo_level': 'Hemoglobin',
      'anti_HBs': 'Anti-HBs (Kháng thể bề mặt Hepatitis B)',
      'anti_HBc': 'Anti-HBc (Kháng thể lõi Hepatitis B)',
      'hiv': 'HIV',
      'HBsAg': 'HBsAg (Kháng nguyên bề mặt Hepatitis B)',
      'anti_HCV': 'Anti-HCV (Kháng thể Hepatitis C)',
      'HCV_RNA': 'HCV RNA',
      'TPHA_syphilis': 'TPHA (Giang mai)',
      'VDRL_syphilis': 'VDRL (Giang mai)',
      'RPR_syphilis': 'RPR (Giang mai)',
      'treponema_pallidum_IgM': 'Treponema pallidum IgM',
      'treponema_pallidum_IgG': 'Treponema pallidum IgG',
      'PCR_HSV': 'PCR HSV',
      'HPV': 'HPV',
      'NAAT_Trichomonas': 'NAAT Trichomonas',
      'rapidAntigen_Trichomonas': 'Rapid Antigen Trichomonas',
      'culture_Trichomonas': 'Culture Trichomonas'
    };
    return names[key] || key;
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'Chưa có kết quả';
    if (typeof value === 'boolean') return value ? 'Dương tính' : 'Âm tính';
    if (typeof value === 'number') {
      const units: Record<string, string> = {
        'platelets': '×10³/μL',
        'red_blood_cells': '×10⁶/μL', 
        'white_blood_cells': '×10³/μL',
        'hemo_level': 'g/dL'
      };
      return `${value} ${units[key] || ''}`;
    }
    return value.toString();
  };

  const createTestTable = (testData: any, title: string) => {
    const tests: any[] = [];
    
    Object.keys(testData).forEach(key => {
      if (testData[key] !== undefined) {
        const value = testData[key];
        const isNumeric = typeof value === 'number';
        const resultStatus = getResultStatus(value);
        
        tests.push({
          key,
          test: formatTestName(key),
          result: formatValue(key, value),
          normalRange: isNumeric ? getNormalRange(key) : 'Âm tính',
          status: isNumeric 
            ? (isAbnormal(key, value) ? 'abnormal' : 'normal')
            : (value === true ? 'positive' : (value === false ? 'negative' : 'pending')),
          rawValue: value
        });
      }
    });

    const columns = [
      {
        title: 'Xét nghiệm',
        dataIndex: 'test',
        key: 'test',
        width: '40%',
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
      // {
      //   title: 'Giá trị tham chiếu',
      //   dataIndex: 'normalRange',
      //   key: 'normalRange',
      //   width: '25%',
      //   render: (text: string) => <Text type="secondary">{text}</Text>
      // },
    //   {
    //     title: 'Đánh giá',
    //     key: 'assessment',
    //     width: '10%',
    //     render: (_: any, record: any) => {
    //       if (record.status === 'abnormal' || record.status === 'positive') {
    //         return <Badge status="error" text="Bất thường" />;
    //       } else if (record.status === 'normal' || record.status === 'negative') {
    //         return <Badge status="success" text="Bình thường" />;
    //       } else {
    //         return <Badge status="default" text="Chờ kết quả" />;
    //       }
    //     }
    //   }
    ];

    return (
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
          <FileTextOutlined /> {title}
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
                <Text code>{testInfo?.sti_test_code || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Loại mẫu: </Text>
                <Tag color="blue">{result?.sample_type === 'blood' ? 'Máu' : 'Swab'}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>Thời gian hoàn thành: </Text>
                <Text>{result?.time_completed ? dayjs(result.time_completed).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Danh mục: </Text>
                <Tag>{testInfo?.category || 'N/A'}</Tag>
              </Col>
            </Row>
          </div>

          {/* Test Results */}
          {result?.blood && Object.keys(result.blood).some(key => result.blood[key] !== null && result.blood[key] !== undefined) && (
            createTestTable(result.blood, 'Xét nghiệm máu')
          )}

          {result?.swab && Object.keys(result.swab).some(key => 
            result.swab[key] !== null && result.swab[key] !== undefined && 
            (typeof result.swab[key] !== 'object' || (Array.isArray(result.swab[key]) && result.swab[key].length > 0))
          ) && (
            createTestTable(result.swab, 'Xét nghiệm swab')
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

// Component để thay thế trong modal "Xem kết quả"
// Thay thế phần này trong StiResultsManagement:

/*
<Modal
  open={viewResultModalVisible}
  onCancel={() => setViewResultModalVisible(false)}
  footer={null}
  width={600}
  title="Kết quả xét nghiệm"
>
  {viewResult ? (
    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(viewResult, null, 2)}</pre>
  ) : null}
</Modal>
*/

// Thành:

/*
<Modal
  open={viewResultModalVisible}
  onCancel={() => setViewResultModalVisible(false)}
  footer={null}
  width={1000}
  title="Kết quả xét nghiệm"
>
  {viewResult ? (
    <StiResultDisplay resultData={viewResult} />
  ) : null}
</Modal>
*/

export default StiResultDisplay;