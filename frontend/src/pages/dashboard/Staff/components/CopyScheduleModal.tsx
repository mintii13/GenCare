import React, { useState } from 'react';
import { Modal, DatePicker, Button, Form, Alert } from 'antd';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { toast } from 'react-toastify';
import { weeklyScheduleService } from '@/services/weeklyScheduleService';
import { format, startOfWeek } from 'date-fns';

interface CopyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceScheduleId: string | null;
}

const CopyScheduleModal: React.FC<CopyScheduleModalProps> = ({ isOpen, onClose, onSuccess, sourceScheduleId }) => {
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Luôn chọn ngày thứ 2 của tuần đó
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      setTargetDate(monday);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!targetDate) {
      setError("Vui lòng chọn một ngày trong tuần muốn sao chép đến.");
      return;
    }

    if (!sourceScheduleId) {
      setError("Lỗi: Không tìm thấy lịch gốc để sao chép.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = format(targetDate, 'yyyy-MM-dd');
      const response = await weeklyScheduleService.copySchedule(sourceScheduleId, formattedDate);

      if (response.success) {
        toast.success("Sao chép lịch thành công!");
        onSuccess();
      } else {
        setError(response.message || "Không thể sao chép lịch. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Vô hiệu hóa các ngày không phải là thứ 2
  const isNotMonday = (day: Date): boolean => {
      return day.getDay() !== 1;
  }

  return (
    <Modal
      title="Sao chép Lịch làm việc"
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      footer={[
        <Button key="back" onClick={onClose} disabled={loading}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Sao chép
        </Button>,
      ]}
    >
      <div className="flex flex-col items-center justify-center">
          <p className="mb-4 text-center">Chọn một ngày bất kỳ trong tuần bạn muốn sao chép lịch đến. Hệ thống sẽ tự động chọn ngày Thứ 2 của tuần đó.</p>
          <DayPicker
              mode="single"
              selected={targetDate}
              onSelect={handleDateSelect}
              showOutsideDays
              fixedWeeks
          />
          {targetDate && (
              <p className="mt-2 font-semibold">
                  Lịch sẽ được tạo cho tuần bắt đầu từ: {format(targetDate, 'dd/MM/yyyy')}
              </p>
          )}
          {error && <Alert message={error} type="error" showIcon className="mt-4 w-full" />}
      </div>
    </Modal>
  );
};

export default CopyScheduleModal;