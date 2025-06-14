import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';
import { weeklyScheduleService } from '../../../services/weeklyScheduleService';
import { appointmentService } from '../../../services/appointmentService';

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

interface Appointment {
  _id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  consultant_id: {
    _id: string;
    specialization: string;
    user_id: {
      full_name: string;
    };
  };
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Check if current user is consultant (read-only) or staff (can edit)
  const isConsultant = user?.role === 'consultant';
  const canEdit = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    console.log('🔍 Fetching schedule for week:', format(currentWeek, 'yyyy-MM-dd (EEEE)', { locale: vi }));
    fetchWeekData();
  }, [currentWeek]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchScheduleForWeek(),
        fetchAppointmentsForWeek()
      ]);
    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleForWeek = async () => {
    try {
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
    }
  };

  const fetchAppointmentsForWeek = async () => {
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      
      console.log('📅 Fetching appointments for week:', weekStart, 'to', weekEnd);
      
      const data = await appointmentService.getConsultantAppointments(undefined, weekStart, weekEnd);
      console.log('📊 Appointments Response data:', data);
      
      if (data.success && data.data) {
        console.log('✅ Found appointments:', data.data.appointments?.length || 0);
        
        // Debug: log each appointment to check structure
        data.data.appointments?.forEach((appointment: Appointment, index: number) => {
          console.log(`📄 Appointment ${index + 1}:`, appointment);
          console.log(`👤 Customer ID:`, appointment.customer_id);
          console.log(`📛 Customer Name:`, appointment.customer_id?.full_name);
        });
        
        setAppointments(data.data.appointments || []);
      } else {
        console.log('ℹ️ No appointments found for this week');
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setAppointments([]);
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

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    try {
      console.log(`${action} appointment:`, appointmentId);
      
      let response;
      if (action === 'confirm') {
        // Use appointmentService to confirm appointment
        response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Use appointmentService to cancel appointment
        response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: action === 'confirm' ? 'Đã chấp nhận cuộc hẹn' : 'Đã từ chối cuộc hẹn' 
        });
        
        // Refresh appointments
        fetchAppointmentsForWeek();
        setHoveredAppointment(null);
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật cuộc hẹn' });
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật cuộc hẹn' });
    }
  };

  const handleMouseEnter = (appointment: Appointment, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      x: rect.right + 10,
      y: rect.top
    });
    setHoveredAppointment(appointment);
  };

  const handleMouseLeave = () => {
    // Set a delay before hiding the modal
    const timeout = setTimeout(() => {
      setHoveredAppointment(null);
    }, 300); // 300ms delay
    
    setHideTimeout(timeout);
  };

  const handleModalMouseEnter = () => {
    // Clear the hide timeout when hovering over the modal
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const handleModalMouseLeave = () => {
    // Hide the modal immediately when leaving the modal area
    setHoveredAppointment(null);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
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

                {/* Weekly Calendar View */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Calendar Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        {/* Week Navigation Header */}
                        <tr className="bg-gray-50 border-b">
                          <th className="w-20 p-4 text-right text-sm font-medium text-gray-500 border-r">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={handlePreviousWeek}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                                disabled={loading}
                                title="Tuần trước"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            </div>
                          </th>
                          
                          <th colSpan={7} className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-4">
                              <button
                                onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                disabled={loading}
                              >
                                Hôm nay
                              </button>
                              
                              <div className="text-center">
                                <h3 className="font-semibold text-lg text-gray-800">
                                  {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {existingSchedule ? 'Có lịch làm việc' : 'Chưa có lịch làm việc'}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-600">View:</span>
                                <span className="font-medium text-blue-600">Tuần</span>
                                <span className="text-gray-400">Tháng</span>
                              </div>
                            </div>
                          </th>

                          <th className="w-20 p-4 text-left text-sm font-medium text-gray-500">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={handleNextWeek}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                                disabled={loading}
                                title="Tuần sau"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </th>
                        </tr>

                        {/* Days Header */}
                        <tr className="bg-gray-50">
                          <th className="w-20 p-4 text-right text-sm font-medium text-gray-500 border-r">
                            Thời gian
                          </th>
                          {dayNames.map((dayName, index) => {
                            const dayDate = addDays(currentWeek, index);
                            return (
                              <th key={dayName} className="p-3 text-center border-r last:border-r-0">
                                <div className="font-semibold text-gray-800">{dayLabels[index]}</div>
                                <div className="text-sm text-gray-600">{format(dayDate, 'dd')}</div>
                                <div className="text-xs text-gray-500">tháng {format(dayDate, 'MM')}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Generate time slots from 7 AM to 7 PM (12 hours) */}
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = 7 + i;
                          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
                          
                          return (
                            <tr key={timeLabel} className="border-t">
                              {/* Time column */}
                              <td className="w-20 p-4 text-right text-sm font-medium text-gray-500 border-r bg-gray-50">
                                {timeLabel}
                              </td>
                              
                              {/* Day columns */}
                              {dayNames.map((dayName, dayIndex) => {
                                const dayData = scheduleData.working_days[dayName as keyof typeof scheduleData.working_days];
                                const isWorking = dayData?.is_available || false;
                                const dayDate = addDays(currentWeek, dayIndex);
                                
                                // Get appointments for this specific day and hour
                                const dayAppointments = appointments.filter(appointment => {
                                  const appointmentDate = parseISO(appointment.appointment_date);
                                  const appointmentHour = parseInt(appointment.start_time.split(':')[0]);
                                  return isSameDay(appointmentDate, dayDate) && appointmentHour === hour;
                                });
                                
                                let cellContent = null;
                                let cellClass = "p-1 h-16 border-r last:border-r-0 relative";
                                
                                // Sunday is always gray with "Không làm việc"
                                if (dayName === 'sunday') {
                                  cellClass += " bg-gray-100";
                                  cellContent = (
                                    <span className="text-xs text-gray-500 font-medium">Không làm việc</span>
                                  );
                                } else if (dayAppointments.length > 0) {
                                  // Show appointment
                                  const appointment = dayAppointments[0];
                                  cellClass += " bg-blue-50";
                                  cellContent = (
                                    <div 
                                      className="absolute inset-1 bg-blue-500 rounded-lg flex flex-col justify-center items-center text-white p-1 cursor-pointer hover:bg-blue-600 transition-colors"
                                      onMouseEnter={(e) => handleMouseEnter(appointment, e)}
                                      onMouseLeave={handleMouseLeave}
                                    >
                                      <span className="text-xs font-semibold">
                                        {appointment.customer_id?.full_name || 'Khách hàng'}
                                      </span>
                                      <span className="text-xs">
                                        {appointment.start_time} - {appointment.end_time}
                                      </span>
                                    </div>
                                  );
                                } else if (isWorking && dayData) {
                                  const startHour = parseInt(dayData.start_time.split(':')[0]);
                                  const endHour = parseInt(dayData.end_time.split(':')[0]);
                                  const breakStartHour = dayData.break_start ? parseInt(dayData.break_start.split(':')[0]) : null;
                                  const breakEndHour = dayData.break_end ? parseInt(dayData.break_end.split(':')[0]) : null;
                                  
                                  // Check if current hour is within working hours
                                  if (hour >= startHour && hour < endHour) {
                                    // Check if it's break time
                                    if (breakStartHour && breakEndHour && hour >= breakStartHour && hour < breakEndHour) {
                                      cellClass += " bg-yellow-100";
                                      cellContent = (
                                        <div className="flex items-center justify-center h-full">
                                          <span className="text-xs text-yellow-800 font-medium">• Nghỉ trưa</span>
                                        </div>
                                      );
                                    } else {
                                      cellClass += " bg-green-50";
                                      cellContent = (
                                        <span className="text-xs text-green-600 font-medium">Trống</span>
                                      );
                                    }
                                  } else {
                                    cellClass += " bg-gray-50";
                                    cellContent = (
                                      <span className="text-xs text-gray-400">Không làm việc</span>
                                    );
                                  }
                                } else {
                                  cellClass += " bg-gray-50";
                                  cellContent = (
                                    <span className="text-xs text-gray-400">Không làm việc</span>
                                  );
                                }
                                
                                return (
                                  <td key={`${dayName}-${timeLabel}`} className={cellClass}>
                                    <div className="flex items-center justify-center h-full text-center">
                                      {cellContent}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend */}
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-start space-x-6 text-sm">
                      <span className="font-medium text-gray-700">Chú thích:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                        <span className="text-gray-700">Có thể đặt lịch</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-gray-700">Có cuộc hẹn</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                        <span className="text-gray-700">Giờ nghỉ</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                        <span className="text-gray-700">Không làm việc</span>
                      </div>
                    </div>
                  </div>
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

            {/* Appointment Info Modal */}
            {hoveredAppointment && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
                style={{
                  left: modalPosition.x,
                  top: modalPosition.y,
                  transform: modalPosition.x > window.innerWidth - 300 ? 'translateX(-100%)' : 'none'
                }}
                onMouseEnter={handleModalMouseEnter}
                onMouseLeave={handleModalMouseLeave}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h3 className="font-semibold text-gray-800">Thông tin cuộc hẹn</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    hoveredAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    hoveredAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    hoveredAppointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {hoveredAppointment.status === 'confirmed' ? 'Đã xác nhận' :
                     hoveredAppointment.status === 'pending' ? 'Chờ xác nhận' :
                     hoveredAppointment.status === 'cancelled' ? 'Đã hủy' :
                     'Hoàn thành'}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium text-gray-700">
                      {hoveredAppointment.customer_id?.full_name || 'Không có tên'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <span className="text-sm text-gray-600">
                      {hoveredAppointment.customer_id?.email || 'Không có email'}
                    </span>
                  </div>
                  
                  {hoveredAppointment.customer_id?.phone && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                      <span className="text-sm text-gray-600">
                        {hoveredAppointment.customer_id.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Appointment Details */}
                <div className="space-y-2 mb-4 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">
                      <strong>Ngày:</strong> {format(parseISO(hoveredAppointment.appointment_date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">
                      <strong>Thời gian:</strong> {hoveredAppointment.start_time} - {hoveredAppointment.end_time}
                    </span>
                  </div>
                </div>

                {/* Customer Notes */}
                {hoveredAppointment.customer_notes && (
                  <div className="mb-4 pt-2 border-t">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Ghi chú từ khách hàng:</span>
                        <p className="text-sm text-gray-600 mt-1">{hoveredAppointment.customer_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {hoveredAppointment.status === 'pending' && (
                  <div className="flex space-x-2 pt-3 border-t">
                    <button
                      onClick={() => handleAppointmentAction(hoveredAppointment._id, 'confirm')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      ✓ Chấp nhận
                    </button>
                    <button
                      onClick={() => handleAppointmentAction(hoveredAppointment._id, 'cancel')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      ✗ Từ chối
                    </button>
                  </div>
                )}
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