import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentService } from '../../../services/appointmentService';
import { consultantService } from '../../../services/consultantService';
import WeeklySlotPicker from '../../consultation/WeeklySlotPicker';
import FeedbackModal from '../../../components/feedback/FeedbackModal';
import FeedbackService from '../../../services/feedbackService';
import {
  Appointment,
  AppointmentQuery,
  PaginationInfo
} from '../../../types/appointment';
import { 
  FaCalendarAlt, 
  FaSpinner, 
  FaTimes, 
  FaSearch,
  FaChevronLeft, 
  FaChevronRight,
  FaFilter,
  FaSortAmountDown
} from 'react-icons/fa';

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    appointment_date: '',
    start_time: '',
    end_time: ''
  });
  const [selectedNewSlot, setSelectedNewSlot] = useState<{date: string, startTime: string, endTime: string} | null>(null);
  const [consultantDetails, setConsultantDetails] = useState<{[key: string]: any}>({});
  const [canFeedback, setCanFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

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

  // Re-render khi consultant details được cập nhật
  useEffect(() => {
    if (Object.keys(consultantDetails).length > 0) {
      // Force re-render để cập nhật tên chuyên gia
      setAppointments(prev => [...prev]);
    }
  }, [consultantDetails]);

  useEffect(() => {
    if (selectedAppointment && selectedAppointment.status === 'completed') {
      FeedbackService.canSubmitFeedback(selectedAppointment._id as any)
        .then(res => setCanFeedback(res.can_submit))
        .catch(() => setCanFeedback(false));
    } else {
      setCanFeedback(false);
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching appointments with query:', query);
      const response = await appointmentService.getMyAppointmentsPaginated(query);
      
      if (response.success) {
        console.log('✅ Appointments loaded:', response.data.appointments.length);
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
        
        // Fetch chi tiết chuyên gia cho tất cả appointments
        response.data.appointments.forEach((appointment: Appointment) => {
          const consultantId = appointment.consultant_id?._id;
          if (consultantId && !consultantDetails[consultantId]) {
            fetchConsultantDetails(consultantId);
          }
        });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
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
      sort_order: 'desc'
    });
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      console.log('Starting cancel appointment for ID:', appointmentId);
      const data = await appointmentService.cancelAppointment(appointmentId);
      
      console.log('Cancel appointment response:', data);
      
      if (data.success) {
        alert('Hủy lịch hẹn thành công');
        fetchAppointments();
      } else {
        console.error('Cancel failed with message:', data.message);
        alert(data.message);
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      
      // Detailed error handling
      if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Yêu cầu không hợp lệ';
        alert(`Lỗi: ${errorMsg}`);
      } else if (err.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        alert('Bạn không có quyền hủy lịch hẹn này.');
      } else if (err.response?.status === 404) {
        alert('Không tìm thấy lịch hẹn này.');
      } else {
        alert(err.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
      }
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time
    });
    setSelectedNewSlot(null);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedNewSlot({ date, startTime, endTime });
    setEditForm({
      appointment_date: date,
      start_time: startTime,
      end_time: endTime
    });
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !selectedNewSlot) return;

    console.log('=== DEBUG RESCHEDULE ===');
    console.log('editingAppointment._id:', editingAppointment._id);
    console.log('selectedNewSlot:', selectedNewSlot);
    console.log('localStorage token:', localStorage.getItem('gencare_auth_token'));
    
    try {
      const data = await appointmentService.rescheduleAppointment(
        editingAppointment._id,
        {
          appointment_date: selectedNewSlot.date,
          start_time: selectedNewSlot.startTime,
          end_time: selectedNewSlot.endTime
        }
      );
      
      if (data.success) {
        alert('Đổi lịch hẹn thành công! Chuyên gia sẽ xác nhận lại trong thời gian sớm nhất.');
        setEditingAppointment(null);
        setSelectedNewSlot(null);
        fetchAppointments();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      alert(err.message || 'Có lỗi xảy ra khi đổi lịch hẹn');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getConsultantSpecialization = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    if (consultantDetails[consultantId]) {
      return consultantDetails[consultantId].specialization || 'Tư vấn chung';
    }
    return appointment.consultant_id?.specialization || 'Tư vấn chung';
  };

  const fetchConsultantDetails = async (consultantId: string) => {
    try {
      if (consultantDetails[consultantId]) return;
      
      const response = await consultantService.getConsultantById(consultantId);
      if (response) {
        setConsultantDetails(prev => ({
          ...prev,
          [consultantId]: response
        }));
      }
    } catch (error) {
      console.error('Error fetching consultant details:', error);
    }
  };

  const getConsultantNameWithFetch = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    if (consultantDetails[consultantId]) {
      return consultantDetails[consultantId].user_id?.full_name || 'Chuyên gia';
    }
    
    // Fallback to appointment data
    return appointment.consultant_id?.user_id?.full_name || 'Chuyên gia';
  };

  // Generate page numbers for pagination
  const generatePageNumbers = (): number[] => {
    const pages: number[] = [];
    const { current_page, total_pages } = pagination;
    
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch hẹn của tôi</h1>
        <p className="text-gray-600">Quản lý và theo dõi các cuộc hẹn tư vấn của bạn</p>
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
                placeholder="Tìm kiếm theo tên chuyên gia, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              <option value="appointment_date_desc">Ngày hẹn mới nhất</option>
              <option value="appointment_date_asc">Ngày hẹn cũ nhất</option>
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaTimes className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

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
                        {getConsultantNameWithFetch(appointment)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(appointment.appointment_date)} • {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Chuyên khoa:</span> {getConsultantSpecialization(appointment)}
                      </div>
                    </div>

                    {appointment.customer_notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú:</span> {appointment.customer_notes}
                      </div>
                    )}

                    {appointment.consultant_notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú từ chuyên gia:</span> {appointment.consultant_notes}
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
                          onClick={() => handleEditAppointment(appointment)}
                          className="px-3 py-1 text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Đổi lịch
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Hủy hẹn
                        </button>
                      </>
                    )}

                    {appointment.status === 'completed' && canFeedback && (
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="px-3 py-1 text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Đánh giá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium">{(pagination.current_page - 1) * pagination.items_per_page + 1}</span> - <span className="font-medium">{Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)}</span> trong tổng số <span className="font-medium">{pagination.total_items}</span> lịch hẹn
                </p>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <FaChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </button>

                  {generatePageNumbers().map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] < page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md font-medium transition-colors ${
                          page === pagination.current_page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
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
              : 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch với chuyên gia ngay!'
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
                <span className="font-medium text-gray-700">Chuyên gia:</span>
                <p className="text-gray-900">{getConsultantNameWithFetch(selectedAppointment)}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Chuyên khoa:</span>
                <p className="text-gray-900">{getConsultantSpecialization(selectedAppointment)}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Ngày giờ:</span>
                <p className="text-gray-900">
                  {formatDate(selectedAppointment.appointment_date)} • {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
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
                  <span className="font-medium text-gray-700">Ghi chú của bạn:</span>
                  <p className="text-gray-900">{selectedAppointment.customer_notes}</p>
                </div>
              )}
              
              {selectedAppointment.consultant_notes && (
                <div>
                  <span className="font-medium text-gray-700">Ghi chú từ chuyên gia:</span>
                  <p className="text-gray-900">{selectedAppointment.consultant_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Đổi lịch hẹn</h3>
                <button 
                  onClick={() => setEditingAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">
                  Chọn khung giờ mới để đổi lịch hẹn với {getConsultantNameWithFetch(editingAppointment)}
                </p>
              </div>

              <WeeklySlotPicker
                consultantId={editingAppointment.consultant_id._id}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedNewSlot}
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateAppointment}
                  disabled={!selectedNewSlot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận đổi lịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Feedback Modal */}
       {showFeedbackModal && selectedAppointment && (
         <FeedbackModal
           isOpen={showFeedbackModal}
           onClose={() => setShowFeedbackModal(false)}
           appointmentInfo={{
             consultant_name: getConsultantNameWithFetch(selectedAppointment),
             appointment_date: formatDate(selectedAppointment.appointment_date),
             start_time: formatTime(selectedAppointment.start_time),
             end_time: formatTime(selectedAppointment.end_time)
           }}
           onSubmit={async (formData) => {
             await FeedbackService.submitFeedback(selectedAppointment._id as any, formData);
             setShowFeedbackModal(false);
             setCanFeedback(false);
           }}
         />
       )}
    </div>
  );
};

export default MyAppointments;