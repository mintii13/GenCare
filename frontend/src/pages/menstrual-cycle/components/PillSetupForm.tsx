import React, { useState } from 'react';
import { SetupPillTrackingRequest } from '../../../services/pillTrackingService';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

interface PillSetupFormProps {
  onSubmit: (data: SetupPillTrackingRequest) => Promise<any>;
  isLoading: boolean;
  latestPeriodStart?: string; // ISO date string
}

const PillSetupForm: React.FC<PillSetupFormProps> = ({ onSubmit, isLoading, latestPeriodStart }) => {
  const { user } = useAuth();
  const [pillType, setPillType] = useState<'21-day' | '24+4' | '21+7'>('21+7');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Bạn cần đăng nhập để thực hiện chức năng này.");
      return;
    }

    // Front-end validation: must be within 5 days from first period day
    if (latestPeriodStart) {
      const startDate = new Date(latestPeriodStart);
      const diffDays = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 5) {
        toast.error('Bạn chỉ có thể bắt đầu uống thuốc trong 5 ngày đầu chu kỳ.');
        return;
      }
    }

    const requestData: SetupPillTrackingRequest = {
      userId: user.id,
      pill_type: pillType,
      pill_start_date: new Date().toISOString(), // Automatically set to current date
      reminder_time: reminderTime,
      reminder_enabled: reminderEnabled,
      max_reminder_times: reminderEnabled ? 3 : 0,
      reminder_interval: reminderEnabled ? 30 : 0,
    };

    try {
      await onSubmit(requestData);
      toast.success('Đã thiết lập lịch uống thuốc thành công!');
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message || '';
      const message = rawMessage.includes('cannot drink pill')
        ? 'Bạn không thể bắt đầu uống thuốc khi ngày đầu của chu kỳ kinh nguyệt đã qua hơn 5 ngày.'
        : rawMessage || 'Thiết lập thất bại. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Thiết lập Lịch uống thuốc</CardTitle>
        <CardDescription>
          Chọn loại thuốc và giờ uống hàng ngày. Lịch sẽ bắt đầu từ hôm nay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pill-type">Loại thuốc tránh thai</Label>
            <Select onValueChange={(value: '21-day' | '24+4' | '21+7') => setPillType(value)} defaultValue={pillType}>
              <SelectTrigger id="pill-type">
                <SelectValue placeholder="Chọn loại thuốc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="21+7">Vỉ 28 viên (21 viên hormone, 7 viên giả dược)</SelectItem>
                <SelectItem value="24+4">Vỉ 28 viên (24 viên hormone, 4 viên giả dược)</SelectItem>
                <SelectItem value="21-day">Vỉ 21 viên (chỉ có hormone)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Giờ uống thuốc hàng ngày</Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReminderTime(e.target.value)}
              required
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <Label htmlFor="reminder-enabled" className="font-medium text-gray-700">Bật nhắc nhở uống thuốc</Label>
            <Switch
              id="reminder-enabled"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0"/>
            <p className="text-sm text-gray-700">
              Lịch uống thuốc của bạn sẽ được tạo dựa trên chu kỳ kinh nguyệt gần nhất. Bạn chỉ có thể tạo lịch trong vòng 5 ngày đầu tiên của chu kỳ.
            </p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Bắt đầu theo dõi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PillSetupForm; 