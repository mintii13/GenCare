import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Col, Select, Button, Tag, Space, Typography } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import { appointmentService } from '../../../services/appointmentService';
import GoogleAuthStatus from '../../../components/common/GoogleAuthStatus';
import { getGoogleAccessToken } from '../../../utils/authUtils';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import ResourceList from '../../../components/common/ResourceList';
import { 
  Appointment,
  AppointmentQuery,
  AppointmentStats,
  PaginationInfo
} from '../../../types/appointment';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaPlay, 
  FaEye, 
  FaExclamationTriangle,
  FaClock,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const { Option } = Select;
const { Text } = Typography;

const AppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  const { modalState, showConfirm, hideConfirm } = useConfirmModal();
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(prev => ({
        ...prev,
        page: 1,
        search: searchTerm.trim() || undefined
      }));
    }, 1000); // Tăng debounce time từ 500ms lên 1000ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Kiểm tra xem có phải search không
    const isSearching = Boolean(query.search && query.search.length > 0);
    fetchAppointments(isSearching);
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

  const fetchAppointments = async (isSearching = false) => {
    try {
      // Chỉ show loading spinner khi không phải search
      if (!isSearching) {
        setLoading(true);
      }
      
      // Check if user is authenticated and has consultant role
      if (!user) {
        showNotification('error', 'Bạn cần đăng nhập để xem lịch hẹn');
        return;
      }
      
      if (user.role !== 'consultant') {
        showNotification('error', 'Bạn không có quyền truy cập trang này');
        return;
      }
      
      const response = await appointmentService.getConsultantAppointmentsPaginated(query);
      
      if (response.success) {
        
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
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'success') {
      toast.success(message);
    } else if (type === 'warning') {
      toast(message, { icon: '⚠️' });
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
          showNotification('error', data.message || 'Có lỗi xảy ra khi xác nhận lịch hẹn');
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
      setActionLoading(`start-${appointmentId}`);
    try {
      const googleAccessToken = await getGoogleAccessToken();
      const data = await appointmentService.startMeeting(appointmentId, googleAccessToken || undefined);
      
      if (data.success) {
        showNotification('success', 'Cuộc họp đã được bắt đầu');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Có lỗi xảy ra khi bắt đầu cuộc họp');
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

      setActionLoading(`complete-${selectedAppointment._id}`);
    try {
      const data = await appointmentService.completeAppointment(selectedAppointment._id, consultantNotes);
      
      if (data.success) {
        showNotification('success', 'Đã hoàn thành lịch hẹn');
        setSelectedAppointment(null);
        setConsultantNotes('');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Có lỗi xảy ra khi hoàn thành lịch hẹn');
      }
    } catch (err: any) {
      console.error('Error completing appointment:', err);
      showNotification('error', err.message || 'Có lỗi xảy ra khi hoàn thành lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setActionLoading(`cancel-${appointmentId}`);
    try {
      const data = await appointmentService.cancelAppointment(appointmentId);
      
      if (data.success) {
        showNotification('success', 'Đã hủy lịch hẹn');
        fetchAppointments();
      } else {
        showNotification('error', data.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
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
  // Table columns configuration
  const getTableColumns = () => [
    {
      title: 'Khách hàng',
      dataIndex: ['customer_id', 'full_name'],
      key: 'customer_name',
      render: (name: string, record: Appointment) => (
        <div>
          <div className="font-medium text-gray-900">{name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{record.customer_id?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Ngày & Giờ',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (date: string, record: Appointment) => (
        <div>
          <div className="font-medium">{formatDate(date)}</div>
          <div className="text-sm text-gray-500">
            {record.start_time} - {record.end_time}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          confirmed: 'green',
          in_progress: 'blue',
          completed: 'green',
          cancelled: 'red'
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {statusLabels[status as keyof typeof statusLabels]}
          </Tag>
        );
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'customer_notes',
      key: 'customer_notes',
      render: (notes: string) => (
        <div className="max-w-xs">
          <Text ellipsis={notes ? { tooltip: notes } : false}>
            {notes || 'Không có ghi chú'}
          </Text>
        </div>
      ),
    },
         {
       title: 'Thao tác',
       key: 'actions',
       render: (_: any, record: Appointment) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() => setSelectedAppointment(record)}
            size="small"
          >
            Chi tiết
          </Button>
          
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                onClick={() => handleConfirmAppointment(record._id)}
                loading={actionLoading === record._id}
                size="small"
                style={{ color: '#52c41a' }}
              >
                Xác nhận
              </Button>
              <Button
                type="link"
                onClick={() => handleCancelAppointment(record._id)}
                loading={actionLoading === record._id}
                size="small"
                danger
              >
                Hủy
              </Button>
            </>
          )}

          {record.status === 'confirmed' && (
            <Button
              type="link"
              onClick={() => handleStartMeeting(record._id)}
              loading={actionLoading === record._id}
              size="small"
              style={{ color: '#722ed1' }}
            >
              Bắt đầu
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Filter controls for ResourceList
  const filterControls = (
    <>
      <Col xs={24} sm={12} md={6}>
        <Select
          value={query.status || 'all'}
          onChange={handleStatusFilter}
          placeholder="Tất cả trạng thái"
          style={{ width: '100%' }}
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="pending">Chờ xác nhận</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="in_progress">Đang tư vấn</Option>
          <Option value="completed">Đã hoàn thành</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Select
          value={`${query.sort_by}_${query.sort_order}`}
          onChange={(value) => {
            // Split từ cuối để xử lý đúng với "appointment_date_asc"
            const lastUnderscoreIndex = value.lastIndexOf('_');
            const sort_by = value.substring(0, lastUnderscoreIndex);
            const sort_order = value.substring(lastUnderscoreIndex + 1);
            handleSortChange(sort_by, sort_order as 'asc' | 'desc');
          }}
          placeholder="Sắp xếp"
          style={{ width: '100%' }}
        >
          <Option value="appointment_date_asc">Ngày hẹn gần nhất</Option>
          <Option value="appointment_date_desc">Ngày hẹn xa nhất</Option>
          <Option value="created_date_desc">Tạo mới nhất</Option>
          <Option value="created_date_asc">Tạo cũ nhất</Option>
        </Select>
      </Col>
      
      <Col xs={24} sm={12} md={2}>
        <Button
          onClick={handleClearFilters}
          icon={<FaFilter />}
          title="Xóa bộ lọc"
          style={{ width: '100%' }}
        >
          Xóa lọc
        </Button>
      </Col>
    </>
  );

  // Convert appointment PaginationInfo to ResourceList PaginationInfo format
  const convertPagination = (paginationData: PaginationInfo) => ({
    current_page: paginationData.current_page,
    total_pages: paginationData.total_pages,
    total_items: paginationData.total_items,
    items_per_page: paginationData.items_per_page
  });

  const getAppointmentPriority = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.appointment_date);
    const now = new Date();
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 2 && appointment.status === 'confirmed') return 'urgent';
    if (diffHours < 24 && appointment.status === 'confirmed') return 'soon';
    if (appointment.status === 'pending') return 'pending';
    return 'normal';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 lg:py-6">
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

          
      {/* Appointments List using ResourceList */}
      <ResourceList
        resourceTitle=""
        tableColumns={getTableColumns()}
        rowKey="_id"
        data={appointments}
        loading={loading}
        pagination={convertPagination(pagination)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handlePageChange={handlePageChange}
        filterControls={filterControls}
        emptyText={
          query.search || query.status 
              ? 'Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.'
              : 'Bạn chưa có lịch hẹn nào từ khách hàng.'
                    }
      />

      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden"
            style={{ 
              width: '60vw', 
              maxWidth: '800px'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Chi tiết lịch hẹn</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex" style={{ height: '500px' }}>
              {/* Left Half - Appointment Info */}
              <div className="w-1/2 p-6 border-r border-gray-200">
                <div className="h-full flex flex-col">
                  {/* Status */}
                  <div className="mb-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[selectedAppointment.status]}`}>
                      {statusLabels[selectedAppointment.status]}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4 flex-1">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Khách hàng:</span>
                      <p className="font-medium text-gray-800">{selectedAppointment.customer_id?.full_name || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Email:</span>
                      <p className="font-medium text-gray-800">{selectedAppointment.customer_id?.email || 'N/A'}</p>
                    </div>

                    {selectedAppointment.customer_id?.phone && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-gray-600 text-sm font-medium block mb-1">Điện thoại:</span>
                        <p className="font-medium text-gray-800">{selectedAppointment.customer_id.phone}</p>
                      </div>
                    )}


                  </div>

                  {/* Complete Action for In Progress */}
                  {selectedAppointment.status === 'in_progress' && (
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú hoàn thành:
                      </label>
                      <textarea
                        value={consultantNotes}
                        onChange={(e) => setConsultantNotes(e.target.value)}
                        placeholder="Nhập ghi chú về cuộc tư vấn..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                      />
                      <button
                        onClick={handleCompleteAppointment}
                        disabled={actionLoading === selectedAppointment._id}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                      >
                        {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : 'Hoàn thành lịch hẹn'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Half - Notes & Details */}
              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <h5 className="text-lg font-bold text-gray-800 mb-4">Ghi chú & Chi tiết</h5>
                  <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      {selectedAppointment.customer_notes && (
                        <div>
                          <h6 className="font-semibold text-gray-800 mb-2">Ghi chú từ khách hàng:</h6>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedAppointment.customer_notes}</p>
                        </div>
                      )}
                      
                      {selectedAppointment.consultant_notes && (
                        <div className={selectedAppointment.customer_notes ? "border-t border-gray-200 pt-4" : ""}>
                          <h6 className="font-semibold text-gray-800 mb-2">Ghi chú của bạn:</h6>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedAppointment.consultant_notes}</p>
                        </div>
                      )}

                      <div className={selectedAppointment.customer_notes || selectedAppointment.consultant_notes ? "border-t border-gray-200 pt-4" : ""}>
                        <h6 className="font-semibold text-gray-800 mb-2">Thông tin buổi hẹn:</h6>
                        <div className="text-gray-700 space-y-2">
                          <p>• Trạng thái: {statusLabels[selectedAppointment.status]}</p>
                          <p>• Ngày hẹn: {formatDate(selectedAppointment.appointment_date)}</p>
                          <p>• Thời gian: {selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
                          <p>• Khách hàng: {selectedAppointment.customer_id?.full_name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h6 className="font-semibold text-gray-800 mb-2">Hướng dẫn:</h6>
                        <div className="text-gray-700 space-y-1">
                          {selectedAppointment.status === 'pending' && (
                            <p>• Cuộc hẹn đang chờ xác nhận</p>
                          )}
                          {selectedAppointment.status === 'confirmed' && (
                            <p>• Cuộc hẹn đã được xác nhận, sẵn sàng bắt đầu</p>
                          )}
                          {selectedAppointment.status === 'in_progress' && (
                            <p>• Cuộc hẹn đang diễn ra, có thể hoàn thành khi kết thúc</p>
                          )}
                          {selectedAppointment.status === 'completed' && (
                            <p>• Cuộc hẹn đã hoàn thành</p>
                          )}
                          <p>• Thời gian tư vấn: 30-60 phút/buổi</p>
                          <p>• Liên hệ khách hàng qua email hoặc điện thoại nếu cần</p>
                        </div>
                      </div>

                      {!selectedAppointment.customer_notes && !selectedAppointment.consultant_notes && (
                        <div className="text-center text-gray-500 mt-8">
                          <p>Chưa có ghi chú nào cho cuộc hẹn này.</p>
                          <p className="mt-2">Thông tin chi tiết sẽ được hiển thị tại đây.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={hideConfirm}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmVariant={modalState.confirmVariant}
        isLoading={modalState.isLoading}
      />
    </div>
  );
};

export default AppointmentManagement;