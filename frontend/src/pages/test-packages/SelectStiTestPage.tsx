import React from "react";
import ImportantNotes from "./components/ImportantNotes";
import StiTestList from "./StiTestList";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import PageTransition from '../../components/PageTransition';

const terms = [
  { text: "Bạn có thể xem thông tin các gói xét nghiệm để tham khảo." },
  { text: "Để đặt lịch, vui lòng chọn 'Đặt lịch tư vấn' - bác sĩ sẽ tư vấn chọn gói phù hợp." },
  { text: "Vui lòng đọc kỹ thông tin trước khi đặt lịch tư vấn." }
];

const SelectStiTestPage: React.FC = () => {
  const user = useAuth()?.user;
  const navigate = useNavigate();

  if (!user || user.role !== "customer") {
    return <Alert message="Chức năng này chỉ dành cho khách hàng." type="warning" showIcon />;
  }

  const handleBookConsultation = () => {
    navigate('/sti-booking/book');
  };

  return (
    <PageTransition>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Thông báo quy trình mới */}
        <Alert
          message="Quy trình đặt lịch mới"
          description="Bạn đang xem thông tin tham khảo về các gói xét nghiệm STI. Để đặt lịch, vui lòng chọn 'Đặt lịch tư vấn' bên dưới. Bác sĩ sẽ tư vấn và giúp bạn chọn gói xét nghiệm phù hợp nhất khi bạn đến trung tâm."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <ImportantNotes title="Lưu ý quan trọng" notes={terms} />
        <StiTestList />
        
        {/* Button đặt lịch tư vấn */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleBookConsultation}
            style={{ minWidth: '200px' }}
          >
            Đặt lịch tư vấn STI
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default SelectStiTestPage; 