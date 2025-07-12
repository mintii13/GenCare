import React from "react";
import ImportantNotes from "./components/ImportantNotes";
import StiTestList from "./StiTestList";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import PageTransition from '../../components/PageTransition';

const terms = [
  { text: "Bạn phải đồng ý với các điều khoản trước khi đặt lịch xét nghiệm." },
  { text: "Các gói xét nghiệm chỉ dành cho khách hàng (customer)." },
  { text: "Vui lòng đọc kỹ thông tin trước khi xác nhận." }
];

const SelectStiTestPage: React.FC = () => {
  const user = useAuth()?.user;
  const navigate = useNavigate();

  if (!user || user.role !== "customer") {
    return <Alert message="Chức năng này chỉ dành cho khách hàng." type="warning" showIcon />;
  }

};

export default SelectStiTestPage; 