import React from 'react';
import { Button, Typography, Checkbox, Card, Divider, Space, Alert, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined, CheckCircleOutlined, SafetyOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const LicensePage: React.FC = () => {
  const [checked, setChecked] = React.useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (checked) {
      navigate('/sti-booking/new/select');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#1890ff', textAlign: 'center', marginBottom: '32px' }}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ XÉT NGHIỆM STI
        </Title>

        <Alert
          message="THÔNG BÁO QUAN TRỌNG"
          description="Bằng việc đồng ý với các điều khoản dưới đây, Quý khách xác nhận đã đọc, hiểu rõ và chấp nhận toàn bộ các quy định pháp lý liên quan đến dịch vụ xét nghiệm STI."
          type="warning"
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
                    NGHĨA VỤ CỦA KHÁCH HÀNG
                  </Title>
                }
                style={{ height: '100%' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  
                                     <div>
                     <Title level={5}>1. Cung cấp thông tin chính xác</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Khách hàng cam kết cung cấp đầy đủ, chính xác và trung thực các thông tin cá nhân bao gồm: họ tên, ngày sinh, giới tính, số điện thoại, địa chỉ, số CMND/CCCD, lịch sử bệnh lý, tiền sử dị ứng, thuốc đang sử dụng và các thông tin khác theo yêu cầu của phòng xét nghiệm.
                       <br />
                       • Khách hàng chịu hoàn toàn trách nhiệm về tính chính xác của thông tin đã cung cấp và hiểu rằng việc cung cấp thông tin sai lệch có thể gây hại cho sức khỏe của chính mình.
                       <br />
                       • Việc cung cấp thông tin sai lệch có thể dẫn đến kết quả xét nghiệm không chính xác, chẩn đoán sai, điều trị không phù hợp và các hậu quả nghiêm trọng khác cho sức khỏe.
                       <br />
                       • Khách hàng phải thông báo ngay lập tức cho phòng xét nghiệm nếu phát hiện thông tin đã cung cấp có sai sót hoặc thay đổi.
                     </Paragraph>
                   </div>

                                     <div>
                     <Title level={5}>2. Tuân thủ quy trình xét nghiệm</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Khách hàng phải tuân thủ nghiêm ngặt các hướng dẫn trước, trong và sau khi xét nghiệm theo quy định của phòng xét nghiệm.
                       <br />
                       • Khách hàng phải đến đúng giờ hẹn và mang theo giấy tờ tùy thân hợp lệ để xác minh danh tính.
                       <br />
                       • Khách hàng phải ký cam kết đồng ý thực hiện xét nghiệm trước khi tiến hành.
                       <br />
                       • Quy trình xét nghiệm chi tiết bao gồm: 
                         <br />
                         - Bước 1: Đăng ký và chờ xử lý - Khách hàng đăng ký xét nghiệm và hệ thống xác minh thông tin
                         <br />
                         - Bước 2: Xác nhận đơn hàng - Phòng xét nghiệm xác nhận và lên lịch hẹn
                         <br />
                         - Bước 3: Tiến hành xét nghiệm - Khách hàng đến phòng xét nghiệm theo lịch hẹn
                         <br />
                         - Bước 4: Thu thập mẫu - Nhân viên y tế thu thập mẫu xét nghiệm theo quy trình chuẩn
                         <br />
                         - Bước 5: Thực hiện phân tích - Mẫu được phân tích trong phòng thí nghiệm với thiết bị hiện đại
                         <br />
                         - Bước 6: Hoàn thành và trả kết quả - Kết quả được kiểm tra, xác nhận và gửi cho khách hàng
                     </Paragraph>
                   </div>

                                     <div>
                     <Title level={5}>3. Bảo mật thông tin</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Khách hàng không được chia sẻ, phát tán, sao chép, chụp ảnh, ghi âm hoặc sử dụng thông tin xét nghiệm của người khác dưới bất kỳ hình thức nào.
                       <br />
                       • Khách hàng phải bảo vệ thông tin đăng nhập tài khoản, mật khẩu, mã OTP và không được để lộ cho bên thứ ba, kể cả người thân trong gia đình.
                       <br />
                       • Khách hàng chịu trách nhiệm hoàn toàn về việc sử dụng tài khoản của mình và các hoạt động diễn ra trên tài khoản đó.
                       <br />
                       • Khách hàng phải đăng xuất khỏi tài khoản sau khi sử dụng xong và không được lưu thông tin đăng nhập trên thiết bị công cộng.
                       <br />
                       • Khách hàng phải thông báo ngay lập tức cho phòng xét nghiệm nếu phát hiện tài khoản bị xâm nhập trái phép.
                     </Paragraph>
                   </div>

                                     <div>
                     <Title level={5}>4. Thanh toán phí dịch vụ</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Khách hàng phải thanh toán đầy đủ phí dịch vụ xét nghiệm theo bảng giá đã công bố và có hiệu lực tại thời điểm đặt lịch.
                       <br />
                       • Phí dịch vụ bao gồm: phí xét nghiệm, phí thu mẫu, phí phân tích, phí trả kết quả và các phí phát sinh khác (nếu có).
                       <br />
                       • Phí dịch vụ phải được thanh toán trước hoặc tại thời điểm thực hiện xét nghiệm theo phương thức thanh toán được chấp nhận.
                       <br />
                       • Khách hàng không được từ chối thanh toán sau khi đã sử dụng dịch vụ hoặc đã ký cam kết thực hiện xét nghiệm.
                       <br />
                       • Trong trường hợp khách hàng hủy đơn hàng, phí hoàn trả sẽ được tính theo chính sách hủy đơn của phòng xét nghiệm.
                     </Paragraph>
                   </div>

                                     <div>
                     <Title level={5}>5. Chấp nhận rủi ro</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Khách hàng hiểu rõ và chấp nhận các rủi ro có thể xảy ra trong quá trình xét nghiệm bao gồm: đau nhẹ khi lấy mẫu, chảy máu nhẹ, nhiễm trùng tại vị trí lấy mẫu, phản ứng dị ứng với thuốc gây tê (nếu có), và các rủi ro khác liên quan đến thủ thuật y tế.
                       <br />
                       • Khách hàng không được khiếu nại về các rủi ro đã được thông báo trước và đã được giải thích đầy đủ bởi nhân viên y tế.
                       <br />
                       • Khách hàng phải tuân thủ nghiêm ngặt các hướng dẫn an toàn trong quá trình lấy mẫu và sau khi lấy mẫu.
                       <br />
                       • Khách hàng phải thông báo ngay lập tức cho nhân viên y tế nếu gặp bất kỳ triệu chứng bất thường nào sau khi lấy mẫu.
                       <br />
                       • Khách hàng hiểu rằng kết quả xét nghiệm có thể âm tính giả hoặc dương tính giả do nhiều yếu tố khách quan và chủ quan.
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
                     CHÍNH SÁCH BẢO MẬT & CAM KẾT
                   </Title>
                }
                style={{ height: '100%' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  
                                     <div>
                     <Title level={5}>1. Bảo mật thông tin cá nhân</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng theo quy định của Luật An ninh mạng số 24/2018/QH14, Luật Bảo vệ quyền lợi người tiêu dùng số 59/2010/QH12 và các quy định pháp luật khác có liên quan.
                       <br />
                       • Thông tin cá nhân chỉ được sử dụng cho mục đích y tế, chẩn đoán, điều trị và không được chia sẻ với bên thứ ba mà không có sự đồng ý bằng văn bản của khách hàng, trừ trường hợp được pháp luật cho phép.
                       <br />
                       • Chúng tôi áp dụng các biện pháp bảo mật tiên tiến bao gồm: mã hóa dữ liệu, tường lửa, hệ thống phát hiện xâm nhập, kiểm soát truy cập, sao lưu dữ liệu định kỳ và các biện pháp khác để bảo vệ dữ liệu.
                       <br />
                       • Nhân viên của chúng tôi được đào tạo về bảo mật thông tin và ký cam kết bảo mật trước khi tiếp xúc với dữ liệu khách hàng.
                       <br />
                       • Chúng tôi có cơ chế giám sát và kiểm tra định kỳ để đảm bảo tuân thủ các quy định về bảo mật thông tin.
                     </Paragraph>
                   </div>

                                     <div>
                     <Title level={5}>2. Chất lượng dịch vụ</Title>
                     <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                       • Chúng tôi cam kết thực hiện xét nghiệm theo đúng quy trình và tiêu chuẩn y tế được Bộ Y tế công nhận, tuân thủ các quy định của Thông tư 49/2018/TT-BYT về quy trình xét nghiệm y tế.
                       <br />
                       • Kết quả xét nghiệm được thực hiện bởi đội ngũ chuyên môn có chứng chỉ hành nghề hợp lệ, được đào tạo chuyên sâu và có kinh nghiệm trong lĩnh vực xét nghiệm STI.
                       <br />
                       • Chúng tôi đảm bảo độ chính xác và độ tin cậy của kết quả xét nghiệm thông qua việc sử dụng thiết bị hiện đại, thuốc thử chất lượng cao và quy trình kiểm soát chất lượng nghiêm ngặt.
                       <br />
                       • Phòng xét nghiệm của chúng tôi được cấp phép hoạt động và đạt tiêu chuẩn ISO 15189 về năng lực phòng xét nghiệm y tế.
                       <br />
                       • Chúng tôi thực hiện kiểm tra chất lượng nội bộ và tham gia chương trình kiểm tra chất lượng ngoại kiểm định kỳ để đảm bảo độ chính xác của kết quả.
                     </Paragraph>
                   </div>

                  <div>
                    <Title level={5}>3. Quyền lợi khách hàng</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Khách hàng có quyền được tư vấn miễn phí về kết quả xét nghiệm.
                      <br />
                      • Khách hàng có quyền yêu cầu làm lại xét nghiệm nếu có nghi ngờ về kết quả.
                      <br />
                      • Khách hàng có quyền khiếu nại về chất lượng dịch vụ theo quy định.
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>4. Lưu trữ và truy vết</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Chúng tôi lưu trữ hồ sơ xét nghiệm theo quy định của pháp luật về y tế.
                      <br />
                      • Khách hàng có quyền truy cập và yêu cầu cung cấp thông tin về hồ sơ của mình.
                      <br />
                      • Chúng tôi có cơ chế audit log để đảm bảo tính minh bạch và có thể truy vết.
                    </Paragraph>
                  </div>

                  <div>
                    <Title level={5}>5. Bồi thường và trách nhiệm</Title>
                    <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      • Chúng tôi chịu trách nhiệm bồi thường nếu có sai sót do lỗi của phòng xét nghiệm.
                      <br />
                      • Mức bồi thường được xác định theo quy định của pháp luật và chính sách của công ty.
                      <br />
                      • Chúng tôi có bảo hiểm trách nhiệm nghề nghiệp để bảo vệ quyền lợi khách hàng.
                    </Paragraph>
                  </div>

                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Card title="CĂN CỨ PHÁP LÝ" style={{ marginTop: '24px' }}>
            <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <Text strong>1. Luật Khám bệnh, chữa bệnh số 40/2009/QH12</Text>
              <br />
              • Quy định về quyền và nghĩa vụ của người bệnh
              <br />
              • Quy định về bảo mật thông tin y tế
              <br />
              <br />
              <Text strong>2. Luật Bảo vệ quyền lợi người tiêu dùng số 59/2010/QH12</Text>
              <br />
              • Quy định về quyền được bảo vệ thông tin cá nhân
              <br />
              • Quy định về quyền khiếu nại và giải quyết tranh chấp
              <br />
              <br />
              <Text strong>3. Thông tư 49/2018/TT-BYT</Text>
              <br />
              • Quy định về quy trình xét nghiệm y tế
              <br />
              • Quy định về tiêu chuẩn chất lượng xét nghiệm
              <br />
              <br />
              <Text strong>4. Luật An ninh mạng số 24/2018/QH14</Text>
              <br />
              • Quy định về bảo vệ thông tin cá nhân trên môi trường mạng
              <br />
              • Quy định về trách nhiệm bảo mật dữ liệu
            </Paragraph>
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
                Tôi đã đọc kỹ, hiểu rõ và đồng ý với tất cả các điều khoản sử dụng dịch vụ xét nghiệm STI
              </Text>
            </Checkbox>

            <Space>
              <Button 
                size="large" 
                onClick={() => navigate('/test-packages')}
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
          message="LƯU Ý PHÁP LÝ"
          description="Bằng việc tích vào ô đồng ý, Quý khách xác nhận đã hiểu rõ và chấp nhận tất cả các điều khoản trên. Việc đồng ý này có giá trị pháp lý tương đương với chữ ký."
          type="warning"
          showIcon
          style={{ marginTop: '24px' }}
        />
      </Card>
    </div>
  );
};

export default LicensePage; 