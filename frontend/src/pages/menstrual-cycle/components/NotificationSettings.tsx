import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { FaBell, FaCog, FaSave, FaCheck, FaExclamationTriangle, FaChartBar, FaLightbulb, FaBullseye } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

interface NotificationSettingsProps {
  onRefresh: () => void;
}

interface NotificationSettings {
  notification_enabled: boolean;
  notification_types: string[];
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onRefresh }) => {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState<string[]>(['period', 'ovulation']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const notificationOptions = [
    {
      id: 'period',
      label: 'Kinh nguyệt',
      description: 'Nhắc nhở khi chu kì kinh nguyệt sắp đến',

      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'ovulation',
      label: 'Rụng trứng',
      description: 'Thông báo ngày rụng trứng dự đoán',

      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'fertile_start',
      label: 'Bắt đầu cửa sổ sinh sản',
      description: 'Thông báo khi bắt đầu giai đoạn có thể thụ thai',

      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'fertile_end',
      label: 'Kết thúc cửa sổ sinh sản',
      description: 'Thông báo khi kết thúc giai đoạn có thể thụ thai',
      icon: '🌿',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
  ];

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setInitialLoading(true);

      const savedSettings = localStorage.getItem('gencare_notification_settings');
      if (savedSettings) {
        const settings: NotificationSettings = JSON.parse(savedSettings);
        setNotificationEnabled(settings.notification_enabled);
        setNotificationTypes(settings.notification_types);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleNotificationTypeChange = (typeId: string, enabled: boolean) => {
    setNotificationTypes(prev => {
      if (enabled && !prev.includes(typeId)) {
        return [...prev, typeId];
      } else if (!enabled && prev.includes(typeId)) {
        return prev.filter(type => type !== typeId);
      }
      return prev;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const settings: NotificationSettings = {
        notification_enabled: notificationEnabled,
        notification_types: notificationTypes
      };

      localStorage.setItem('gencare_notification_settings', JSON.stringify(settings));

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Đã cập nhật cài đặt thông báo thành công!');
      onRefresh();
    } catch (error) {
      
      toast.error('Lỗi khi cập nhật cài đặt');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
              <FaBell className="h-5 w-5" />
            </div>
            Cài Đặt Thông Báo
          </CardTitle>
          <CardDescription className="text-white/90">
            Quản lý các thông báo cho chu kì kinh nguyệt của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
            <div className="flex-1">
              <Label htmlFor="master-notifications" className="text-base font-semibold text-gray-800 cursor-pointer">
                🔔 Bật thông báo chung
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Cho phép ứng dụng gửi thông báo về chu kì kinh nguyệt
              </p>
            </div>
            <Switch
              id="master-notifications"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-purple-600"
            />
          </div>

          {/* Notification Types */}
          {notificationEnabled && (
            <div className="space-y-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold text-gray-900">Loại thông báo:</h4>
              </div>
              
              <div className="grid gap-4">
                {notificationOptions.map((option) => {
                  const isChecked = notificationTypes.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 ${
                        isChecked 
                          ? `${option.borderColor} ${option.bgColor} shadow-md scale-[1.02]` 
                          : 'border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`text-2xl p-2 rounded-lg ${isChecked ? option.bgColor : 'bg-gray-100'} transition-all duration-200`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <Label 
                            htmlFor={option.id} 
                            className={`font-medium cursor-pointer transition-colors duration-200 ${
                              isChecked ? option.color : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </Label>
                          <p className={`text-sm mt-1 transition-colors duration-200 ${
                            isChecked ? 'text-gray-700' : 'text-gray-600'
                          }`}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <Switch
                          id={option.id}
                          checked={isChecked}
                          onCheckedChange={(checked: boolean) => 
                            handleNotificationTypeChange(option.id, checked)
                          }
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-purple-600"
                        />
                        {isChecked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                            <FaCheck className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {notificationTypes.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <FaExclamationTriangle className="inline text-red-500 mr-2" />
                  Bạn chưa chọn loại thông báo nào. Hãy chọn ít nhất một loại để nhận thông báo.
                </div>
              )}
            </div>
          )}

          {/* Settings Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <FaChartBar className="inline mr-2" />
              Tóm tắt cài đặt:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${notificationEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-blue-700">
                  Thông báo chung: <strong>{notificationEnabled ? 'Đã bật' : 'Đã tắt'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${notificationTypes.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-blue-700">
                  Đã chọn: <strong>{notificationTypes.length}</strong> loại thông báo
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  Lưu cài đặt
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-500 via-slate-600 to-gray-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
              <FaCog className="h-5 w-5" />
            </div>
            Quyền riêng tư & Dữ liệu
          </CardTitle>
          <CardDescription className="text-white/90">
            Thông tin về cách chúng tôi bảo vệ dữ liệu của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Security Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">🔒</span>
                  </div>
                  <h4 className="font-semibold text-green-800">Bảo mật dữ liệu</h4>
                </div>
                <p className="text-sm text-green-700">
                  Tất cả dữ liệu chu kì kinh nguyệt của bạn được mã hóa và lưu trữ an toàn trên thiết bị. 
                  Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">
                    <FaChartBar />
                  </span>
                  </div>
                  <h4 className="font-semibold text-blue-800">Sử dụng dữ liệu</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Dữ liệu của bạn chỉ được sử dụng để tính toán chu kì, cung cấp dự đoán và thống kê sức khỏe cá nhân.
                </p>
              </div>
            </div>

            {/* Features Overview */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">
                <FaLightbulb className="inline mr-2" />
                Dữ liệu được sử dụng để:
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Tính toán và dự đoán chu kì kinh nguyệt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Cung cấp thống kê sức khỏe sinh sản</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Gửi thông báo nhắc nhở (nếu được bật)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Cải thiện độ chính xác của dự đoán</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-amber-600 text-lg">
                    <FaExclamationTriangle />
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Lưu ý quan trọng</h4>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    GenCare là ứng dụng hỗ trợ theo dõi chu kì kinh nguyệt và chỉ mang tính chất tham khảo. 
                    Ứng dụng không thay thế cho ý kiến chuyên môn của bác sĩ. Hãy tham khảo ý kiến bác sĩ phụ khoa 
                    nếu có bất kỳ thắc mắc nào về sức khỏe sinh sản của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Information Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-b from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-pink-600 text-xl">🔐</span>
                </div>
                <h5 className="font-semibold text-pink-800 mb-2">Riêng tư 100%</h5>
                <p className="text-xs text-pink-700">Dữ liệu được lưu trữ cục bộ và được mã hóa</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 text-xl">
                    <FaBullseye />
                  </span>
                </div>
                <h5 className="font-semibold text-purple-800 mb-2">Dự đoán chính xác</h5>
                <p className="text-xs text-purple-700">Thuật toán học máy cải thiện theo thời gian</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">📱</span>
                </div>
                <h5 className="font-semibold text-blue-800 mb-2">Dễ sử dụng</h5>
                <p className="text-xs text-blue-700">Giao diện thân thiện và trực quan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings; 