import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { PillSchedule, UpdatePillTrackingRequest } from '../../../services/pillTrackingService';
import { toast } from 'react-hot-toast';

interface PillSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: UpdatePillTrackingRequest) => Promise<any>;
  onCreate?: (data: any) => Promise<any>;
  onTestReminder?: () => Promise<any>;
  currentSchedule?: PillSchedule;
  isLoading: boolean;
}

const PillSettingsModal: React.FC<PillSettingsModalProps> = ({ isOpen, onClose, onUpdate, onCreate, onTestReminder, currentSchedule, isLoading }) => {
  const [pillType, setPillType] = useState(currentSchedule?.pill_type || '21+7');
  const [reminderTime, setReminderTime] = useState(currentSchedule?.reminder_time || '08:00');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(currentSchedule?.reminder_enabled ?? true);

  // Update state when the modal is opened with new props
  useEffect(() => {
    if (currentSchedule) {
      setPillType(currentSchedule.pill_type);
      setReminderTime(currentSchedule.reminder_time);
      setReminderEnabled(currentSchedule.reminder_enabled || true);
    } else {
      // Default values when no schedule exists
      setPillType('21+7');
      setReminderTime('08:00');
      setReminderEnabled(true);
    }
  }, [currentSchedule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: UpdatePillTrackingRequest = {};
    if (pillType !== currentSchedule?.pill_type) updatedData.pill_type = pillType;
    if (reminderTime !== currentSchedule?.reminder_time) updatedData.reminder_time = reminderTime;
    if (reminderEnabled !== currentSchedule?.reminder_enabled) updatedData.reminder_enabled = reminderEnabled;

    if (Object.keys(updatedData).length === 0) {
      toast.error('Không có gì để thay đổi.');
      onClose();
      return;
    }

    try {
      if (!currentSchedule && onCreate) {
        // Create new schedule if none exists
        const createData = {
          userId: '', // Will be filled by the service
          pill_type: pillType,
          pill_start_date: new Date().toISOString(),
          reminder_time: reminderTime,
          reminder_enabled: reminderEnabled,
        };
        await onCreate(createData);
        toast.success('Tạo lịch uống thuốc thành công!');
      } else {
        // Update existing schedule
        await onUpdate(updatedData);
        toast.success('Cập nhật cài đặt thành công!');
      }
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Thao tác thất bại.';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Cài đặt lịch uống thuốc</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pill-type-modal">Loại thuốc tránh thai</Label>
            <Select onValueChange={(value: '21-day' | '24+4' | '21+7') => setPillType(value)} value={pillType}>
              <SelectTrigger id="pill-type-modal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="21+7">Vỉ 28 viên (21+7)</SelectItem>
                <SelectItem value="24+4">Vỉ 28 viên (24+4)</SelectItem>
                <SelectItem value="21-day">Vỉ 21 viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-time-modal">Giờ uống thuốc hàng ngày</Label>
            <Input
              id="reminder-time-modal"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <Label htmlFor="reminder-enabled-modal" className="font-medium">Bật nhắc nhở</Label>
            <Switch
              id="reminder-enabled-modal"
              checked={reminderEnabled}
              onCheckedChange={(checked) => setReminderEnabled(checked)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-4">
            {onTestReminder && currentSchedule && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={async () => {
                  try {
                    await onTestReminder();
                    toast.success('Đã gửi mail test!');
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || 'Lỗi khi gửi mail test');
                  }
                }}
                disabled={isLoading}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Test Mail
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PillSettingsModal; 