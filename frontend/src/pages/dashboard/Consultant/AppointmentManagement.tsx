import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import { appointmentService } from '../../../services/appointmentService';
import AutoConfirmStatus from '../../../components/common/AutoConfirmStatus';
import AppointmentDetailModal from '../../../components/appointments/AppointmentDetailModal';
import GoogleAuthStatus from '../../../components/common/GoogleAuthStatus';
import { getGoogleAccessToken, hasGoogleAccessToken } from '../../../utils/authUtils';
import { 
  Appointment,
  AppointmentQuery,
  PaginationInfo,
  AppointmentStats
} from '../../../types/appointment';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf, 
  FaPlay, 
  FaEye, 
  FaComments, 
  FaTrophy,
  FaExclamationTriangle,
  FaClock,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaLink,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';

const AppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState<AppointmentQuery>({
    page: 1,
    limit: 10,
    sort_by: 'appointment_date',
    sort_order: 'asc'
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(prev => ({
        ...prev,
        page: 1,
        search: searchTerm.trim() || undefined
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAppointments();
  }, [query]);

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
      
      console.log('🔍 Fetching consultant appointments with query:', query);
      const response = await appointmentService.getConsultantAppointmentsPaginated(query);
      
      if (response.success) {
        console.log('✅ Appointments loaded:', response.data.appointments.length);
        
        // Filter out appointments with null customer_id
        const validAppointments = response.data.appointments.filter((appointment: Appointment) => {
          const isValid = appointment && appointment.customer_id && appointment.customer_id.full_name;
          return isValid;
        });
        
        setAppointments(validAppointments);
        setPagination(response.data.pagination);
        calculateStats(validAppointments);
      } else {
        showNotification('error', response.message || 'Không thể tải danh sách lịch hẹn');
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
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

  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusFilter = (status: string) => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      status: status === 'all' ? undefined : status
    }));
  };

  const handleSortChange = (sort_by: string, sort_order: 'asc' | 'desc') => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      sort_by: sort_by as any,
      sort_order
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setQuery({
      page: 1,
      limit: 10,
      sort_by: 'appointment_date',
      sort_order: 'asc'
    });
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
    // Simple notification - có thể thay thế bằng toast library
    if (type === 'error') {
      console.error(message);
      // Có thể show toast notification ở đây
    } else if (type === 'success') {
      console.log(message);
      // Có thể show toast notification ở đây
    } else if (type === 'warning') {
      console.warn(message);
      // Có thể show toast notification ở đây
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      // Kiểm tra Google Access Token - BẮT BUỘC
      let googleAccessToken;
      try {
        googleAccessToken = await getGoogleAccessToken();
      } catch (error) {
        console.error('Error getting Google Access Token:', error);
        showNotification('error', 'Cần đăng nhập Google để tạo Google Meet link. Vui lòng đăng nhập Google trước.');
        setActionLoading('');
      return;
    }
    
    if (!googleAccessToken) {
        showNotification('error', 'Cần đăng nhập Google để tạo Google Meet link. Vui lòng đăng nhập Google trước.');
        setActionLoading('');
      return;
    }

      const data = await appointmentService.confirmAppointment(appointmentId, googleAccessToken);
      
      if (data.success) {
        showNotification('success', 'Đã xác nhận lịch hẹn và tạo Google Meet thành công');
        fetchAppointments();
      } else {
        if ((data as any).requiresGoogleAuth) {
          showNotification('error', 'Cần xác thực Google để tạo Google Meet link. Vui lòng đăng nhập Google.');
        } else {
          showNotification('error', data.message);
        }
      }
    } catch (err: any) {
      console.error('Error confirming appointment:', err);
      if (err.response?.status === 400 && err.response?.data?.requiresGoogleAuth) {
        showNotification('error', 'Cần đăng nhập Google để tạo Google Meet link');
      } else {
        showNotification('error', err.message || 'Có lỗi xảy ra khi xác nhận lịch hẹn');
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleStartMeeting = async (appointmentId: string) => {
      setActionLoading(appointmentId);
    try {
      const googleAccessToken = await getGoogleAccessToken();
      const data = await appointmentService.startMeeting(appointmentId, googleAccessToken || undefined);
      
      if (data.success) {
        showNotification('success', 'Cuộc họp đã được bắt đầu');
        fetchAppointments();
      } else {
        showNotification('error', data.message);
      }
    } catch (err: any) {
      console.error('Error starting meeting:', err);
      showNotification('error', err.message || 'Có lỗi xảy ra khi bắt đầu cuộc họp');
    } finally {
      setActionLoading('');
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

      setActionLoading(selectedAppointment._id);
    try {
      const data = await appointmentService.completeAppointment(selectedAppointment._id, consultantNotes);
      
      if (data.success) {
        showNotification('success', 'Đã hoàn thành lịch hẹn');
        setSelectedAppointment(null);
        setConsultantNotes('');
        fetchAppointments();
      } else {
        showNotification('error', data.message);
      }
    } catch (err: any) {
      console.error('Error completing appointment:', err);
      showNotification('error', err.message || 'Có lỗi xảy ra khi hoàn thành lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

      setActionLoading(appointmentId);
    try {
      const data = await appointmentService.cancelAppointment(appointmentId);
      
      if (data.success) {
        showNotification('success', 'Đã hủy lịch hẹn');
        fetchAppointments();
      } else {
        showNotification('error', data.message);
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      showNotification('error', err.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
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

  // Helper functions
  const canCompleteAppointment = (appointment: Appointment) => {
    return appointment.status === 'in_progress';
  };

  const getStatusMessage = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'pending':
        return 'Đang chờ chuyên gia xác nhận';
      case 'confirmed':
        return 'Đã xác nhận, sẵn sàng bắt đầu tư vấn';
      case 'in_progress':
        return 'Đang tư vấn';
      case 'completed':
        return 'Buổi tư vấn đã hoàn thành';
      case 'cancelled':
        return 'Lịch hẹn đã bị hủy';
      default:
        return 'Trạng thái không xác định';
    }
  };

  const canTransitionTo = (currentStatus: string, targetStatus: string, userRole: string = 'consultant'): boolean => {
    const baseTransitions: Record<string, string[]> = {
      'pending': ['confirmed'],
      'confirmed': ['in_progress'], 
      'in_progress': ['completed'],
      'completed': [],
      'cancelled': []
    };
    
     const cancelPermissions: Record<string, string[]> = {
      'customer': ['pending', 'confirmed'],
      'consultant': ['pending'],
      'staff': ['pending', 'confirmed', 'in_progress'],
      'admin': ['pending', 'confirmed', 'in_progress']
     };
    
    if (targetStatus === 'cancelled') {
      return cancelPermissions[userRole]?.includes(currentStatus) || false;
    }
    
    return baseTransitions[currentStatus]?.includes(targetStatus) || false;
  };

  // Generate page numbers for pagination
  const generatePageNumbers = (): number[] => {
    const pages: number[] = [];
    const current_page = pagination?.current_page || 1;
    const total_pages = pagination?.total_pages || 1;
    
    if (total_pages <= 1) return pages;
    
    // Always show first page
    pages.push(1);
    
    // Add pages around current page
    for (let i = Math.max(2, current_page - 1); i <= Math.min(total_pages - 1, current_page + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page
    if (total_pages > 1 && !pages.includes(total_pages)) {
      pages.push(total_pages);
    }
    
    return pages;
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
                <FaExclamationTriangle className="inline mr-1" />
                Sắp diễn ra
              </div>
            )}
            {priority === 'soon' && (
              <div className="text-xs text-orange-500 whitespace-nowrap">
                <FaClock className="inline mr-1" />
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
              <FaHourglassHalf className="inline mr-1" />
              Chờ hoàn thành
            </div>
          )}
          {row.status === 'in_progress' && canCompleteAppointment(row) && (
            <div className="text-xs text-green-600 mt-1 font-medium">
              <FaCheckCircle className="inline mr-1" />
              Sẵn sàng
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
            <FaEye className="inline mr-1" />
            Chi tiết
          </button>
          
          {row.status === 'pending' && (
            <button
              onClick={() => handleConfirmAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center"
              title="Xác nhận lịch hẹn"
            >
              {actionLoading === row._id ? (
                <FaSpinner className="animate-spin inline mr-1" />
              ) : (
                <FaCheck className="inline mr-1" />
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
                <FaSpinner className="animate-spin inline mr-1" />
              ) : (
                <FaPlay className="inline mr-1" />
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
              <FaCheckCircle className="inline mr-1" />
              Hoàn thành
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
                <FaSpinner className="animate-spin inline mr-1" />
              ) : (
                <FaTimes className="inline mr-1" />
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý lịch hẹn</h1>
            <p className="text-gray-600">Quản lý các cuộc hẹn tư vấn của bạn</p>
            </div>
          <div className="mt-4 sm:mt-0">
            <GoogleAuthStatus />
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="w-6 h-6 text-blue-600" />
              </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-gray-600">Tổng lịch hẹn</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaHourglassHalf className="w-6 h-6 text-yellow-600" />
              </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-gray-600">Chờ xác nhận</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
              <p className="text-gray-600">Đã xác nhận</p>
              </div>
            </div>
          </div>
          
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClock className="w-6 h-6 text-purple-600" />
              </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              <p className="text-gray-600">Hôm nay</p>
            </div>
              </div>
            </div>
          </div>
          
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search */}
          <div className="lg:col-span-5">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm !== query.search && (
                <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
              )}
              </div>
              </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={query.status || 'all'}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="in_progress">Đang tư vấn</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            </div>

          {/* Sort */}
          <div className="lg:col-span-3">
            <select
              value={`${query.sort_by}_${query.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                handleSortChange(sort_by, sort_order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="appointment_date_asc">Ngày hẹn gần nhất</option>
              <option value="appointment_date_desc">Ngày hẹn xa nhất</option>
              <option value="created_date_desc">Tạo mới nhất</option>
              <option value="created_date_asc">Tạo cũ nhất</option>
            </select>
          </div>
          
          {/* Clear Filters */}
          <div className="lg:col-span-1">
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Xóa bộ lọc"
            >
              <FaFilter className="w-4 h-4 mx-auto" />
            </button>
              </div>
              </div>
            </div>

      {/* Appointments List */}
      {appointments.length > 0 ? (
        <>
          <div className="space-y-6 mb-8">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.customer_id?.full_name || 'Khách hàng'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
          </div>
          
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
                        <FaCalendarAlt className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(appointment.appointment_date)} • {appointment.start_time} - {appointment.end_time}
                        </span>
              </div>
                      <div>
                        <span className="font-medium">Email:</span> {appointment.customer_id?.email || 'N/A'}
                </div>
            </div>

                    {appointment.customer_notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú từ khách hàng:</span> {appointment.customer_notes}
          </div>
                    )}

                    {appointment.consultant_notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú của bạn:</span> {appointment.consultant_notes}
              </div>
                    )}
              </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Chi tiết
                    </button>
                    
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirmAppointment(appointment._id)}
                          disabled={actionLoading === appointment._id}
                          className="px-3 py-1 text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === appointment._id ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          disabled={actionLoading === appointment._id}
                          className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleStartMeeting(appointment._id)}
                        disabled={actionLoading === appointment._id}
                        className="px-3 py-1 text-purple-600 hover:text-purple-800 text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === appointment._id ? 'Đang xử lý...' : 'Bắt đầu'}
                      </button>
                    )}
            </div>
          </div>
              </div>
            ))}
        </div>

          {/* Pagination */}
          {pagination?.total_pages && pagination.total_pages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium">{((pagination.current_page || 1) - 1) * (pagination.items_per_page || 10) + 1}</span> - <span className="font-medium">{Math.min((pagination.current_page || 1) * (pagination.items_per_page || 10), pagination.total_items || 0)}</span> trong tổng số <span className="font-medium">{pagination.total_items || 0}</span> lịch hẹn
                </p>
                
                <div className="flex items-center space-x-1">
              <button
                    onClick={() => handlePageChange((pagination.current_page || 1) - 1)}
                    disabled={!pagination?.has_prev}
                    className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <FaChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </button>

                  {generatePageNumbers().map((page: number, index: number, array: number[]) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] < page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md font-medium transition-colors ${
                          page === (pagination.current_page || 1)
                    ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                        {page}
              </button>
                    </React.Fragment>
            ))}

                  <button
                    onClick={() => handlePageChange((pagination.current_page || 1) + 1)}
                    disabled={!pagination?.has_next}
                    className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Sau
                    <FaChevronRight className="w-4 h-4 ml-1" />
                  </button>
          </div>
        </div>
            </div>
          )}
        </>
      ) : !loading && (
                <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                  </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có lịch hẹn nào
          </h3>
          <p className="text-gray-600 mb-6">
            {query.search || query.status 
              ? 'Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.'
              : 'Bạn chưa có lịch hẹn nào từ khách hàng.'
                    }
                  </p>
          {(query.search || query.status) && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
                </div>
      )}

      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Chi tiết lịch hẹn</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
          </div>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Khách hàng:</span>
                <p className="text-gray-900">{selectedAppointment.customer_id?.full_name || 'N/A'}</p>
        </div>

              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{selectedAppointment.customer_id?.email || 'N/A'}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Ngày giờ:</span>
                <p className="text-gray-900">
                  {formatDate(selectedAppointment.appointment_date)} • {selectedAppointment.start_time} - {selectedAppointment.end_time}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Trạng thái:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${statusColors[selectedAppointment.status]}`}>
                  {statusLabels[selectedAppointment.status]}
                </span>
              </div>
              
              {selectedAppointment.customer_notes && (
                <div>
                  <span className="font-medium text-gray-700">Ghi chú từ khách hàng:</span>
                  <p className="text-gray-900">{selectedAppointment.customer_notes}</p>
                </div>
              )}
              
              {selectedAppointment.consultant_notes && (
                <div>
                  <span className="font-medium text-gray-700">Ghi chú của bạn:</span>
                  <p className="text-gray-900">{selectedAppointment.consultant_notes}</p>
                </div>
              )}
            </div>

            {selectedAppointment.status === 'in_progress' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú hoàn thành:
                </label>
                <textarea
                  value={consultantNotes}
                  onChange={(e) => setConsultantNotes(e.target.value)}
                  placeholder="Nhập ghi chú về cuộc tư vấn..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleCompleteAppointment}
                  disabled={actionLoading === selectedAppointment._id}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : 'Hoàn thành lịch hẹn'}
                </button>
              </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;