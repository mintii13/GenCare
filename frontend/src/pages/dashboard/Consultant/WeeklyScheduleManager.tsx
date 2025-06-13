import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';
import { weeklyScheduleService } from '../../../services/weeklyScheduleService';

interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
  _id?: string;  // MongoDB adds this field
}

interface WeeklyScheduleData {
  working_days: {
    monday?: WorkingDay;
    tuesday?: WorkingDay;
    wednesday?: WorkingDay;
    thursday?: WorkingDay;
    friday?: WorkingDay;
    saturday?: WorkingDay;
    sunday?: WorkingDay;
  };
  default_slot_duration: number;
  notes?: string;
}

interface Schedule {
  _id: string;
  consultant_id: string;
  week_start_date: string;
  week_end_date: string;
  working_days: {
    monday?: WorkingDay;
    tuesday?: WorkingDay;
    wednesday?: WorkingDay;
    thursday?: WorkingDay;
    friday?: WorkingDay;
    saturday?: WorkingDay;
    sunday?: WorkingDay;
  };
  default_slot_duration: number;
  notes?: string;
  created_by: {
    user_id: string;
    role: string;
    name: string;
  };
  created_date: string;
  updated_date: string;
}

const WeeklyScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData>({
    working_days: {},
    default_slot_duration: 30,
    notes: ''
  });
  const [existingSchedule, setExistingSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Check if current user is consultant (read-only) or staff (can edit)
  const isConsultant = user?.role === 'consultant';
  const canEdit = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    console.log('🔍 Fetching schedule for week:', format(currentWeek, 'yyyy-MM-dd (EEEE)', { locale: vi }));
    fetchScheduleForWeek();
  }, [currentWeek]);

  const fetchScheduleForWeek = async () => {
    try {
      setLoading(true);
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      
      // Sử dụng weeklyScheduleService thay vì fetch trực tiếp
      const response = await weeklyScheduleService.getMySchedules(weekStartDate, weekStartDate);
      
      console.log('📊 Backend response for my-schedules:', response);
      
      if (response.success && response.data && response.data.schedules && response.data.schedules.length > 0) {
        // Filter schedules for the exact week we're looking for
        const targetWeekStart = format(currentWeek, 'yyyy-MM-dd');
        const matchingSchedule = response.data.schedules.find((schedule: Schedule) => {
          const scheduleWeekStart = format(new Date(schedule.week_start_date), 'yyyy-MM-dd');
          return scheduleWeekStart === targetWeekStart;
        });

        if (matchingSchedule) {
          console.log('📅 Schedule found for this week:', matchingSchedule);
          setExistingSchedule(matchingSchedule);
          setScheduleData({
            working_days: matchingSchedule.working_days || {},
            default_slot_duration: matchingSchedule.default_slot_duration || 30,
            notes: matchingSchedule.notes || ''
          });
        } else {
          console.log('📅 No schedule found for this specific week');
          setExistingSchedule(null);
          setScheduleData({
            working_days: {},
            default_slot_duration: 30,
            notes: ''
          });
        }
      } else {
        console.log('📅 No schedules data from backend');
        // Reset to default if no schedule exists
        setExistingSchedule(null);
        setScheduleData({
          working_days: {},
          default_slot_duration: 30,
          notes: ''
        });
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tải lịch làm việc' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayName: string) => {
    setScheduleData(prev => ({
      ...prev,
      working_days: {
        ...prev.working_days,
        [dayName]: prev.working_days[dayName as keyof typeof prev.working_days]?.is_available 
          ? { ...prev.working_days[dayName as keyof typeof prev.working_days], is_available: false }
          : {
              start_time: '08:00',
              end_time: '17:00',
              break_start: '12:00',
              break_end: '13:00',
              is_available: true
            }
      }
    }));
  };

  const handleDayUpdate = (dayName: string, field: keyof WorkingDay, value: string | boolean) => {
    setScheduleData(prev => ({
      ...prev,
      working_days: {
        ...prev.working_days,
        [dayName]: {
          ...prev.working_days[dayName as keyof typeof prev.working_days]!,
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      
      // Ensure weekStartDate is a Monday
      const startDate = new Date(weekStartDate);
      const monday = new Date(startDate);
      const dayOfWeek = startDate.getDay();
      const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      monday.setDate(diff);
      
      // Clean working_days data - remove _id fields added by MongoDB
      const cleanWorkingDays = Object.entries(scheduleData.working_days).reduce((acc, [day, dayData]) => {
        if (dayData) {
          const { _id, ...cleanDayData } = dayData;
          acc[day] = cleanDayData;
        }
        return acc;
      }, {} as any);

      const requestData = {
        week_start_date: format(monday, 'yyyy-MM-dd'),
        working_days: cleanWorkingDays,
        default_slot_duration: scheduleData.default_slot_duration,
        notes: scheduleData.notes
      };

      console.log('📤 Sending request data:', requestData);
      console.log('🗓️ Current week (should be Monday):', format(currentWeek, 'yyyy-MM-dd (EEEE)', { locale: vi }));
      console.log('📅 Calculated Monday:', format(monday, 'yyyy-MM-dd (EEEE)', { locale: vi }));

      let response;
      if (existingSchedule) {
        // Update existing schedule
        response = await weeklyScheduleService.updateSchedule(existingSchedule._id, requestData);
      } else {
        // Create new schedule
        response = await weeklyScheduleService.createSchedule(requestData);
      }

      console.log('📨 Save response:', response);
      
      if (response.success) {
        setMessage({ type: 'success', text: existingSchedule ? 'Cập nhật lịch thành công!' : 'Tạo lịch thành công!' });
        fetchScheduleForWeek(); // Refresh data
      } else {
        setMessage({ type: 'error', text: response.message || 'Có lỗi xảy ra khi lưu lịch' });
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu lịch' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    if (!existingSchedule) return;
    
    try {
      setSaving(true);
      const targetWeekStart = format(addWeeks(currentWeek, 1), 'yyyy-MM-dd');
      
      const response = await weeklyScheduleService.copySchedule(existingSchedule._id, targetWeekStart);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Sao chép lịch thành công!' });
        setCurrentWeek(addWeeks(currentWeek, 1)); // Move to next week
      } else {
        setMessage({ type: 'error', text: response.message || 'Có lỗi xảy ra khi sao chép lịch' });
      }
    } catch (err) {
      console.error('Error copying schedule:', err);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi sao chép lịch' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {isConsultant ? 'Lịch Làm Việc Của Tôi' : 'Quản Lý Lịch Làm Việc'}
              </h1>
              <p className="text-gray-600">
                {isConsultant 
                  ? 'Xem lịch làm việc hàng tuần của bạn' 
                  : 'Thiết lập và quản lý lịch làm việc hàng tuần cho chuyên gia'
                }
              </p>
              {isConsultant && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Chế độ xem chuyên gia (chỉ đọc)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              ← Tuần trước
            </button>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                Tuần {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
              </h3>
              <p className="text-sm text-gray-600">
                {existingSchedule ? 'Đã có lịch làm việc' : 'Chưa có lịch làm việc'}
              </p>
            </div>
            
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              Tuần sau →
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Calendar View for Consultant or Schedule Form for Staff */}
        {isConsultant ? (
          /* Calendar View for Consultant (Read-only) */
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Lịch Làm Việc Của Bạn
            </h2>
            
            {existingSchedule ? (
              <div>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Thông tin chung</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Thời gian mỗi slot:</span> 
                      <span className="font-medium ml-2">{scheduleData.default_slot_duration} phút</span>
                    </div>
                    {scheduleData.notes && (
                      <div>
                        <span className="text-blue-700">Ghi chú:</span> 
                        <span className="font-medium ml-2">{scheduleData.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dayNames.map((dayName, index) => {
                    const dayData = scheduleData.working_days[dayName as keyof typeof scheduleData.working_days];
                    const isWorking = dayData?.is_available || false;
                    const dayDate = addDays(currentWeek, index);
                    
                    return (
                      <div key={dayName} className={`border-2 rounded-lg p-4 ${
                        isWorking 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="text-center mb-3">
                          <h3 className="font-semibold text-gray-800">{dayLabels[index]}</h3>
                          <p className="text-sm text-gray-600">
                            {format(dayDate, 'dd/MM')}
                          </p>
                        </div>

                        {isWorking && dayData ? (
                          <div className="space-y-2">
                            {/* Working Hours */}
                            <div className="bg-white rounded p-2 text-center">
                              <div className="flex items-center justify-center space-x-1 text-green-700">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                </svg>
                                <span className="font-medium text-sm">
                                  {dayData.start_time} - {dayData.end_time}
                                </span>
                              </div>
                            </div>

                            {/* Break Time */}
                            {dayData.break_start && dayData.break_end && (
                              <div className="bg-yellow-50 rounded p-2 text-center">
                                <div className="flex items-center justify-center space-x-1 text-yellow-700">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                  </svg>
                                  <span className="text-xs">
                                    Nghỉ: {dayData.break_start} - {dayData.break_end}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Available Status */}
                            <div className="text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Có thể làm việc
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              ✗ Không làm việc
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Thông tin lịch</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Được tạo bởi:</span> {existingSchedule.created_by.name}
                    </div>
                    <div>
                      <span className="font-medium">Ngày tạo:</span> {format(new Date(existingSchedule.created_date), 'dd/MM/yyyy HH:mm')}
                    </div>
                    <div>
                      <span className="font-medium">Cập nhật:</span> {format(new Date(existingSchedule.updated_date), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch làm việc</h3>
                <p className="text-gray-600">Tuần này chưa có lịch làm việc được thiết lập.</p>
                <p className="text-sm text-gray-500 mt-2">Liên hệ với staff để được thiết lập lịch làm việc.</p>
              </div>
            )}
          </div>
        ) : (
          /* Form View for Staff (Can Edit) */
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thiết Lập Lịch Làm Việc</h2>
            
            {/* General Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian mỗi slot (phút)
                </label>
                <select
                  value={scheduleData.default_slot_duration}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, default_slot_duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={scheduleData.notes || ''}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú cho tuần này..."
                />
              </div>
            </div>

            {/* Days Configuration */}
            <div className="space-y-4">
              {dayNames.map((dayName, index) => {
                const dayData = scheduleData.working_days[dayName as keyof typeof scheduleData.working_days];
                const isWorking = dayData?.is_available || false;
                
                return (
                  <div key={dayName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-800">{dayLabels[index]}</h3>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isWorking}
                          onChange={() => handleDayToggle(dayName)}
                          className="mr-2"
                        />
                        <span className="text-sm">Làm việc</span>
                      </label>
                    </div>

                    {isWorking && dayData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Giờ bắt đầu
                          </label>
                          <input
                            type="time"
                            value={dayData.start_time}
                            onChange={(e) => handleDayUpdate(dayName, 'start_time', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Giờ kết thúc
                          </label>
                          <input
                            type="time"
                            value={dayData.end_time}
                            onChange={(e) => handleDayUpdate(dayName, 'end_time', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nghỉ từ
                          </label>
                          <input
                            type="time"
                            value={dayData.break_start || ''}
                            onChange={(e) => handleDayUpdate(dayName, 'break_start', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nghỉ đến
                          </label>
                          <input
                            type="time"
                            value={dayData.break_end || ''}
                            onChange={(e) => handleDayUpdate(dayName, 'break_end', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4">
            {/* Show all action buttons for staff, only refresh for consultant */}
            {canEdit ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : (existingSchedule ? 'Cập nhật lịch' : 'Tạo lịch mới')}
                </button>
                
                {existingSchedule && (
                  <button
                    onClick={handleCopyFromPrevious}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Sao chép sang tuần sau
                  </button>
                )}
              </>
            ) : isConsultant && (
              <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span>
                    <strong>Lưu ý:</strong> Chỉ staff có thể chỉnh sửa lịch làm việc. 
                    Nếu cần thay đổi, vui lòng liên hệ với staff.
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={fetchScheduleForWeek}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleManager; 