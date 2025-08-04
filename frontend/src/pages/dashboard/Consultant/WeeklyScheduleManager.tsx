import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDateLocal } from '../../../utils/dateUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { weeklyScheduleService } from '../../../services/weeklyScheduleService';
import { appointmentService } from '../../../services/appointmentService';
import { getGoogleAccessToken } from '../../../utils/authUtils';
import GoogleAuthStatus from '../../../components/common/GoogleAuthStatus';
import { FaChevronLeft, FaChevronRight, FaLink } from 'react-icons/fa';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import AppointmentDetailModal from '../../../components/appointments/AppointmentDetailModal';


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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
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
  meeting_info?: {
    meet_url: string;
    meeting_id: string;
    meeting_password?: string;
  } | null;
}

const WeeklyScheduleManager: React.FC = () => {
  console.log('🚀 [DEBUG] WeeklyScheduleManager component mounted/re-rendered');
  const { user } = useAuth();
  console.log('🚀 [DEBUG] Current user from useAuth:', user);
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

  
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Helper function to get appointment status colors
  const getAppointmentStatusColors = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-500',
          hover: 'hover:bg-yellow-600',
          cellBg: 'bg-yellow-50'
        };
      case 'confirmed':
        return {
          bg: 'bg-blue-500',
          hover: 'hover:bg-blue-600', 
          cellBg: 'bg-blue-50'
        };
      case 'completed':
        return {
          bg: 'bg-green-500',
          hover: 'hover:bg-green-600',
          cellBg: 'bg-green-50'
        };

      case 'in_progress':
        return {
          bg: 'bg-purple-500',
          hover: 'hover:bg-purple-600',
          cellBg: 'bg-purple-50'
        };
      default:
        return {
          bg: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          cellBg: 'bg-gray-50'
        };
    }
  };

  const getAppointmentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Cuộc họp đang diễn ra';
      default: return status;
    }
  };

  // Check if current user is consultant (read-only) or staff (can edit)
  const isConsultant = user?.role === 'consultant';
  const canEdit = user?.role === 'staff' || user?.role === 'admin';
  console.log('🚀 [DEBUG] User role check - isConsultant:', isConsultant, 'canEdit:', canEdit, 'user.role:', user?.role);

  useEffect(() => {
    console.log('🚀 [DEBUG] useEffect triggered, currentWeek:', currentWeek);
    fetchWeekData();
  }, [currentWeek]);



  const fetchWeekData = async () => {
    console.log('🚀 [DEBUG] fetchWeekData STARTED');
    setLoading(true);
    try {
      console.log('🚀 [DEBUG] About to call fetchScheduleForWeek and fetchAppointmentsForWeek');
      await Promise.all([
        fetchScheduleForWeek(),
        fetchAppointmentsForWeek()
      ]);
      console.log('🚀 [DEBUG] Both fetch functions completed');
    } catch (error) {
      console.log('🚀 [DEBUG]  fetchWeekData error:', error);
      // Error handled by individual fetch functions
    } finally {
      setLoading(false);
      console.log('🚀 [DEBUG] fetchWeekData FINISHED');
    }
  };

  const fetchScheduleForWeek = async () => {
    try {
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      
      
      // Sử dụng weeklyScheduleService thay vì fetch trực tiếp
      const response = await weeklyScheduleService.getMySchedules(weekStartDate, weekStartDate);
      
     

      if ((response as any).success && (response as any).data && (response as any).data.schedules && (response as any).data.schedules.length > 0) {
        // Filter schedules for the exact week we're looking for
        const targetWeekStart = format(currentWeek, 'yyyy-MM-dd');
       
        
        const matchingSchedule = (response as any).data.schedules.find((schedule: Schedule) => {
          // Normalize both dates to yyyy-MM-dd format for comparison
          const scheduleDate = new Date(schedule.week_start_date);
          const scheduleWeekStart = format(scheduleDate, 'yyyy-MM-dd');
          return scheduleWeekStart === targetWeekStart;
        });

        if (matchingSchedule) {
        
          setExistingSchedule(matchingSchedule);
          const newScheduleData = {
            working_days: matchingSchedule.working_days || {},
            default_slot_duration: matchingSchedule.default_slot_duration || 30,
            notes: matchingSchedule.notes || ''
          };
         
          setScheduleData(newScheduleData);
          
          // Force a re-render to make sure UI updates
          setTimeout(() => {
       
          }, 100);
        } else {

          setExistingSchedule(null);
          setScheduleData({
            working_days: {},
            default_slot_duration: 30,
            notes: ''
          });
        }
      } else {
        // Reset to default if no schedule exists
        setExistingSchedule(null);
        setScheduleData({
          working_days: {},
          default_slot_duration: 30,
          notes: ''
        });
      }
    } catch (err) {

    }
  };

    const fetchAppointmentsForWeek = async () => {
    console.log('🚀 [DEBUG] fetchAppointmentsForWeek STARTED');
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

      console.log('📅 [DEBUG] Fetching appointments for week:', weekStart, 'to', weekEnd);
      console.log('📅 [DEBUG] Current user:', user);
      
      // Get current user's consultant ID (for consultant role, user.id is the consultant ID)
      const consultantId = (user as any)?.id;
      console.log('📅 [DEBUG] Consultant ID:', consultantId);
      
      
      // Try multiple approaches to get appointments
      
      // Temporarily disable new endpoint due to 500 error
      /*
      try {
        const myData = await appointmentService.getMyAppointments({
          date_from: weekStart,
          date_to: weekEnd
        });
        
        console.log('📅 [DEBUG] getMyAppointments response:', myData);
        
        if (myData && myData.success && myData.data && myData.data.appointments) {
          console.log('📅 [DEBUG]  getMyAppointments successful, found:', myData.data.appointments.length, 'appointments');
          setAppointments(myData.data.appointments);
          return;
        }
      } catch (myError) {
        console.log('📅 [DEBUG]  getMyAppointments failed:', myError);
      }
      */
      
      
      try {
        console.log('📅 [DEBUG] Trying getConsultantAppointmentsPaginated (same API as AppointmentManagement)...');
        const paginatedData = await appointmentService.getConsultantAppointmentsPaginated({
          page: 1,
          limit: 1000,  // Large limit to get all appointments
          date_from: weekStart,
          date_to: weekEnd
        });
        
        console.log('📅 [DEBUG] getConsultantAppointmentsPaginated response:', paginatedData);

        
        if (paginatedData && paginatedData.success && paginatedData.data && paginatedData.data.appointments) {
          // Filter out appointments with null customer_id (same as AppointmentManagement)
          const validAppointments = paginatedData.data.appointments.filter((appointment: any) => {
            return appointment && appointment.customer_id && appointment.customer_id.full_name;
          });
          
          console.log('📅 [DEBUG]  Found appointments via getConsultantAppointmentsPaginated:', validAppointments);
          setAppointments(validAppointments);
          return;
        } else {
          console.log('📅 [DEBUG]  getConsultantAppointmentsPaginated failed or no data');
        }
      } catch (paginatedError) {
        console.log('📅 [DEBUG]  getConsultantAppointmentsPaginated error:', paginatedError);

      }
      
      // Fallback 1: Try consultant appointments endpoint
      try {
        console.log('📅 [DEBUG] Trying getConsultantAppointments...');
        const consultantData = await appointmentService.getConsultantAppointments();
        console.log('📅 [DEBUG] getConsultantAppointments response:', consultantData);
        
        if (consultantData && consultantData.success && consultantData.data && consultantData.data.appointments) {
          console.log('📅 [DEBUG] All consultant appointments:', consultantData.data.appointments);
          // Filter by date range manually
          const weekAppointments = consultantData.data.appointments.filter((appointment: Appointment) => {
            const appointmentDate = appointment.appointment_date;
            const inRange = appointmentDate >= weekStart && appointmentDate <= weekEnd;
            console.log(`📅 [DEBUG] Appointment ${appointment._id} date ${appointmentDate} in range [${weekStart}-${weekEnd}]:`, inRange);
            return inRange;
          });
          
          console.log('📅 [DEBUG]  Found filtered appointments:', weekAppointments);
          setAppointments(weekAppointments);
          return;
        } else {
          console.log('📅 [DEBUG]  getConsultantAppointments failed or no data');
        }
      } catch (consultantError) {
        console.log('📅 [DEBUG]  getConsultantAppointments error:', consultantError);
      }
      
      // Fallback 2: Try direct apiClient call with proper parameters
      try {
        console.log('📅 [DEBUG] Trying direct apiClient call...');
        const directResponse = await apiClient.get(API.Appointment.ALL, {
          params: {
            date_from: weekStart,
            date_to: weekEnd,
            consultant_id: consultantId
          }
        });
        
        console.log('📅 [DEBUG] Direct apiClient response:', directResponse.data);
        const directData = directResponse.data;
        
        if (directData && (directData as any).success && (directData as any).data && (directData as any).data.appointments) {
          console.log('📅 [DEBUG]  Found appointments via direct call (structure 1):', (directData as any).data.appointments);
          setAppointments((directData as any).data.appointments);
          return;
        } else if (directData && (directData as any).appointments) {
          // Fallback for different response structure
          console.log('📅 [DEBUG]  Found appointments via direct call (structure 2):', (directData as any).appointments);
          setAppointments((directData as any).appointments);
          return;
        } else {
          console.log('📅 [DEBUG]  Direct apiClient call failed or no data');
        }
      } catch (directError) {
        console.log('📅 [DEBUG]  Direct apiClient call error:', directError);
      }
      
      console.log('📅 [DEBUG]  All API calls failed, setting appointments to empty array');
      setAppointments([]);
      
    } catch (error) {
      console.log('📅 [DEBUG]  fetchAppointmentsForWeek main catch error:', error);
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



      let response;
      if (existingSchedule) {
        // Update existing schedule
        response = await weeklyScheduleService.updateSchedule(existingSchedule._id, requestData);
      } else {
        // Create new schedule
        response = await weeklyScheduleService.createSchedule(requestData);
      }


      
      if ((response as any).success) {
        setMessage({ type: 'success', text: existingSchedule ? 'Cập nhật lịch thành công!' : 'Tạo lịch thành công!' });
        fetchScheduleForWeek(); // Refresh data
      } else {
        setMessage({ type: 'error', text: (response as any).message || 'Có lỗi xảy ra khi lưu lịch' });
      }
    } catch (err) {
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
      
      if ((response as any).success) {
        setMessage({ type: 'success', text: 'Sao chép lịch thành công!' });
        setCurrentWeek(addWeeks(currentWeek, 1)); // Move to next week
      } else {
        setMessage({ type: 'error', text: (response as any).message || 'Có lỗi xảy ra khi sao chép lịch' });
      }
    } catch (err) { 
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

  const handleAppointmentAction = async (
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'start' | 'complete'
  ) => {
    try {
      
      // Kiểm tra Google access token cho action confirm
      if (action === 'confirm') {
        const googleAccessToken = getGoogleAccessToken();
        if (!googleAccessToken) {
          setMessage({ 
            type: 'error', 
            text: 'Cần đăng nhập Google để tạo link Google Meet. Vui lòng đăng nhập lại.' 
          });
          // Redirect đến Google OAuth
            window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}${API.Auth.GOOGLE_VERIFY}`;
            return;
        }
      }

      let response;
      switch (action) {
        case 'confirm':
          const googleAccessToken = getGoogleAccessToken();
          response = await appointmentService.confirmAppointment(appointmentId, googleAccessToken!);
          break;
        case 'cancel':
            response = await appointmentService.cancelAppointment(appointmentId);
          break;
        case 'start':
          const googleTokenForStart = getGoogleAccessToken();
          response = await appointmentService.startMeeting(appointmentId, googleTokenForStart || undefined);
          break;
        case 'complete': 
          response = await appointmentService.completeAppointment(appointmentId, ''); // No notes in quick modal
          break;
        default:
          return;
      }


      if ((response as any).success) {
        const successMsg = {
          confirm: 'Đã chấp nhận cuộc hẹn và tạo link Google Meet thành công',
          cancel: 'Đã hủy cuộc hẹn',
          start: 'Đã bắt đầu buổi tư vấn',
          complete: 'Đã hoàn thành buổi tư vấn'
        }[action];

        setMessage({ type: 'success', text: successMsg });

        // Refresh appointments
        fetchAppointmentsForWeek();
        setHoveredAppointment(null);
      } else {
        const errorMsg = (response as any).message || 'Có lỗi xảy ra khi cập nhật cuộc hẹn';
        
        // Show more specific error message based on action
        let userFriendlyMsg = errorMsg;
        if (action === 'confirm' && errorMsg.includes('Internal server error')) {
          userFriendlyMsg = 'Không thể xác nhận cuộc hẹn. Vui lòng kiểm tra lịch làm việc hoặc liên hệ admin.';
        } else if (action === 'start' && errorMsg.includes('Internal server error')) {
          userFriendlyMsg = 'Không thể bắt đầu cuộc hẹn. Vui lòng thử lại sau.';
        }
        
        setMessage({ type: 'error', text: userFriendlyMsg });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật cuộc hẹn';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setHoveredAppointment(appointment);
  };



  // Kiểm tra xem có thể hoàn thành lịch hẹn hay không (giống logic ở AppointmentManagement)
  const canCompleteAppointment = (appointment: Appointment) => {
    // Chỉ cần status là 'in_progress' là có thể hoàn thành
    return appointment.status === 'in_progress';
  };

  const getCompletionBlockedReason = (appointment: Appointment) => {
    if (appointment.status !== 'in_progress') return 'Chỉ hoàn thành khi đang tư vấn';

    try {
      const now = new Date();
      const appointmentDate = new Date(appointment.appointment_date);
      const [hours, minutes] = appointment.start_time.split(':').map(Number);

      const appointmentDateOnly = new Date(appointmentDate);
      appointmentDateOnly.setHours(0, 0, 0, 0);

      const todayOnly = new Date(now);
      todayOnly.setHours(0, 0, 0, 0);

      // Bỏ ràng buộc thời gian - có thể hoàn thành bất kỳ lúc nào khi status là 'in_progress'

      return '';
    } catch {
      return 'Không xác định';
    }
  };

  // Debug current state


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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Google Auth Status for Consultant */}


        {/* Calendar View for Consultant or Schedule Form for Staff */}
        {isConsultant ? (
          /* Calendar View for Consultant (Read-only) */
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Lịch Làm Việc Của Tôi
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                  disabled={loading}
                >
                  <FaChevronLeft className="mr-2" />
                  Tuần trước
                </button>
                
                <button
                  onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  disabled={loading}
                >
                  Hôm nay
                </button>
                
                <div className="text-center">
                  <h3 className="font-semibold text-base">
                    Tuần {format(currentWeek, 'dd/MM')} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy')}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {existingSchedule ? 'Đã có lịch làm việc' : 'Chưa có lịch làm việc'}
                  </p>
                </div>
                
                <button
                  onClick={handleNextWeek}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                  disabled={loading}
                >
                  Tuần sau
                  <FaChevronRight className="ml-2" />
                </button>
              </div>
            </div>
            
            {existingSchedule ? (
              <div>


                {/* Weekly Calendar View */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Calendar Table */}
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                    <table className="w-full table-fixed min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-100 shadow-sm">
                          <th className="w-[6%] p-2 text-center text-sm font-bold text-gray-700 border-r border-gray-300 bg-gradient-to-r from-gray-200 to-gray-100 sticky left-0 top-0 z-30 shadow-sm">
                            <div className="text-xs text-gray-600 mb-1">Thời gian</div>
                          </th>
                          {dayNames.map((dayName, index) => {
                            const dayDate = addDays(currentWeek, index);
                            const isToday = isSameDay(dayDate, new Date());
                            return (
                              <th key={dayName} className={`w-[13.43%] p-3 text-center border-r last:border-r-0 border-gray-300 ${isToday ? 'bg-blue-100 border-blue-300' : 'bg-gray-100'} sticky top-0 z-20`}>
                                <div className={`font-bold text-sm ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>{dayLabels[index]}</div>
                                <div className={`text-sm ${isToday ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>{format(dayDate, 'dd')}</div>
                                {isToday && (<div className="text-xs text-blue-600 font-medium mt-1">HÔM NAY</div>)}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = 7 + i;
                          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
                          return (
                            <tr key={timeLabel} className="border-t border-gray-200">
                              <td className="w-[6%] p-2 text-center text-sm font-bold text-gray-700 border-r border-gray-300 bg-gradient-to-r from-gray-200 to-gray-100 sticky left-0 z-10 shadow-sm">
                                <div className="bg-white rounded px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm border">
                                  {timeLabel}
                                </div>
                              </td>
                              {dayNames.map((dayName, dayIndex) => {
                                const dayData = scheduleData.working_days[dayName as keyof typeof scheduleData.working_days];
                                const isWorking = dayData?.is_available || false;
                                const dayDate = addDays(currentWeek, dayIndex);
                                
                                // Debug working days
                                if (dayIndex === 0) { // Only log once per row
                                  
                                }
                                
                                // Get appointments for this specific day and hour
                                // Debug removed to reduce console spam
                                
                                const dayAppointments = appointments.filter(appointment => {
                                  if (appointment.status === 'cancelled') return false; // Bỏ qua lịch đã hủy
                                  const appointmentDate = parseISO(appointment.appointment_date);
                                  const appointmentHour = parseInt(appointment.start_time.split(':')[0]);
                                  const matches = isSameDay(appointmentDate, dayDate) && appointmentHour === hour;
                                  
                                  if (matches) {
                                    console.log(` [DEBUG] Found matching appointment:`, appointment);
                                  }
                                  
                                  return matches;
                                });
                                
                             
                                
                                const isToday = isSameDay(dayDate, new Date());
                                
                                let cellContent = null;
                                let cellClass = `p-1 h-14 border-r last:border-r-0 relative w-[13.43%] border-gray-200 ${
                                  isToday ? 'bg-blue-25' : ''
                                }`;
                                
                                // Sunday is always gray
                                if (dayName === 'sunday') {
                                  cellClass += isToday ? " bg-blue-50" : " bg-gray-100";
                                  cellContent = null;
                                } else if (dayAppointments.length > 0) {
                                  // Show appointment with status-based colors
                                  const appointment = dayAppointments[0];
                                  const statusColors = getAppointmentStatusColors(appointment.status);
                                  cellClass += ` ${statusColors.cellBg}`;
                                  cellContent = (
                                    <div 
                                      className={`absolute inset-1 ${statusColors.bg} rounded-md flex flex-col justify-center items-center text-white p-1 cursor-pointer ${statusColors.hover} transition-colors shadow-sm overflow-hidden`}
                                      onClick={() => handleAppointmentClick(appointment)}
                                    >
                                      <span className="text-xs font-semibold leading-tight text-center w-full truncate px-1">
                                        {appointment.customer_id?.full_name || 'Khách hàng'}
                                      </span>
                                      <span className="text-xs leading-tight truncate">
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
                                      cellClass += isToday ? " bg-yellow-200" : " bg-yellow-100";
                                      cellContent = null;
                                    } else {
                                      cellClass += isToday ? " bg-green-100" : " bg-green-50";
                                      cellContent = null;
                                    }
                                  } else {
                                    cellClass += isToday ? " bg-blue-50" : " bg-gray-50";
                                    cellContent = null;
                                  }
                                } else {
                                  cellClass += isToday ? " bg-blue-50" : " bg-gray-50";
                                  cellContent = null;
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
                  <div className="p-3 bg-gray-50 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="mb-1">
                        <span className="font-medium text-gray-700 block mb-1">Trạng thái lịch:</span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                            <span className="text-gray-700 text-xs">Có thể đặt</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                            <span className="text-gray-700 text-xs">Giờ nghỉ</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                            <span className="text-gray-700 text-xs">Không làm việc</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <span className="font-medium text-gray-700 block mb-1">Trạng thái cuộc hẹn:</span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span className="text-gray-700 text-xs">Chờ xác nhận</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-gray-700 text-xs">Đã xác nhận</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <span className="font-medium text-gray-700 block mb-1">&nbsp;</span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-gray-700 text-xs">Hoàn thành</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span className="text-gray-700 text-xs">Đã hủy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Thông tin lịch</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Được tạo bởi:</span> {existingSchedule.created_by.name}
                    </div>
                    <div>
                      <span className="font-medium">Ngày tạo:</span> {
                        existingSchedule.created_date ? 
                          (() => {
                            try {
                              return format(new Date(existingSchedule.created_date), 'dd/MM/yyyy HH:mm');
                            } catch {
                              return 'Không xác định';
                            }
                          })() : 'Không xác định'
                        }
                    </div>
                    <div>
                      <span className="font-medium">Cập nhật:</span> {
                        existingSchedule.updated_date ? 
                          (() => {
                            try {
                              return format(new Date(existingSchedule.updated_date), 'dd/MM/yyyy HH:mm');
                            } catch {
                              return 'Không xác định';
                            }
                          })() : 'Không xác định'
                        }                         
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-lg p-8 mx-auto mb-4 max-w-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch làm việc</h3>
                  <p className="text-gray-600 mb-3">Tuần này chưa có lịch làm việc được thiết lập.</p>
                  <p className="text-sm text-gray-500">Liên hệ với staff để được thiết lập lịch làm việc.</p>
                </div>
              </div>
            )}

                        {/* Appointment Info Modal */}
            {hoveredAppointment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl relative max-h-[90vh] overflow-hidden w-[480px] max-w-[90vw]">
                  {/* Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin cuộc hẹn</h3>
                    <button
                      onClick={() => setHoveredAppointment(null)}
                      className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    <div className="p-4 overflow-y-auto flex-1">
                    {/* Status */}
                    <div className="mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        hoveredAppointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        hoveredAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        hoveredAppointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        hoveredAppointment.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getAppointmentStatusLabel(hoveredAppointment.status)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Khách hàng:</span>
                        <p className="font-medium">{hoveredAppointment.customer_id?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium truncate">{hoveredAppointment.customer_id?.email || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Notes - Only show if exists */}
                    {hoveredAppointment.customer_notes && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded text-sm">
                        <span className="text-gray-500 font-medium">Ghi chú khách hàng:</span>
                        <p className="mt-1 whitespace-pre-wrap">{hoveredAppointment.customer_notes}</p>
                      </div>
                    )}

                    {/* Consultant Notes if exists */}
                    {hoveredAppointment.consultant_notes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                        <span className="text-gray-500 font-medium">Ghi chú của chuyên gia:</span>
                        <p className="mt-1 whitespace-pre-wrap">{hoveredAppointment.consultant_notes}</p>
                      </div>
                    )}

                    {/* No notes message */}
                    {!hoveredAppointment.customer_notes && !hoveredAppointment.consultant_notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-center text-gray-500">
                        Không có ghi chú
                      </div>
                    )}

                    {/* Google Meet Link */}
                    {hoveredAppointment.status === 'in_progress' && hoveredAppointment.meeting_info?.meet_url && (
                      <div className="mb-4">
                        <a 
                          href={hoveredAppointment.meeting_info.meet_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block w-full text-center px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                          Tham gia cuộc họp
                        </a>
                      </div>
                    )}
                    </div>

                    {/* Action Buttons - Fixed at bottom */}
                    {(hoveredAppointment.status === 'pending' || hoveredAppointment.status === 'confirmed' || hoveredAppointment.status === 'in_progress') && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex space-x-3">
                          {hoveredAppointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAppointmentAction(hoveredAppointment._id, 'confirm')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(hoveredAppointment._id, 'cancel')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {hoveredAppointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleAppointmentAction(hoveredAppointment._id, 'start')}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors"
                              >
                                Bắt đầu
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(hoveredAppointment._id, 'cancel')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {hoveredAppointment.status === 'in_progress' && (
                            <button
                              onClick={() => handleAppointmentAction(hoveredAppointment._id, 'complete')}
                              disabled={!canCompleteAppointment(hoveredAppointment)}
                              className={`flex-1 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                                canCompleteAppointment(hoveredAppointment)
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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