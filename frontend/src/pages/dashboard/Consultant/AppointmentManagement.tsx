import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import Icon from '../../../components/icons/IconMapping';
import AutoConfirmStatus from '../../../components/common/AutoConfirmStatus';
import AppointmentDetailModal from '../../../components/appointments/AppointmentDetailModal';

interface Appointment {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  customer_notes?: string;
  consultant_notes?: string;
  created_date: string;
  meeting_info?: {
    meet_url: string;
    meeting_id: string;
    meeting_password?: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    appointments: Appointment[];
    total: number;
  };
}

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  in_progress: number;
  today: number;
}

const AppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultantNotes, setConsultantNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    in_progress: 0,
    today: 0
  });

  const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang tư vấn',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const filterOptions = [
    { value: 'all', label: 'Tất cả', count: stats.total },
    { value: 'pending', label: 'Chờ xác nhận', count: stats.pending },
    { value: 'confirmed', label: 'Đã xác nhận', count: stats.confirmed },
    { value: 'in_progress', label: 'Đang tư vấn', count: stats.in_progress },
    { value: 'completed', label: 'Đã hoàn thành', count: stats.completed },
    { value: 'cancelled', label: 'Đã hủy', count: stats.cancelled }
  ];

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  // Cập nhật UI mỗi phút để refresh thời gian completion
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render để cập nhật thời gian remaining
      setAppointments(prev => [...prev]);
      
      // Nếu có modal đang mở, cập nhật selectedAppointment
      if (selectedAppointment) {
        setSelectedAppointment(prev => prev ? {...prev} : null);
      }
    }, 60000); // Cập nhật mỗi phút

    return () => clearInterval(interval);
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated and has consultant role
      if (!user) {
        showNotification('error', 'Bạn cần đăng nhập để xem lịch hẹn');
        return;
      }
      
      if (user.role !== 'consultant') {
        showNotification('error', 'Bạn không có quyền truy cập trang này');
        return;
      }
      
      console.log('🔍 Fetching appointments for consultant:', user.full_name, 'Role:', user.role);
      
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

      const response = await axios.get(`http://localhost:3000/api/appointments/consultant-appointments?${queryParams}`);

      console.log('📡 API Response status:', response.status);
      
      if (response.data.success) {
        console.log('✅ Successfully loaded', response.data.data.appointments.length, 'appointments');
        
        // Log tất cả các lịch hẹn để kiểm tra
        console.log('📋 All appointments:', response.data.data.appointments);
        
        // Filter out appointments with null customer_id
        const validAppointments = response.data.data.appointments.filter((appointment: Appointment) => {
          const isValid = appointment && appointment.customer_id && appointment.customer_id.full_name;
          if (!isValid) {
            console.log('❌ Invalid appointment:', appointment);
          }
          return isValid;
        });
        
        if (validAppointments.length !== response.data.data.appointments.length) {
          console.warn('⚠️ Filtered out', response.data.data.appointments.length - validAppointments.length, 'invalid appointments');
        }
        
        setAppointments(validAppointments);
        calculateStats(validAppointments);
      } else {
        console.error('❌ API Error:', response.data.message);
        showNotification('error', response.data.message || 'Không thể tải danh sách lịch hẹn');
      }
    } catch (err: any) {
      console.error('💥 Network Error:', err);
      if (err.response?.status === 401) {
        showNotification('error', 'Token đã hết hạn. Vui lòng đăng nhập lại');
        window.location.href = '/auth/login';
      } else if (err.response?.status === 403) {
        showNotification('error', 'Bạn không có quyền truy cập. Vui lòng kiểm tra role của bạn');
      } else {
        showNotification('error', 'Có lỗi mạng xảy ra. Vui lòng kiểm tra kết nối');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentList: Appointment[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    const newStats = appointmentList.reduce((acc, appointment) => {
      acc.total++;
      acc[appointment.status]++;
      
      if (appointment.appointment_date === today) {
        acc.today++;
      }
      
      return acc;
    }, {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      in_progress: 0,
      today: 0
    } as AppointmentStats);

    setStats(newStats);
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    // Simple notification - có thể thay bằng toast library
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (!appointment) {
      showNotification('error', 'Không tìm thấy lịch hẹn');
      return;
    }
    
    // Kiểm tra logic chuyển đổi trạng thái
    if (!canTransitionTo(appointment.status, 'confirmed', 'consultant')) {
      showNotification('error', `Không thể xác nhận lịch hẹn với trạng thái "${statusLabels[appointment.status]}". Chỉ có thể xác nhận lịch hẹn đang chờ.`);
      return;
    }

    try {
      setActionLoading(appointmentId);
      const token = localStorage.getItem('gencare_auth_token');
      
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Xác nhận lịch hẹn thành công');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Không thể xác nhận lịch hẹn');
      }
    } catch (err) {
      showNotification('error', 'Có lỗi xảy ra khi xác nhận lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const handleStartMeeting = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (!appointment) {
      showNotification('error', 'Không tìm thấy lịch hẹn');
      return;
    }
    
    // Kiểm tra logic chuyển đổi trạng thái
    if (!canTransitionTo(appointment.status, 'in_progress', 'consultant')) {
      showNotification('error', `Không thể bắt đầu tư vấn với trạng thái "${statusLabels[appointment.status]}". Chỉ có thể bắt đầu với lịch hẹn đã xác nhận.`);
      return;
    }

    try {
      setActionLoading(appointmentId);
      const token = localStorage.getItem('gencare_auth_token');
      
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/start-meeting`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Bắt đầu buổi tư vấn thành công');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Không thể bắt đầu buổi tư vấn');
      }
    } catch (err) {
      showNotification('error', 'Có lỗi xảy ra khi bắt đầu buổi tư vấn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    // Kiểm tra logic chuyển đổi trạng thái
    if (!canTransitionTo(selectedAppointment.status, 'completed', 'consultant')) {
      showNotification('error', `Không thể hoàn thành với trạng thái "${statusLabels[selectedAppointment.status]}". Chỉ có thể hoàn thành lịch hẹn đang tư vấn.`);
      return;
    }

    // Kiểm tra điều kiện thời gian và ngày
    if (!canCompleteAppointment(selectedAppointment)) {
      const blockedReason = getCompletionBlockedReason(selectedAppointment);
      showNotification('warning', blockedReason);
      return;
    }

    // Xác nhận trước khi hoàn thành
    if (!confirm('Bạn có chắc chắn muốn hoàn thành buổi tư vấn này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setActionLoading(selectedAppointment._id);
      const token = localStorage.getItem('gencare_auth_token');
      
      const response = await fetch(`http://localhost:3000/api/appointments/${selectedAppointment._id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consultant_notes: consultantNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Hoàn thành buổi tư vấn thành công');
        setSelectedAppointment(null);
        setConsultantNotes('');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Không thể hoàn thành buổi tư vấn');
      }
    } catch (err) {
      showNotification('error', 'Có lỗi xảy ra khi hoàn thành buổi tư vấn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (!appointment) {
      showNotification('error', 'Không tìm thấy lịch hẹn');
      return;
    }
    
    // Kiểm tra logic chuyển đổi trạng thái (Consultant chỉ có thể hủy pending)
    if (!canTransitionTo(appointment.status, 'cancelled', 'consultant')) {
      showNotification('error', `Chuyên gia chỉ có thể hủy lịch hẹn ở trạng thái "Chờ xác nhận". Lịch hẹn đã xác nhận hoặc đang tư vấn không thể hủy.`);
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setActionLoading(appointmentId);
      const token = localStorage.getItem('gencare_auth_token');
      
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Hủy lịch hẹn thành công');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Không thể hủy lịch hẹn');
      }
    } catch (err) {
      showNotification('error', 'Có lỗi xảy ra khi hủy lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'Hôm nay';
    if (isTomorrow(date)) return 'Ngày mai';
    if (isYesterday(date)) return 'Hôm qua';
    
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const getAppointmentPriority = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.appointment_date);
    const now = new Date();
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 2 && appointment.status === 'confirmed') return 'urgent';
    if (diffHours < 24 && appointment.status === 'confirmed') return 'soon';
    if (appointment.status === 'pending') return 'pending';
    return 'normal';
  };

  // Kiểm tra xem có thể hoàn thành lịch hẹn không (với điều kiện ngày và thời gian)
  const canCompleteAppointment = (appointment: Appointment) => {
    // Chỉ appointment có status 'in_progress' mới có thể hoàn thành
    if (appointment.status !== 'in_progress') return false;
    
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!appointment.appointment_date || !appointment.start_time) {
        console.warn('Missing appointment date or start time:', appointment);
        return false;
      }

      const now = new Date();
      
      // Parse ngày hẹn (format: YYYY-MM-DD)
      const appointmentDate = new Date(appointment.appointment_date);
      
      // Parse giờ bắt đầu (format: HH:MM)
      const [hours, minutes] = appointment.start_time.split(':').map(Number);
      
      // Kiểm tra giá trị hợp lệ
      if (isNaN(appointmentDate.getTime()) || isNaN(hours) || isNaN(minutes)) {
        console.warn('Invalid date or time format:', appointment.appointment_date, appointment.start_time);
        return false;
      }
      
      // === ĐIỀU KIỆN NGÀY ===
      
      // 1. Không thể hoàn thành trước ngày hẹn
      const appointmentDateOnly = new Date(appointmentDate);
      appointmentDateOnly.setHours(0, 0, 0, 0);
      
      const todayOnly = new Date(now);
      todayOnly.setHours(0, 0, 0, 0);
      
      if (todayOnly.getTime() < appointmentDateOnly.getTime()) {
        console.log('Cannot complete: Current date is before appointment date');
        return false;
      }
      
      // 2. Không thể hoàn thành quá 1 ngày sau ngày hẹn (tránh hoàn thành muộn)
      const oneDayAfterAppointment = new Date(appointmentDateOnly);
      oneDayAfterAppointment.setDate(oneDayAfterAppointment.getDate() + 1);
      
      if (todayOnly.getTime() > oneDayAfterAppointment.getTime()) {
        console.log('Cannot complete: Too late, more than 1 day after appointment');
        return false;
      }
      
      // === ĐIỀU KIỆN THỜI GIAN ===
      
      // Tạo datetime hoàn chỉnh của appointment
      const appointmentDateTime = new Date(appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      
      // 3. Không thể hoàn thành trước giờ bắt đầu appointment
      if (now.getTime() < appointmentDateTime.getTime()) {
        console.log('Cannot complete: Current time is before appointment start time');
        return false;
      }
      
      // 4. Phải đợi ít nhất 15 phút từ lúc bắt đầu appointment
      const minutesPassed = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);
      
      if (minutesPassed < 15) {
        console.log(`Cannot complete: Only ${Math.floor(minutesPassed)} minutes passed, need at least 15 minutes`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking completion time:', error, appointment);
      return false;
    }
  };

  // Tính thời gian còn lại để có thể hoàn thành (tính bằng phút) và lý do chặn
  const getRemainingTimeToComplete = (appointment: Appointment) => {
    if (appointment.status !== 'in_progress') return 0;
    
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!appointment.appointment_date || !appointment.start_time) {
        console.warn('Missing appointment date or start time:', appointment);
        return 0;
      }

      const now = new Date();
      
      // Parse ngày hẹn (format: YYYY-MM-DD)
      const appointmentDate = new Date(appointment.appointment_date);
      
      // Parse giờ bắt đầu (format: HH:MM)
      const [hours, minutes] = appointment.start_time.split(':').map(Number);
      
      // Kiểm tra giá trị hợp lệ
      if (isNaN(appointmentDate.getTime()) || isNaN(hours) || isNaN(minutes)) {
        console.warn('Invalid date or time format:', appointment.appointment_date, appointment.start_time);
        return 0;
      }
      
      // Tạo datetime hoàn chỉnh
      const appointmentDateTime = new Date(appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      
      const minutesPassed = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);
      const remainingMinutes = 15 - minutesPassed;
      
      const result = Math.max(0, Math.ceil(remainingMinutes));
      
      // Kiểm tra kết quả hợp lệ
      if (isNaN(result)) {
        console.warn('Invalid calculation result:', result, {
          appointmentDateTime: appointmentDateTime.toISOString(),
          now: now.toISOString(),
          minutesPassed,
          remainingMinutes
        });
        return 0;
      }
      
      return result;
    } catch (error) {
      console.error('Error calculating remaining time:', error, appointment);
      return 0;
    }
  };

  // Lấy thông báo lý do không thể hoàn thành
  const getCompletionBlockedReason = (appointment: Appointment) => {
    if (appointment.status !== 'in_progress') {
      return 'Chỉ có thể hoàn thành buổi tư vấn đang diễn ra';
    }
    
    try {
      const now = new Date();
      const appointmentDate = new Date(appointment.appointment_date);
      const [hours, minutes] = appointment.start_time.split(':').map(Number);
      
      // Kiểm tra ngày
      const appointmentDateOnly = new Date(appointmentDate);
      appointmentDateOnly.setHours(0, 0, 0, 0);
      
      const todayOnly = new Date(now);
      todayOnly.setHours(0, 0, 0, 0);
      
      if (todayOnly.getTime() < appointmentDateOnly.getTime()) {
        return 'Không thể hoàn thành trước ngày hẹn';
      }
      
      const oneDayAfterAppointment = new Date(appointmentDateOnly);
      oneDayAfterAppointment.setDate(oneDayAfterAppointment.getDate() + 1);
      
      if (todayOnly.getTime() > oneDayAfterAppointment.getTime()) {
        return 'Quá hạn hoàn thành (chỉ cho phép trong vòng 1 ngày)';
      }
      
      // Kiểm tra thời gian
      const appointmentDateTime = new Date(appointmentDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      
      if (now.getTime() < appointmentDateTime.getTime()) {
        return 'Chưa đến giờ bắt đầu buổi tư vấn';
      }
      
      const minutesPassed = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);
      if (minutesPassed < 15) {
        const remaining = Math.ceil(15 - minutesPassed);
        return `Cần chờ thêm ${remaining} phút nữa để hoàn thành`;
      }
      
      return '';
    } catch (error) {
      return 'Lỗi kiểm tra thời gian';
    }
  };

  // Kiểm tra trạng thái chuyển đổi hợp lệ theo role
  const canTransitionTo = (currentStatus: string, targetStatus: string, userRole: string = 'consultant'): boolean => {
    // Base transition rules
    const baseTransitions: Record<string, string[]> = {
      'pending': ['confirmed'],
      'confirmed': ['in_progress'], 
      'in_progress': ['completed'],
      'completed': [], // Trạng thái cuối
      'cancelled': []  // Trạng thái cuối
    };
    
         // Cancel permissions by role
     const cancelPermissions: Record<string, string[]> = {
       'customer': ['pending', 'confirmed'], // Khách hàng có thể hủy pending và confirmed
       'consultant': ['pending'], // Chuyên gia chỉ có thể hủy pending
       'staff': ['pending', 'confirmed', 'in_progress'], // Staff có thể hủy bất cứ lúc nào
       'admin': ['pending', 'confirmed', 'in_progress'] // Admin có thể hủy bất cứ lúc nào
     };
    
    if (targetStatus === 'cancelled') {
      return cancelPermissions[userRole]?.includes(currentStatus) || false;
    }
    
    return baseTransitions[currentStatus]?.includes(targetStatus) || false;
  };

  // Lấy danh sách hành động khả dụng cho appointment theo role
  const getAvailableActions = (appointment: Appointment, userRole: string = 'consultant') => {
    const actions = [];
    
    // Action "Xem chi tiết" luôn có
    actions.push('view');
    
    // Actions dựa trên trạng thái và role
    switch (appointment.status) {
      case 'pending':
        if (canTransitionTo('pending', 'confirmed', userRole)) {
          actions.push('confirm');
        }
        if (canTransitionTo('pending', 'cancelled', userRole)) {
          actions.push('cancel');
        }
        break;
      case 'confirmed':
        if (canTransitionTo('confirmed', 'in_progress', userRole)) {
          actions.push('start');
        }
        if (canTransitionTo('confirmed', 'cancelled', userRole)) {
          actions.push('cancel');
        }
        break;
      case 'in_progress':
        if (canTransitionTo('in_progress', 'completed', userRole) && canCompleteAppointment(appointment)) {
          actions.push('complete');
        }
        if (canTransitionTo('in_progress', 'cancelled', userRole)) {
          actions.push('cancel');
        }
        break;
      case 'completed':
      case 'cancelled':
        // Chỉ xem chi tiết
        break;
    }
    
    return actions;
  };

  // Lấy thông báo trạng thái cho appointment
  const getStatusMessage = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'pending':
        return 'Đang chờ chuyên gia xác nhận';
      case 'confirmed':
        return 'Đã xác nhận, sẵn sàng bắt đầu tư vấn';
      case 'in_progress':
        return canCompleteAppointment(appointment) 
          ? 'Đang tư vấn, có thể hoàn thành' 
          : `Đang tư vấn, ${getCompletionBlockedReason(appointment)}`;
      case 'completed':
        return 'Buổi tư vấn đã hoàn thành';
      case 'cancelled':
        return 'Lịch hẹn đã bị hủy';
      default:
        return 'Trạng thái không xác định';
    }
  };

  const columns: TableColumn<Appointment>[] = [
    {
      name: 'Khách hàng',
      cell: (row) => (
        <div className="py-2 min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {row.customer_id?.full_name || 'Không có thông tin'}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {row.customer_id?.email || 'Không có email'}
          </div>
          {row.customer_id?.phone && (
            <div className="text-sm text-gray-500 truncate">{row.customer_id.phone}</div>
          )}
        </div>
      ),
      sortable: true,
      width: '250px',
      wrap: true,
    },
    {
      name: 'Ngày & Giờ',
      cell: (row) => {
        const priority = getAppointmentPriority(row);
        const priorityColors = {
          urgent: 'text-red-600 font-semibold',
          soon: 'text-orange-600 font-medium',
          pending: 'text-yellow-600',
          normal: 'text-gray-900'
        };
        
        return (
          <div className={`py-2 min-w-0 ${priorityColors[priority]}`}>
            <div className="font-medium whitespace-nowrap">{formatDate(row.appointment_date)}</div>
            <div className="text-sm whitespace-nowrap">{row.start_time} - {row.end_time}</div>
            {priority === 'urgent' && (
              <div className="text-xs text-red-500 font-semibold whitespace-nowrap">
                <Icon name="⚠️" className="mr-1" />
                Sắp diễn ra
              </div>
            )}
            {priority === 'soon' && (
              <div className="text-xs text-orange-500 whitespace-nowrap">
                <Icon name="⏰" className="mr-1" />
                Trong 24h
              </div>
            )}
          </div>
        );
      },
      sortable: true,
      width: '180px',
    },
    {
      name: 'Trạng thái',
      cell: (row) => (
        <div className="py-2">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${statusColors[row.status]} cursor-help`}
            title={getStatusMessage(row)}
          >
            {statusLabels[row.status]}
          </span>
          {row.status === 'in_progress' && !canCompleteAppointment(row) && (
            <div className="text-xs text-orange-600 mt-1 font-medium">
              ⏳ Chờ hoàn thành
            </div>
          )}
          {row.status === 'in_progress' && canCompleteAppointment(row) && (
            <div className="text-xs text-green-600 mt-1 font-medium">
              ✅ Sẵn sàng
            </div>
          )}
        </div>
      ),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Ghi chú khách hàng',
      cell: (row) => (
        <div className="py-2 min-w-0">
          {row.customer_notes ? (
            <div className="text-sm text-gray-600 truncate" title={row.customer_notes}>
              {row.customer_notes}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic whitespace-nowrap">Không có ghi chú</span>
          )}
        </div>
      ),
      width: '200px',
      wrap: true,
    },
    {
      name: 'Ngày tạo',
      selector: row => row.created_date,
      format: row => formatDateTime(row.created_date),
      sortable: true,
      width: '160px',
    },
    {
      name: 'Hành động',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 py-2 min-w-0">
          <button
            onClick={() => {
              setSelectedAppointment(row);
              setConsultantNotes(row.consultant_notes || '');
            }}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors whitespace-nowrap"
            title="Xem chi tiết"
          >
            👁️ Chi tiết
          </button>
          
          {row.status === 'pending' && (
            <button
              onClick={() => handleConfirmAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center"
              title="Xác nhận lịch hẹn"
            >
              {actionLoading === row._id ? (
                <Icon name="⏳" className="mr-1" />
              ) : (
                <Icon name="✅" className="mr-1" />
              )}
              Xác nhận
            </button>
          )}
          
          {row.status === 'confirmed' && (
            <button
              onClick={() => handleStartMeeting(row._id)}
              disabled={actionLoading === row._id}
              className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center"
              title="Bắt đầu buổi tư vấn"
            >
              {actionLoading === row._id ? (
                <Icon name="⏳" className="mr-1" />
              ) : (
                <Icon name="▶️" className="mr-1" />
              )}
              Bắt đầu
            </button>
          )}
          
          {row.status === 'in_progress' && (
            <button
              onClick={() => {
                setSelectedAppointment(row);
                setConsultantNotes(row.consultant_notes || '');
              }}
              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
              title="Hoàn thành buổi tư vấn"
            >
              ✅ Hoàn thành
            </button>
          )}
          
          {canTransitionTo(row.status, 'cancelled', 'consultant') && (
            <button
              onClick={() => handleCancelAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center"
              title={`Hủy lịch hẹn (Chỉ được phép hủy lúc pending)`}
            >
              {actionLoading === row._id ? (
                <Icon name="⏳" className="mr-1" />
              ) : (
                <Icon name="❌" className="mr-1" />
              )}
              Hủy
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      width: '280px',
      wrap: true,
    },
  ];

  const customStyles = {
    table: {
      style: {
        minWidth: '1200px', // Đảm bảo table có width tối thiểu
      },
    },
    header: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '52px',
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    headCells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        minHeight: '80px',
        borderBottom: '1px solid #f3f4f6',
        '&:hover': {
          backgroundColor: '#f8fafc',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý Lịch Tư vấn</h1>
              <p className="mt-2 text-gray-600 text-sm lg:text-base">
                Xin chào <span className="font-semibold">{user?.full_name}</span>, 
                quản lý lịch hẹn tư vấn của bạn tại đây.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchAppointments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Icon name="🔄" className="mr-2" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Auto Confirm Status */}
        <div className="mb-6">
          <AutoConfirmStatus />
        </div>



        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Tổng lịch hẹn</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-blue-500 text-2xl">
                <Icon name="📅" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="text-yellow-500 text-2xl">
                <Icon name="⏳" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Đã xác nhận</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="text-green-500 text-2xl">
                <Icon name="✅" size={32} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Đang tư vấn</p>
                <p className="text-2xl font-bold text-blue-700">{stats.in_progress}</p>
              </div>
              <div className="text-blue-600 text-2xl">💬</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-emerald-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="text-emerald-500 text-2xl">🎉</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="text-red-500 text-2xl">❌</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={appointments}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50]}
              highlightOnHover
              pointerOnHover
              customStyles={customStyles}
              responsive={false}
              fixedHeader={true}
              fixedHeaderScrollHeight="600px"
              noDataComponent={
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    <Icon name="📅" size={64} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn nào</h3>
                  <p className="text-gray-500">
                    {filter === 'all' 
                      ? 'Chưa có lịch hẹn nào được tạo.'
                      : `Không có lịch hẹn nào với trạng thái "${filterOptions.find(f => f.value === filter)?.label}".`
                    }
                  </p>
                </div>
              }
            />
          </div>
        </div>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            consultantNotes={consultantNotes}
            setConsultantNotes={setConsultantNotes}
            onClose={() => {
              setSelectedAppointment(null);
              setConsultantNotes('');
            }}
            onConfirm={handleConfirmAppointment}
            onStart={handleStartMeeting}
            onComplete={handleCompleteAppointment}
            onCancel={handleCancelAppointment}
            canCompleteAppointment={canCompleteAppointment}
            canTransitionTo={canTransitionTo}
            getCompletionBlockedReason={getCompletionBlockedReason}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;