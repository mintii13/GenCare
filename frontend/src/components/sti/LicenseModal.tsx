import React, { useState } from 'react';
import { Modal, Typography, Checkbox, Card, Divider, Space, Alert, Button } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface LicenseModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
  title?: string;
}

const LicenseModal: React.FC<LicenseModalProps> = ({
  visible,
  onAccept,
  onCancel,
  title = "Điều khoản sử dụng dịch vụ xét nghiệm STI"
}) => {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (checked) {
      onAccept();
    }
  };

  const handleCancel = () => {
    setChecked(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
          <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
          {title}
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      centered
      maskClosable={false}
      closable={false}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Alert
          message="Thông tin quan trọng"
          description="Vui lòng đọc kỹ toàn bộ điều khoản trước khi đồng ý và tiếp tục đặt lịch xét nghiệm STI."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Card style={{ marginBottom: '16px' }}>
          <div style={{ padding: '16px' }}>
            
            <Title level={4}>1. Xác minh danh tính và bảo mật thông tin</Title>
            <Paragraph>
              • Mỗi xét nghiệm phải gắn liền với một bệnh nhân có danh tính rõ ràng và được bảo mật thông tin theo quy định của Luật sửa đổi 15/2023/QH15 tại Việt Nam.
              <br />
              • Trước khi lấy mẫu, chúng tôi sẽ xác minh danh tính bệnh nhân và loại mẫu cần lấy.
              <br />
              • Thông tin cá nhân của bạn sẽ được bảo mật tuyệt đối và chỉ được sử dụng cho mục đích y tế.
            </Paragraph>

            <Divider />

            <Title level={4}>2. Quy trình xét nghiệm</Title>
            <Paragraph>
              • Mỗi xét nghiệm chỉ được thực hiện nếu có đơn yêu cầu hợp lệ từ bác sĩ hoặc từ quy trình tự đăng ký đã xác minh (theo Thông tư 49/2018/TT/BYT).
              <br />
              • Quy trình xét nghiệm bao gồm: Đăng ký và chờ xử lý, Xác nhận đơn hàng, Tiến hành xét nghiệm, Thu thập mẫu, Thực hiện phân tích, Hoàn thành và trả kết quả.
              <br />
              • Đơn hàng có thể bị hủy ở bất kỳ giai đoạn nào trước khi hoàn thành.
            </Paragraph>

            <Divider />

            <Title level={4}>3. Cam kết và đồng ý</Title>
            <Paragraph>
              • Đối với xét nghiệm STI, bệnh nhân phải ký cam kết hoặc đồng ý trước khi thực hiện.
              <br />
              • Nếu bạn dưới 18 tuổi, cần có sự chấp nhận từ người giám hộ hợp pháp.
              <br />
              • Bạn cam kết cung cấp thông tin chính xác và đầy đủ.
            </Paragraph>

            <Divider />

            <Title level={4}>4. Kết quả xét nghiệm</Title>
            <Paragraph>
              • Kết quả xét nghiệm phải được ký xác nhận bởi người có chứng chỉ hành nghề phù hợp.
              <br />
              • <Text strong style={{ color: '#ff4d4f' }}>Không được thay đổi thông tin mẫu hoặc kết quả sau khi đã xác nhận.</Text>
              <br />
              • Kết quả sẽ được gửi qua email hoặc thông báo trong ứng dụng.
            </Paragraph>

            <Divider />

            <Title level={4}>5. Lưu trữ và truy vết</Title>
            <Paragraph>
              • Chúng tôi có cơ chế ghi lại lịch sử các thao tác để đảm bảo tính pháp lý và truy vết minh bạch.
              <br />
              • Dữ liệu sẽ được lưu trữ theo quy định của pháp luật Việt Nam.
              <br />
              • Bạn có quyền yêu cầu xem lịch sử xét nghiệm của mình.
            </Paragraph>

            <Divider />

            <Title level={4}>6. Hủy đơn hàng</Title>
            <Paragraph>
              • Đơn đã ở trạng thái "Canceled" thì không được sử dụng lại ở bất kỳ trường hợp nào.
              <br />
              • Bạn có thể hủy đơn hàng trước khi mẫu được thu thập.
              <br />
              • Sau khi mẫu được thu thập, việc hủy đơn sẽ tuân theo quy định của phòng xét nghiệm.
            </Paragraph>

            <Divider />

            <Title level={4}>7. Trách nhiệm</Title>
            <Paragraph>
              • Bạn chịu trách nhiệm về tính chính xác của thông tin cung cấp.
              <br />
              • Chúng tôi cam kết thực hiện xét nghiệm theo đúng quy trình và tiêu chuẩn y tế.
              <br />
              • Mọi tranh chấp sẽ được giải quyết theo pháp luật Việt Nam.
            </Paragraph>

          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Checkbox 
              checked={checked} 
              onChange={e => setChecked(e.target.checked)}
              style={{ fontSize: '16px' }}
            >
              <Text strong>
                Tôi đã đọc kỹ và đồng ý với tất cả các điều khoản sử dụng dịch vụ xét nghiệm STI
              </Text>
            </Checkbox>

            <Space>
              <Button 
                size="large" 
                onClick={handleCancel}
                style={{ minWidth: '120px' }}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="primary" 
                size="large"
                disabled={!checked} 
                onClick={handleAccept}
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
          message="Lưu ý"
          description="Bằng việc tích vào ô đồng ý, bạn xác nhận rằng mình đã hiểu rõ và chấp nhận tất cả các điều khoản trên."
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </div>
    </Modal>
  );
};

export default LicenseModal; 