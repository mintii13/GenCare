import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useAuth } from '../../../../contexts/AuthContext';
import { appointmentService } from '../../../../services/appointmentService';
import { consultantService } from '../../../../services/consultantService';
import toast from 'react-hot-toast';
import { 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaSync, 
  FaClock, 
  FaPhone, 
  FaUser, 
  FaUserMd, 
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaPlay,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';
import {
  Appointment,
  AppointmentQuery,
  PaginationInfo,
  AppointmentStats
} from '../../../../types/appointment';

interface Consultant {
  _id: string;
  user_id: {
    _id: string;
    full_name: string;
  };
  specialization: string;
}

const StaffAppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Kiểm tra quyền truy cập - chỉ staff mới được vào
  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <FaTimes className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600 mb-6">
            Chỉ có nhân viên mới có thể truy cập trang quản lý lịch hẹn này.
            {user?.role === 'consultant' && ' Bạn là chuyên gia tư vấn, vui lòng sử dụng trang chuyên gia.'}
            {user?.role === 'customer' && ' Bạn là khách hàng, vui lòng sử dụng trang khách hàng.'}
          </p>
          <button
            onClick={() => {
              if (user?.role === 'consultant') {
                window.location.href = '/consultant';
              } else if (user?.role === 'customer') {
                window.location.href = '/customer';
              } else {
                window.location.href = '/';
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Về trang chính
          </button>
        </div>
      </div>
    );
  }

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultantNotes, setConsultantNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
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

  const [query, setQuery] = useState<AppointmentQuery>({
    page: 1,
    limit: 10,
    sort_by: 'appointment_date',
    sort_order: 'desc'
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
    in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const filterOptions = [
    { value: 'all', label: 'Tất cả', count: stats.total },
    { value: 'pending', label: 'Chờ xác nhận', count: stats.pending },
    { value: 'confirmed', label: 'Đã xác nhận', count: stats.confirmed },
    { value: 'completed', label: 'Đã hoàn thành', count: stats.completed },
    { value: 'cancelled', label: 'Đã hủy', count: stats.cancelled }
  ];

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filter, selectedConsultant, dateRange]);

  const fetchConsultants = async () => {
    try {
      const response = await consultantService.getAllConsultants();
      if (response.data.consultants) {
        setConsultants(response.data.consultants as unknown as Consultant[]);
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointmentsPaginated(query);

      if (response.success) {
        const appointmentsList = response.data.appointments || [];
        setAppointments(appointmentsList);
        
        // Calculate stats
        const newStats = {
          total: appointmentsList.length,
          pending: appointmentsList.filter((a: Appointment) => a.status === 'pending').length,
          confirmed: appointmentsList.filter((a: Appointment) => a.status === 'confirmed').length,
          in_progress: appointmentsList.filter((a: Appointment) => a.status === 'in_progress').length,
          completed: appointmentsList.filter((a: Appointment) => a.status === 'completed').length,
          cancelled: appointmentsList.filter((a: Appointment) => a.status === 'cancelled').length,
          today: appointmentsList.filter((a: Appointment) => isToday(parseISO(a.appointment_date))).length
        };
        setStats(newStats);
        setPagination(response.data.pagination);
      } else {
        setAppointments([]);
        setStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          today: 0
        });
        toast.error(response.message || 'Không thể tải danh sách lịch hẹn');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Lỗi khi tải danh sách lịch hẹn');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId);
      const response = await appointmentService.confirmAppointment(appointmentId);
      
      if (response.success) {
        toast.success('Xác nhận lịch hẹn thành công!');
        fetchAppointments();
        setSelectedAppointment(null);
      } else {
        toast.error(response.message || 'Không thể xác nhận lịch hẹn');
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Lỗi khi xác nhận lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setActionLoading(appointmentId);
      const response = await appointmentService.cancelAppointment(appointmentId);
      
      if (response.success) {
        toast.success('Hủy lịch hẹn thành công!');
        fetchAppointments();
        setSelectedAppointment(null);
      } else {
        toast.error(response.message || 'Không thể hủy lịch hẹn');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Lỗi khi hủy lịch hẹn');
    } finally {
      setActionLoading('');
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Hôm nay, ${format(date, 'dd/MM')}`;
    if (isTomorrow(date)) return `Ngày mai, ${format(date, 'dd/MM')}`;
    if (isYesterday(date)) return `Hôm qua, ${format(date, 'dd/MM')}`;
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const formatTimeDisplay = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  // Filter appointments by search term
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customerName = appointment.customer_id?.full_name?.toLowerCase() || '';
    const consultantName = appointment.consultant_id?.user_id?.full_name?.toLowerCase() || '';
    const customerEmail = appointment.customer_id?.email?.toLowerCase() || '';
    
    return customerName.includes(searchLower) || 
           consultantName.includes(searchLower) ||
           customerEmail.includes(searchLower);
  });

  const columns: TableColumn<Appointment>[] = [
    {
      name: 'Khách hàng',
      selector: (row) => row.customer_id?.full_name || 'Không có thông tin',
      sortable: true,
      style: { minWidth: '180px' },
      cell: (row) => (
        <div className="py-2">
          <div className="font-medium text-gray-900">
            {row.customer_id?.full_name || 'Không có thông tin'}
          </div>
          <div className="text-sm text-gray-500">
            {row.customer_id?.email}
          </div>
          {row.customer_id?.phone && (
            <div className="text-sm text-gray-500 flex items-center">
              <FaPhone className="mr-1" size={12} />
              {row.customer_id.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      name: 'Chuyên gia',
      selector: (row) => row.consultant_id?.user_id?.full_name || 'Chưa phân công',
      sortable: true,
      style: { minWidth: '180px' },
      cell: (row) => (
        <div className="py-2">
          <div className="font-medium text-gray-900">
            {row.consultant_id?.user_id?.full_name || 'Chưa phân công'}
          </div>
          <div className="text-sm text-gray-500">
            {row.consultant_id?.specialization}
          </div>
        </div>
      ),
    },
    {
      name: 'Ngày & Giờ',
      selector: (row) => row.appointment_date,
      sortable: true,
      style: { minWidth: '200px' },
      cell: (row) => (
        <div className="py-2">
          <div className="font-medium text-gray-900">
            {formatDateDisplay(row.appointment_date)}
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <FaClock className="mr-1" size={12} />
            {formatTimeDisplay(row.start_time, row.end_time)}
          </div>
        </div>
      ),
    },
    {
      name: 'Trạng thái',
      selector: (row) => row.status,
      sortable: true,
      style: { minWidth: '120px' },
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[row.status]}`}>
          {statusLabels[row.status]}
        </span>
      ),
    },
    {
      name: 'Ghi chú khách hàng',
      selector: (row) => row.customer_notes || '',
      style: { minWidth: '200px' },
      cell: (row) => (
        <div className="py-2 max-w-xs">
          <div className="text-sm text-gray-600 truncate" title={row.customer_notes}>
            {row.customer_notes || 'Không có ghi chú'}
          </div>
        </div>
      ),
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
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors whitespace-nowrap flex items-center"
            title="Xem chi tiết"
          >
            <FaEye className="mr-1" size={12} />
            Chi tiết
          </button>
          
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleConfirmAppointment(row._id)}
                disabled={actionLoading === row._id}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center"
                title="Xác nhận lịch hẹn"
              >
                {actionLoading === row._id ? (
                  <FaSync className="mr-1 animate-spin" size={12} />
                ) : (
                  <FaCheck className="mr-1" size={12} />
                )}
                Xác nhận
              </button>
              <button
                onClick={() => handleCancelAppointment(row._id)}
                disabled={actionLoading === row._id}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center"
                title="Hủy lịch hẹn"
              >
                {actionLoading === row._id ? (
                  <FaSync className="mr-1 animate-spin" size={12} />
                ) : (
                  <FaTimes className="mr-1" size={12} />
                )}
                Hủy
              </button>
            </>
          )}
          
          {row.status === 'confirmed' && (
            <button
              onClick={() => handleCancelAppointment(row._id)}
              disabled={actionLoading === row._id}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors flex items-center"
              title="Hủy lịch hẹn"
            >
              {actionLoading === row._id ? (
                <FaSync className="mr-1 animate-spin" size={12} />
              ) : (
                <FaTimes className="mr-1" size={12} />
              )}
              Hủy
            </button>
          )}
        </div>
      ),
      style: { minWidth: '250px', allowOverflow: 'true' },
    },
  ];

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
      sort_order: 'desc'
    });
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý Tất cả Lịch Tư vấn</h1>
              <p className="mt-2 text-gray-600 text-sm lg:text-base">
                Xin chào <span className="font-semibold">{user?.full_name}</span>, 
                quản lý toàn bộ lịch hẹn tư vấn tại đây.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchAppointments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaSync className="mr-2" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {filterOptions.map((option) => (
            <div key={option.value} className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{option.count}</div>
              <div className="text-sm text-gray-600">{option.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={query.status || 'all'}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="in_progress">Đang tư vấn</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Consultant Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chuyên gia
              </label>
              <select
                value={selectedConsultant}
                onChange={(e) => setSelectedConsultant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả chuyên gia</option>
                {consultants.map((consultant) => (
                  <option key={consultant._id} value={consultant._id}>
                    {consultant.user_id.full_name} - {consultant.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm (tên khách hàng, chuyên gia, email)
            </label>
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <DataTable
            columns={columns}
            data={filteredAppointments}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 50]}
            highlightOnHover
            striped
            responsive
            noDataComponent={
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">
                  <FaCalendarAlt size={24} className="mx-auto" />
                </div>
                <div className="text-gray-500">Không có lịch hẹn nào</div>
                {(query.status !== 'all' || selectedConsultant !== 'all' || searchTerm || dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => {
                      handleStatusFilter('all');
                      setSelectedConsultant('all');
                      setSearchTerm('');
                      setDateRange({ startDate: '', endDate: '' });
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            }
            customStyles={{
              table: {
                style: {
                  backgroundColor: 'white',
                }
              },
              headRow: {
                style: {
                  backgroundColor: '#f8fafc',
                  borderBottomWidth: '1px',
                  borderBottomColor: '#e2e8f0',
                }
              },
              rows: {
                style: {
                  minHeight: '60px',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  }
                }
              }
            }}
          />
        </div>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết Lịch hẹn</h2>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setConsultantNotes('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FaUser className="mr-2" />
                      Thông tin khách hàng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Họ tên:</span>
                        <div className="font-medium">{selectedAppointment.customer_id?.full_name || 'Không có thông tin'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email:</span>
                        <div className="font-medium">{selectedAppointment.customer_id?.email}</div>
                      </div>
                      {selectedAppointment.customer_id?.phone && (
                        <div>
                          <span className="text-sm text-gray-600">Điện thoại:</span>
                          <div className="font-medium">{selectedAppointment.customer_id.phone}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consultant Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FaUserMd className="mr-2" />
                      Thông tin chuyên gia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Họ tên:</span>
                        <div className="font-medium">{selectedAppointment.consultant_id?.user_id?.full_name || 'Chưa phân công'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Chuyên môn:</span>
                        <div className="font-medium">{selectedAppointment.consultant_id?.specialization}</div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Thông tin lịch hẹn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Ngày:</span>
                        <div className="font-medium">{formatDateDisplay(selectedAppointment.appointment_date)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Giờ:</span>
                        <div className="font-medium">{formatTimeDisplay(selectedAppointment.start_time, selectedAppointment.end_time)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedAppointment.status]}`}>
                          {statusLabels[selectedAppointment.status]}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ngày tạo:</span>
                        <div className="font-medium">{format(parseISO(selectedAppointment.created_date), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FaClipboardList className="mr-2" />
                      Ghi chú
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Ghi chú của khách hàng:</span>
                        <div className="bg-white p-3 rounded border mt-1">
                          {selectedAppointment.customer_notes || 'Không có ghi chú'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ghi chú của chuyên gia:</span>
                        <div className="bg-white p-3 rounded border mt-1">
                          {selectedAppointment.consultant_notes || 'Chưa có ghi chú từ chuyên gia'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          * Chỉ chuyên gia mới có thể thêm/chỉnh sửa ghi chú này
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t mt-6">
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setConsultantNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                  
                  {selectedAppointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirmAppointment(selectedAppointment._id)}
                        disabled={actionLoading === selectedAppointment._id}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : (
                          <>
                            <FaCheck className="mr-2" />
                            Xác nhận
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(selectedAppointment._id)}
                        disabled={actionLoading === selectedAppointment._id}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : (
                          <>
                            <FaTimes className="mr-2" />
                            Hủy
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {selectedAppointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelAppointment(selectedAppointment._id)}
                      disabled={actionLoading === selectedAppointment._id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === selectedAppointment._id ? 'Đang xử lý...' : (
                        <>
                          <FaTimes className="mr-2" />
                          Hủy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointmentManagement;