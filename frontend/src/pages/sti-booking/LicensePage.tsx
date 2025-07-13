import React from 'react';
import { Button, Typography, Checkbox, Card, Divider, Space, Alert, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined, CheckCircleOutlined, SafetyOutlined, UserOutlined, FileTextOutlined, HeartOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const LicensePage: React.FC = () => {
  const [checked, setChecked] = React.useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (checked) {
      navigate('/sti-booking/book');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#1890ff', textAlign: 'center', marginBottom: '32px' }}>
          <HeartOutlined style={{ marginRight: '8px' }} />
          CAM KẾT DỊCH VỤ XÉT NGHIỆM STI
        </Title>

        <Alert
          message="THÔNG TIN QUAN TRỌNG"
          description="Chúng tôi cam kết cung cấp dịch vụ xét nghiệm STI chất lượng cao, bảo mật và tin cậy. Vui lòng đọc kỹ các thông tin dưới đây trước khi đặt lịch."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '20px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Title level={4} style={{ color: '#1890ff', margin: 0 }}>
                    <UserOutlined style={{ marginRight: '8px' }} />
                    CAM KẾT CỦA KHÁCH HÀNG
                  </Title>
                }
                style={{ height: '100%' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  
                  <div>
                    <Title level={5}>1. Thông tin chính xác</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Cung cấp thông tin cá nhân đầy đủ và chính xác (họ tên, ngày sinh, số điện thoại, địa chỉ)
                      <br />
                      • Thông báo tiền sử bệnh lý và thuốc đang sử dụng (nếu có)
                      <br />
                      • Cập nhật thông tin thay đổi kịp thời
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>2. Tuân thủ quy trình</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Đến đúng giờ hẹn và mang theo giấy tờ tùy thân
                      <br />
                      • Tuân thủ hướng dẫn chuẩn bị trước xét nghiệm
                      <br />
                      • Hợp tác với nhân viên y tế trong quá trình lấy mẫu
                      <br />
                      • Quy trình gồm 6 bước: Đăng ký → Xác nhận → Lấy mẫu → Phân tích → Kiểm tra → Trả kết quả
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>3. Thanh toán</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Thanh toán đầy đủ theo bảng giá hiện hành
                      <br />
                      • Phí bao gồm: xét nghiệm, lấy mẫu, phân tích, trả kết quả
                      <br />
                      • Hủy đơn theo chính sách hoàn trả của phòng xét nghiệm
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>4. Hiểu rõ rủi ro</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Chấp nhận rủi ro nhỏ: đau nhẹ, chảy máu nhẹ khi lấy mẫu
                      <br />
                      • Kết quả có thể có sai số do yếu tố khách quan
                      <br />
                      • Thông báo ngay nếu có triệu chứng bất thường
                    </Paragraph>
                  </div>

                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                    <SafetyOutlined style={{ marginRight: '8px' }} />
                    CAM KẾT CỦA CHÚNG TÔI
                  </Title>
                }
                style={{ height: '100%' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  
                  <div>
                    <Title level={5}>1. Bảo mật tuyệt đối</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Bảo mật thông tin cá nhân theo Luật An ninh mạng
                      <br />
                      • Chỉ sử dụng thông tin cho mục đích y tế
                      <br />
                      • Hệ thống mã hóa và bảo mật tiên tiến
                      <br />
                      • Nhân viên ký cam kết bảo mật
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>2. Chất lượng đảm bảo</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Tuân thủ tiêu chuẩn Bộ Y tế và ISO 15189
                      <br />
                      • Đội ngũ chuyên môn có chứng chỉ hành nghề
                      <br />
                      • Thiết bị hiện đại, thuốc thử chất lượng cao
                      <br />
                      • Kiểm soát chất lượng nghiêm ngặt
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>3. Quyền lợi khách hàng</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Tư vấn miễn phí về kết quả xét nghiệm
                      <br />
                      • Quyền yêu cầu làm lại nếu có nghi ngờ
                      <br />
                      • Quyền khiếu nại và giải quyết tranh chấp
                      <br />
                      • Hỗ trợ 24/7 qua hotline
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>4. Minh bạch và trách nhiệm</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Lưu trữ hồ sơ theo quy định pháp luật
                      <br />
                      • Cơ chế truy vết và audit log đầy đủ
                      <br />
                      • Bồi thường nếu có sai sót do lỗi của chúng tôi
                      <br />
                      • Bảo hiểm trách nhiệm nghề nghiệp
                    </Paragraph>
                  </div>

                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Card title="CĂN CỨ PHÁP LÝ" style={{ marginTop: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <Text strong>• Luật Khám bệnh, chữa bệnh số 40/2009/QH12</Text>
                  <br />
                  <Text strong>• Luật Bảo vệ quyền lợi người tiêu dùng số 59/2010/QH12</Text>
                </Paragraph>
              </Col>
              <Col xs={24} sm={12}>
                <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <Text strong>• Thông tư 49/2018/TT-BYT về quy trình xét nghiệm</Text>
                  <br />
                  <Text strong>• Luật An ninh mạng số 24/2018/QH14</Text>
                </Paragraph>
              </Col>
            </Row>
          </Card>

        </div>

        <Divider />

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Checkbox 
              checked={checked} 
              onChange={e => setChecked(e.target.checked)}
              style={{ fontSize: '16px' }}
            >
              <Text strong>
                Tôi đã đọc, hiểu và đồng ý với các cam kết dịch vụ xét nghiệm STI
              </Text>
            </Checkbox>

            <Space>
              <Button 
                size="large" 
                onClick={() => navigate(-1)}
                style={{ minWidth: '120px' }}
              >
                Quay lại
              </Button>
              <Button 
                type="primary" 
                size="large"
                disabled={!checked} 
                onClick={handleContinue}
                icon={<CheckCircleOutlined />}
                style={{ 
                  minWidth: '120px',
                  backgroundColor: checked ? '#1890ff' : '#d9d9d9',
                  borderColor: checked ? '#1890ff' : '#d9d9d9'
                }}
              >
                Đồng ý và tiếp tục
              </Button>
            </Space>
          </Space>
        </div>

        <Alert
          message="LƯU Ý"
          description="Việc đồng ý này xác nhận bạn đã hiểu rõ quy trình và cam kết của dịch vụ xét nghiệm STI. Chúng tôi luôn sẵn sàng hỗ trợ bạn trong suốt quá trình sử dụng dịch vụ."
          type="success"
          showIcon
          style={{ marginTop: '24px' }}
        />
      </Card>
    </div>
  );
};

export default LicensePage; 