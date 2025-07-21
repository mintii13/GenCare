import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentService } from '../../../services/appointmentService';
import { consultantService } from '../../../services/consultantService';
import WeeklySlotPicker from '../../consultation/WeeklySlotPicker';
import FeedbackModal from '../../../components/feedback/FeedbackModal';
import FeedbackService from '../../../services/feedbackService';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import {
  Appointment,
  AppointmentQuery,
  PaginationInfo
} from '../../../types/appointment';
import { 
  FaCalendarAlt, 
  FaSpinner, 
  FaTimes, 
  FaFilter
} from 'react-icons/fa';
import { ResourceTable } from '../../../components/common/ResourceTable';
import { useNavigate } from 'react-router-dom';

interface FeedbackFormData {
  rating: number;
  comment: string;
}

const MyAppointments: React.FC = () => {
  const { modalState, showConfirm, hideConfirm } = useConfirmModal();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [selectedNewSlot, setSelectedNewSlot] = useState<{date: string, startTime: string, endTime: string} | null>(null);
  const [consultantDetails, setConsultantDetails] = useState<{[key: string]: {full_name: string, specialization: string, avatar?: string}}>({});
  // Feedback modal open condition handled per appointment (no global canFeedback)
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
    sort_order: 'desc',
    status: undefined // Xóa filter status để hiển thị tất cả
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

  const navigate = useNavigate();

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

  // Remove canFeedback fetch; will verify server-side when submitting.

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
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  


  const handleStatusFilter = (status: string) => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      status: status === 'all' ? undefined : status
    }));
  };

  const handleSortChange = (sort_by: 'appointment_date' | 'created_date', sort_order: 'asc' | 'desc') => {

    setQuery(prev => {
      const newQuery = {
        ...prev,
        page: 1,
        sort_by,
        sort_order
      };

      return newQuery;
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setQuery({
      page: 1,
      limit: 10,
      sort_by: 'appointment_date',
      sort_order: 'asc',
      status: undefined
    });
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    showConfirm(
      {
        title: "Xác nhận hủy lịch hẹn",
        description: "Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.",
        confirmText: "Hủy lịch hẹn",
        cancelText: "Không",
        confirmVariant: "destructive"
      },
      async () => {
        try {
          console.log('Starting cancel appointment for ID:', appointmentId);
          const data = await appointmentService.cancelAppointment(appointmentId);
          
          console.log('Cancel appointment response:', data);
          
          if (data.success) {
            toast.success('Hủy lịch hẹn thành công!');
            fetchAppointments();
          } else {
            console.error('Cancel failed with message:', data.message);
            toast.error(data.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
          }
        } catch (error: unknown) {
          console.error('Error cancelling appointment:', error);
          const err = error as { response?: { status: number; data?: { message?: string; details?: string } }; message?: string };
          
          // Detailed error handling
          if (err.response?.status === 400) {
            const errorMsg = err.response?.data?.message || err.response?.data?.details || 'Yêu cầu không hợp lệ';
            toast.error(`Lỗi: ${errorMsg}`);
          } else if (err.response?.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          } else if (err.response?.status === 403) {
            toast.error('Bạn không có quyền hủy lịch hẹn này.');
          } else if (err.response?.status === 404) {
            toast.error('Không tìm thấy lịch hẹn này.');
          } else {
            toast.error(err.message || 'Có lỗi xảy ra khi hủy lịch hẹn');
          }
        }
      }
    );
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedNewSlot(null);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedNewSlot({ date, startTime, endTime });
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
        toast.success('Đổi lịch hẹn thành công! Chuyên gia sẽ xác nhận lại trong thời gian sớm nhất.');
        setEditingAppointment(null);
        setSelectedNewSlot(null);
        fetchAppointments();
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi đổi lịch hẹn');
      }
    } catch (error: unknown) {
      console.error('Error updating appointment:', error);
      const err = error as { message?: string };
      toast.error(err.message || 'Có lỗi xảy ra khi đổi lịch hẹn');
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
      
      const response = await consultantService.getConsultantById(consultantId) as unknown as { data: { consultant: { full_name: string; specialization: string; avatar?: string } } };
      if (response && response.data && response.data.consultant) {
        setConsultantDetails(prev => ({
          ...prev,
          [consultantId]: response.data.consultant
        }));
      }
    } catch (error) {
      console.error('Error fetching consultant details:', error);
    }
  };

  const getConsultantNameWithFetch = (appointment: Appointment) => {
    const consultantId = appointment.consultant_id?._id;
    if (consultantDetails[consultantId]) {
      return consultantDetails[consultantId].full_name || 'Chuyên gia';
    }
    
    // Fallback to appointment data
    return appointment.consultant_id?.user_id?.full_name || 'Chuyên gia';
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (formData: FeedbackFormData) => {
    if (!selectedAppointment) return;
    
    try {
      const response = await FeedbackService.submitFeedback(selectedAppointment._id, formData);
      if (response.success) {
        // Hiển thị toast thành công
        toast.success(selectedAppointment.feedback 
          ? 'Đánh giá đã được cập nhật thành công!' 
          : 'Đánh giá đã được gửi thành công! Cảm ơn bạn đã chia sẻ.'
        );
        
        // Cập nhật state appointment để thay đổi nút
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt._id === selectedAppointment._id 
              ? { 
                  ...apt, 
                  feedback: { 
                    rating: formData.rating as number, 
                    comment: formData.comment,
                    feedback_date: new Date().toISOString()
                  } 
                } as Appointment
              : apt
          )
        );
        
        // Đóng modal và reset selected appointment
        setShowFeedbackModal(false);
        setSelectedAppointment(null);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    }
  };

  // Generate page numbers for pagination


  // 1. Định nghĩa columns cho bảng lịch hẹn (Appointment)
  const columns = [
    {
      title: 'Chuyên gia',
      dataIndex: 'consultant',
      key: 'consultant',
      render: (_value: unknown, record: Appointment) => (
        <div className="flex items-center gap-2">
          <img
            src={consultantDetails[record.consultant_id?._id]?.avatar || '/default-avatar.png'}
            alt={getConsultantNameWithFetch(record)}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar.png';
            }}
          />
          <span>{getConsultantNameWithFetch(record)}</span>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (_value: unknown, record: Appointment) => getConsultantSpecialization(record),
    },
    {
      title: 'Ngày',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Thời gian',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (_value: unknown, record: Appointment) => `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>{statusLabels[status as keyof typeof statusLabels]}</span>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'customer_notes',
      key: 'customer_notes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => (
        <div className="relative group">
          <span className="block truncate">{notes || '-'}</span>
          {notes && notes.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs whitespace-normal shadow-lg">
              {notes}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_value: unknown, record: Appointment) => (
        <div className="flex flex-col gap-1">
          <button onClick={() => setSelectedAppointment(record)} className="text-blue-600 hover:underline">Chi tiết</button>
          {record.status === 'pending' && (
            <>
              <button onClick={() => handleEditAppointment(record)} className="text-green-600 hover:underline">Đổi lịch</button>
              <button onClick={() => handleCancelAppointment(record._id)} className="text-red-600 hover:underline">Hủy hẹn</button>
            </>
          )}
          {record.status === 'completed' && !record.feedback && (
            <button onClick={() => { setSelectedAppointment(record); setShowFeedbackModal(true); }} className="text-purple-600 hover:underline">
              Đánh giá
            </button>
          )}
        </div>
      ),
    },
  ];

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">


      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Lịch hẹn của tôi</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition-colors"
            onClick={() => navigate('/consultation/book')}
          >
            Đặt lịch mới
          </button>
        </div>
        <ResourceTable
          data={appointments}
          columns={columns}
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.items_per_page,
            total: pagination.total_items,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} của ${total} lịch hẹn`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page: number, pageSize: number) => {
              setQuery(prev => ({ ...prev, page, limit: pageSize }));
            },
          }}
          filters={
            <div className="flex flex-row items-center gap-4 justify-center">
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
              <select
                value={`${query.sort_by}_${query.sort_order}`}
                onChange={(e) => {
                  const value = e.target.value;
                  let sort_by: string;
                  let sort_order: 'asc' | 'desc';
                  if (value === 'appointment_date_desc') {
                    sort_by = 'appointment_date';
                    sort_order = 'desc';
                  } else if (value === 'appointment_date_asc') {
                    sort_by = 'appointment_date';
                    sort_order = 'asc';
                  } else if (value === 'created_date_desc') {
                    sort_by = 'created_date';
                    sort_order = 'desc';
                  } else if (value === 'created_date_asc') {
                    sort_by = 'created_date';
                    sort_order = 'asc';
                  } else {
                    const lastUnderscoreIndex = value.lastIndexOf('_');
                    sort_by = value.substring(0, lastUnderscoreIndex);
                    sort_order = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
                  }
                  handleSortChange(sort_by as 'appointment_date' | 'created_date', sort_order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="appointment_date_desc">Ngày hẹn mới nhất</option>
                <option value="appointment_date_asc">Ngày hẹn cũ nhất</option>
                <option value="created_date_desc">Tạo mới nhất</option>
                <option value="created_date_asc">Tạo cũ nhất</option>
              </select>
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Xóa bộ lọc"
              >
                <FaFilter className="w-4 h-4 mx-auto" />
              </button>
            </div>
          }
        />
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
          {/* Pagination */}
          
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
           onClose={() => {
             setShowFeedbackModal(false);
             setSelectedAppointment(null);
           }}
           appointmentInfo={{
             consultant_name: getConsultantNameWithFetch(selectedAppointment),
             appointment_date: formatDate(selectedAppointment.appointment_date),
             start_time: formatTime(selectedAppointment.start_time),
             end_time: formatTime(selectedAppointment.end_time)
           }}
           existingFeedback={selectedAppointment.feedback ? {
             rating: selectedAppointment.feedback.rating,
             comment: selectedAppointment.feedback.comment
           } : undefined}
           onSubmit={handleFeedbackSubmit}
         />
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

export default MyAppointments;